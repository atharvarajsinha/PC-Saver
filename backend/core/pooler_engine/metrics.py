# pooler_engine/metrics.py
import statistics
import threading
import psutil
import time

class MetricsRecorder:
    """
    Tracks runtime statistics including actual connection reuse.
    """
    def __init__(self):
        # Request metrics
        self.successful_requests = 0
        self.failed_connections = 0
        self.queue_wait_times = []
        self.total_execution_time_ms = 0
        
        # Connection reuse metrics
        self.connections_created = 0
        self.connections_reused = 0
        self.peak_active_connections = 0
        
        # System metrics
        self.cpu_usage_percent = 0
        self.memory_usage_mb = 0
        self._lock = threading.Lock()
        self._cpu_samples = []
        self._mem_samples = []

    def update_wait_time(self, wait_seconds):
        with self._lock:
            self.queue_wait_times.append(wait_seconds * 1000)

    def record_utilization(self):
        with self._lock:
            self._cpu_samples.append(psutil.cpu_percent(interval=None))
            process = psutil.Process()
            mem_info = process.memory_info().rss / (1024 * 1024)
            self._mem_samples.append(mem_info)

    def finalize_utilization(self):
        with self._lock:
            self.cpu_usage_percent = (
                statistics.mean(self._cpu_samples) if self._cpu_samples else 0
            )
            self.memory_usage_mb = (
                statistics.mean(self._mem_samples) if self._mem_samples else 0
            )

    def increment_created(self):
        with self._lock:
            self.connections_created += 1

    def increment_reused(self):
        with self._lock:
            self.connections_reused += 1

    def update_peak(self, current_active):
        with self._lock:
            self.peak_active_connections = max(
                self.peak_active_connections, current_active
            )

    def increment_success(self):
        with self._lock:
            self.successful_requests += 1

    def increment_failure(self):
        with self._lock:
            self.failed_connections += 1

    def summary(self):
        avg_wait = statistics.mean(self.queue_wait_times) if self.queue_wait_times else 0
        self.finalize_utilization()
        
        total_connection_uses = self.connections_created + self.connections_reused
        connection_reuse_rate = (
            (self.connections_reused / total_connection_uses) * 100 
            if total_connection_uses > 0 else 0
        )
        
        return {
            "successful_requests": self.successful_requests,
            "failed_connections": self.failed_connections,
            "avg_queue_wait_ms": round(avg_wait, 2),
            "total_execution_time_ms": round(self.total_execution_time_ms, 2),
            "cpu_usage_percent": round(self.cpu_usage_percent, 2),
            "memory_usage_mb": round(self.memory_usage_mb, 2),
            "connections_created": self.connections_created,
            "connections_reused": self.connections_reused,
            "peak_active_connections": self.peak_active_connections,
            "connection_reuse_rate": round(connection_reuse_rate, 2),
            "total_connection_uses": total_connection_uses
        }