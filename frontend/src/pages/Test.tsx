import { useState, useEffect } from 'react';
import { Play, Loader } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface Database {
  id: number;
  host: string;
  dbname: string;
  pool_config: {
    pool_size: number;
    queue_size: number;
    queue_timeout_ms: number;
  };
}

interface TestResult {
  pool_config?: {
    pool_size: number;
    queue_size: number;
    queue_timeout_ms: number;
  };
  metrics: {
    successful_requests: number;
    failed_connections: number;
    avg_queue_wait_ms: number;
    total_execution_time_ms: number;
  };
}

export function Test() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDbId, setSelectedDbId] = useState<number | null>(null);
  const [numRequests, setNumRequests] = useState('50');
  const [isLoadingDbs, setIsLoadingDbs] = useState(true);
  const [isTestingWithPooler, setIsTestingWithPooler] = useState(false);
  const [isTestingWithoutPooler, setIsTestingWithoutPooler] = useState(false);
  const [withPoolerResult, setWithPoolerResult] = useState<TestResult | null>(null);
  const [withoutPoolerResult, setWithoutPoolerResult] = useState<TestResult | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    setIsLoadingDbs(true);
    try {
      const response = await api.getDatabases();
      if (response.success) {
        setDatabases(response.data);
        if (response.data.length > 0) {
          setSelectedDbId(response.data[0].id);
        }
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Failed to load databases', 'error');
    } finally {
      setIsLoadingDbs(false);
    }
  };

  const handleTestWithPooler = async () => {
    if (!selectedDbId || !numRequests) return;

    const requests = Number(numRequests);
    if (isNaN(requests) || requests < 1 || requests > 500) {
      showToast('Number of requests must be between 1 and 500', 'error');
      return;
    }

    setIsTestingWithPooler(true);
    setWithPoolerResult(null);

    try {
      const response = await api.testPooler(selectedDbId, requests);
      if (response.success) {
        setWithPoolerResult(response.data);
        showToast('Test with pooler completed', 'success');
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Test with pooler failed', 'error');
    } finally {
      setIsTestingWithPooler(false);
    }
  };

  const handleTestWithoutPooler = async () => {
    if (!selectedDbId || !numRequests) return;

    const requests = Number(numRequests);
    if (isNaN(requests) || requests < 1 || requests > 500) {
      showToast('Number of requests must be between 1 and 500', 'error');
      return;
    }

    setIsTestingWithoutPooler(true);
    setWithoutPoolerResult(null);

    try {
      const response = await api.testDirect(selectedDbId, requests);
      if (response.success) {
        setWithoutPoolerResult(response.data);
        showToast('Test without pooler completed', 'success');
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Test without pooler failed', 'error');
    } finally {
      setIsTestingWithoutPooler(false);
    }
  };

  const selectedDb = databases.find(db => db.id === selectedDbId);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Database Performance</h1>
        <p className="text-gray-600">Run load tests on your database with and without connection pooling</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Test Configuration</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Database
            </label>
            {isLoadingDbs ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader className="animate-spin" size={20} />
                Loading databases...
              </div>
            ) : databases.length === 0 ? (
              <p className="text-gray-500">No databases available. Please add a database first.</p>
            ) : (
              <select
                value={selectedDbId || ''}
                onChange={(e) => setSelectedDbId(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {databases.map((db) => (
                  <option key={db.id} value={db.id}>
                    {db.dbname} ({db.host})
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input
            label="Number of Requests"
            type="number"
            placeholder="50"
            value={numRequests}
            onChange={(e) => setNumRequests(e.target.value)}
            min="1"
            max="500"
          />
        </div>

        {selectedDb && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Pool Configuration</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Pool Size:</span>{' '}
                <span className="font-medium text-blue-900">{selectedDb.pool_config.pool_size}</span>
              </div>
              <div>
                <span className="text-blue-700">Queue Size:</span>{' '}
                <span className="font-medium text-blue-900">{selectedDb.pool_config.queue_size}</span>
              </div>
              <div>
                <span className="text-blue-700">Queue Timeout:</span>{' '}
                <span className="font-medium text-blue-900">{selectedDb.pool_config.queue_timeout_ms}ms</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button
            onClick={handleTestWithPooler}
            variant="primary"
            size="lg"
            className="flex-1"
            isLoading={isTestingWithPooler}
            disabled={!selectedDbId || isTestingWithoutPooler}
          >
            <Play size={20} className="mr-2" />
            Run With Pooler
          </Button>
          <Button
            onClick={handleTestWithoutPooler}
            variant="secondary"
            size="lg"
            className="flex-1"
            isLoading={isTestingWithoutPooler}
            disabled={!selectedDbId || isTestingWithPooler}
          >
            <Play size={20} className="mr-2" />
            Run Without Pooler
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {withPoolerResult && (
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm p-6 border-2 border-blue-200">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">With Pooler Results</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Successful Requests</p>
                <p className="text-3xl font-bold text-green-600">{withPoolerResult.metrics.successful_requests}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Failed Connections</p>
                <p className="text-3xl font-bold text-red-600">{withPoolerResult.metrics.failed_connections}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Queue Wait</p>
                <p className="text-3xl font-bold text-blue-600">{withPoolerResult.metrics.avg_queue_wait_ms.toFixed(2)}ms</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Execution Time</p>
                <p className="text-3xl font-bold text-gray-900">{withPoolerResult.metrics.total_execution_time_ms.toFixed(2)}ms</p>
              </div>
            </div>
          </div>
        )}

        {withoutPoolerResult && (
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Without Pooler Results</h3>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Successful Requests</p>
                <p className="text-3xl font-bold text-green-600">{withoutPoolerResult.metrics.successful_requests}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Failed Connections</p>
                <p className="text-3xl font-bold text-red-600">{withoutPoolerResult.metrics.failed_connections}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Avg Queue Wait</p>
                <p className="text-3xl font-bold text-blue-600">{withoutPoolerResult.metrics.avg_queue_wait_ms.toFixed(2)}ms</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Execution Time</p>
                <p className="text-3xl font-bold text-gray-900">{withoutPoolerResult.metrics.total_execution_time_ms.toFixed(2)}ms</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
