import { useState, useEffect } from 'react';
import { Play, Loader, TrendingUp, TrendingDown, Cpu, MemoryStick, Database, Recycle, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

interface ComparisonResult {
  with_pooler: {
    successful_requests: number;
    failed_connections: number;
    avg_queue_wait_ms: number;
    total_execution_time_ms: number;
    cpu_usage_percent: number;
    memory_usage_mb: number;
    total_requests: number;
    efficiency_rps: number;
    success_rate: number;
    connections_created: number;
    connections_reused: number;
    connection_reuse_rate: number;
    memory_per_connection_mb: number;
    pool_size_configured: number;
  };
  without_pooler: {
    successful_requests: number;
    cpu_usage_percent: number;
    memory_usage_mb: number;
    efficiency_rps: number;
    total_execution_time_ms: number;
    success_rate: number;
    connections_created: number;
    memory_per_connection_mb: number;
    estimated_memory_all_requests_mb: number;
  };
  improvement_percent: number;
  resource_comparison: {
    cpu_saving_percent: number;
    memory_saving_percent: number;
    memory_saved_mb: number;
    connection_efficiency: {
      reuse_rate_percent: number;
      connections_saved: number;
      memory_per_connection_saving: number;
    };
  };
  interpretation: string;
}

export function Compare() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [selectedDbId, setSelectedDbId] = useState<number | null>(null);
  const [numRequests, setNumRequests] = useState('500');
  const [isLoadingDbs, setIsLoadingDbs] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

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

  const handleCompare = async () => {
    if (!selectedDbId || !numRequests) return;

    const requests = Number(numRequests);
    if (isNaN(requests) || requests < 1 || requests > 10000) {
      showToast('Number of requests must be between 1 and 10000', 'error');
      return;
    }

    setIsComparing(true);
    setResult(null);

    try {
      const response = await api.comparePooler(selectedDbId, requests);
      if (response.success) {
        setResult(response.data);
        showToast('Comparison completed successfully', 'success');
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Comparison failed', 'error');
    } finally {
      setIsComparing(false);
    }
  };

  const selectedDb = databases.find(db => db.id === selectedDbId);

  // Chart data for execution time comparison
  const executionTimeData = result ? [
    {
      name: 'Execution Time',
      'With Pooler': result.with_pooler.total_execution_time_ms,
      'Without Pooler': result.without_pooler.total_execution_time_ms,
    },
  ] : [];

  // Chart data for resource usage
  const resourceData = result ? [
    {
      name: 'CPU Usage',
      'With Pooler': result.with_pooler.cpu_usage_percent,
      'Without Pooler': result.without_pooler.cpu_usage_percent,
    },
    {
      name: 'Memory Usage',
      'With Pooler': result.with_pooler.memory_usage_mb,
      'Without Pooler': result.without_pooler.memory_usage_mb,
    },
  ] : [];

  // Connection efficiency data for pie chart
  const connectionData = result ? [
    { name: 'Connections Created', value: result.with_pooler.connections_created },
    { name: 'Connections Reused', value: result.with_pooler.connections_reused },
  ] : [];

  const COLORS = ['#0088FE', '#00C49F'];

  // Efficiency comparison data
  const efficiencyData = result ? [
    {
      name: 'Efficiency',
      'With Pooler': result.with_pooler.efficiency_rps,
      'Without Pooler': result.without_pooler.efficiency_rps,
    },
  ] : [];

  // Success rate comparison
  const successRateData = result ? [
    {
      name: 'Success Rate',
      'With Pooler': result.with_pooler.success_rate,
      'Without Pooler': result.without_pooler.success_rate,
    },
  ] : [];

  // Check if pooler configuration might be causing issues
  const hasPoolerIssues = result && result.with_pooler.success_rate < 50;
  const isImprovementPositive = result && result.improvement_percent > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Connection Pooling Comparison</h1>
        <p className="text-gray-600">Compare database performance, resource usage, and connection efficiency with and without connection pooling</p>
      </div>

      {/* Configuration Card */}
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

          <div>
            <Input
              label="Number of Requests"
              type="number"
              placeholder="500"
              value={numRequests}
              onChange={(e) => setNumRequests(e.target.value)}
              min="1"
              max="10000"
            />
            <p className="text-xs text-gray-500 mt-1">
              Start with 500 requests for testing, then increase gradually
            </p>
          </div>
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

        <Button
          onClick={handleCompare}
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isComparing}
          disabled={!selectedDbId}
        >
          <Play size={20} className="mr-2" />
          Run Performance Comparison
        </Button>
      </div>

      {result && (
        <>
          {/* Connection Efficiency Highlights */}
          <div className="grid md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Recycle className="text-blue-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-blue-600">{result.with_pooler.connection_reuse_rate}%</p>
              <p className="text-sm text-gray-600">Connection Reuse Rate</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Database className="text-green-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-green-600">{result.resource_comparison.connection_efficiency.connections_saved}</p>
              <p className="text-sm text-gray-600">Connections Saved</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MemoryStick className="text-purple-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-purple-600">{result.resource_comparison.memory_saved_mb.toFixed(1)}MB</p>
              <p className="text-sm text-gray-600">Memory Saved</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Cpu className="text-orange-600" size={24} />
              </div>
              <p className="text-2xl font-bold text-orange-600">{result.resource_comparison.cpu_saving_percent.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">CPU Saving</p>
            </div>
          </div>

          {/* Detailed Comparison Grid */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* With Pooler */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <Database size={20} />
                With Connection Pooler
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Successful Requests</span>
                    <p className="font-bold text-green-600 text-lg">{result.with_pooler.successful_requests}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Failed Connections</span>
                    <p className="font-bold text-red-600 text-lg">{result.with_pooler.failed_connections}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-700 text-sm">Connections Created</span>
                    <p className="font-bold text-blue-900 text-lg">{result.with_pooler.connections_created}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <span className="text-green-700 text-sm">Connections Reused</span>
                    <p className="font-bold text-green-900 text-lg">{result.with_pooler.connections_reused}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Total Time</span>
                    <p className="font-bold text-gray-900">{(result.with_pooler.total_execution_time_ms / 1000).toFixed(2)}s</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Success Rate</span>
                    <p className={`font-bold ${
                      result.with_pooler.success_rate > 80 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {result.with_pooler.success_rate.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-700 text-sm">CPU Usage</span>
                    <p className="font-bold text-orange-900">{result.with_pooler.cpu_usage_percent.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-700 text-sm">Memory Usage</span>
                    <p className="font-bold text-purple-900">{result.with_pooler.memory_usage_mb.toFixed(1)}MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Efficiency</span>
                    <p className="font-bold text-gray-900">{result.with_pooler.efficiency_rps.toFixed(1)} RPS</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Avg Wait Time</span>
                    <p className="font-bold text-gray-900">{result.with_pooler.avg_queue_wait_ms.toFixed(1)}ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Without Pooler */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database size={20} />
                Without Pooler (Direct)
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Successful Requests</span>
                    <p className="font-bold text-green-600 text-lg">{result.without_pooler.successful_requests}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Failed Connections</span>
                    <p className="font-bold text-gray-600 text-lg">0</p>
                  </div>
                </div>
                
                <div className="p-3 bg-red-50 rounded-lg">
                  <span className="text-red-700 text-sm">Connections Created</span>
                  <p className="font-bold text-red-900 text-lg">{result.without_pooler.connections_created}</p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm">Connections Reused</span>
                  <p className="font-bold text-gray-900 text-lg">0</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Total Time</span>
                    <p className="font-bold text-gray-900">{(result.without_pooler.total_execution_time_ms / 1000).toFixed(2)}s</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Success Rate</span>
                    <p className="font-bold text-green-600">{result.without_pooler.success_rate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <span className="text-orange-700 text-sm">CPU Usage</span>
                    <p className="font-bold text-orange-900">{result.without_pooler.cpu_usage_percent.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <span className="text-purple-700 text-sm">Memory Usage</span>
                    <p className="font-bold text-purple-900">{result.without_pooler.memory_usage_mb.toFixed(1)}MB</p>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm">Efficiency</span>
                  <p className="font-bold text-gray-900">{result.without_pooler.efficiency_rps.toFixed(1)} requests/second</p>
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <span className="text-yellow-700 text-sm">Estimated Memory (All Requests)</span>
                  <p className="font-bold text-yellow-900">{result.without_pooler.estimated_memory_all_requests_mb.toFixed(1)}MB</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Execution Time Comparison */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Execution Time Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={executionTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}ms`, 'Execution Time']} />
                  <Legend />
                  <Bar dataKey="With Pooler" fill="#3B82F6" />
                  <Bar dataKey="Without Pooler" fill="#9CA3AF" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Connection Efficiency Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Connection Efficiency</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={connectionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {connectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} connections`, 'Count']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Resource Usage Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Resource Usage Comparison */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Resource Usage Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="With Pooler" fill="#3B82F6" />
                  <Bar dataKey="Without Pooler" fill="#9CA3AF" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Efficiency Comparison */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Efficiency (Requests Per Second)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Requests/Second', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [`${Number(value).toFixed(2)} RPS`, 'Efficiency']} />
                  <Legend />
                  <Bar dataKey="With Pooler" fill="#10B981" />
                  <Bar dataKey="Without Pooler" fill="#6B7280" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}