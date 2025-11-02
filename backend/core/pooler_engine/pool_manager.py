import threading
import queue
import time
from concurrent.futures import ThreadPoolExecutor
from .metrics import MetricsRecorder
from .db_client import execute_db_query
from .config import get_pool_config


class ConnectionPooler:
    """
    Python-based PostgreSQL connection pooler with actual connection reuse tracking.
    """
    def __init__(self, user_db, pool_config=None):
        from .config import get_pool_config
        config = pool_config or get_pool_config(user_db)
        self.user_db = user_db

        # Configuration parameters
        self.pool_size = config["pool_size"]
        self.queue_size = config["queue_size"]
        self.queue_timeout = config["queue_timeout_ms"] / 1000

        # Runtime state
        self.active_connections = 0
        self.connections_created = 0
        self.lock = threading.Lock()
        self.condition = threading.Condition(self.lock)
        self.wait_queue = queue.Queue(maxsize=self.queue_size)
        self.metrics = MetricsRecorder()
        self._shutdown = False

    def _execute_query(self, query):
        if self._shutdown:
            return "shutdown"
            
        start_wait = time.time()
        
        with self.condition:
            if self._shutdown:
                return "shutdown"
                
            # Try to get slot immediately
            if self.active_connections < self.pool_size:
                
                # DETERMINE IF NEW CONNECTION OR REUSE
                if self.connections_created < self.pool_size:
                    # This is a NEW connection
                    self.connections_created += 1
                    self.metrics.increment_created()
                    connection_type = "created"
                else:
                    # This is CONNECTION REUSE
                    self.metrics.increment_reused()
                    connection_type = "reused"
                
                self.active_connections += 1
                self.metrics.update_peak(self.active_connections)
                got_slot = True
            else:
                # Pool full - try to enter queue
                if self.wait_queue.full():
                    self.metrics.increment_failure()
                    return "try again later - queue full"
                
                # Add to queue and wait
                self.wait_queue.put(1)
                got_slot = False
                wait_start = time.time()
                
                while not got_slot and not self._shutdown:
                    remaining_time = self.queue_timeout - (time.time() - wait_start)
                    if remaining_time <= 0:
                        try:
                            self.wait_queue.get_nowait()
                        except queue.Empty:
                            pass
                        self.metrics.increment_failure()
                        return "try again later - timeout"
                    
                    self.condition.wait(remaining_time)
                    
                    # When we get a slot from the queue, it's ALWAYS REUSE
                    if self.active_connections < self.pool_size and not self._shutdown:
                        self.metrics.increment_reused()
                        self.active_connections += 1
                        self.metrics.update_peak(self.active_connections)
                        got_slot = True
                        self.wait_queue.get()
                        connection_type = "reused_from_queue"
        
        if self._shutdown:
            with self.condition:
                self.active_connections -= 1
                self.condition.notify()
            return "shutdown"

        wait_time = time.time() - start_wait
        self.metrics.update_wait_time(wait_time)

        try:
            if not self._shutdown:
                execute_db_query(self.user_db, query)
                self.metrics.increment_success()
        except Exception as e:
            self.metrics.increment_failure()
            print(f"Query execution error: {e}")
        finally:
            with self.condition:
                self.active_connections -= 1
                self.condition.notify()

    def execute_requests(self, query, num_requests):
        self._shutdown = False
        self.connections_created = 0
        self.active_connections = 0
        start_total = time.time()
        results = []

        try:
            with ThreadPoolExecutor(max_workers=min(num_requests, 100)) as executor:
                futures = [executor.submit(self._execute_query, query) for _ in range(num_requests)]

                sampler_stop = False
                def sampler():
                    while not sampler_stop:
                        self.metrics.record_utilization()
                        time.sleep(0.1)

                sampler_thread = threading.Thread(target=sampler, daemon=True)
                sampler_thread.start()

                for future in futures:
                    try:
                        result = future.result(timeout=self.queue_timeout + 10)
                        results.append(result)
                    except Exception as e:
                        results.append(f"Future error: {e}")

                sampler_stop = True
                sampler_thread.join()

        except Exception as e:
            print(f"Executor error: {e}")
            return {"error": f"Executor failed: {str(e)}"}

        self.metrics.total_execution_time_ms = (time.time() - start_total) * 1000
        summary = self.metrics.summary()
        summary['total_requests'] = num_requests
        
        # Efficiency calculations
        summary['connection_efficiency'] = {
            'pool_size': self.pool_size,
            'actual_connections_created': self.connections_created,
            'connection_utilization_percent': round(
                (self.connections_created / self.pool_size) * 100, 2
            ) if self.pool_size > 0 else 0,
            'maximum_possible_reuse': max(0, num_requests - self.connections_created),
            'actual_reuse_achieved': summary['connections_reused']
        }
        
        return summary

    def shutdown(self):
        """Gracefully shutdown the pooler"""
        self._shutdown = True
        with self.condition:
            self.condition.notify_all()