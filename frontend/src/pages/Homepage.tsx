import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Database, Cpu, Clock, BarChart3, Brain } from 'lucide-react';
import { MetricCard } from '../components/ui/MetricCard';

interface StatsData {
  users_registered: number;
  databases_connected: number;
  avg_pool_size: number;
  avg_queue_size: number;
  avg_timeout_ms: number;
}

export function Homepage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.stats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <Cpu size={28} className="text-blue-600" />,
      title: 'Connection Pooling',
      description:
        'Reuses existing PostgreSQL connections and limits concurrent usage to improve performance and stability.'
    },
    {
      icon: <Clock size={28} className="text-blue-600" />,
      title: 'Request Queueing',
      description:
        'When the pool is full, incoming requests are queued based on configured limits and timeouts.'
    },
    {
      icon: <BarChart3 size={28} className="text-blue-600" />,
      title: 'Live Metrics Tracking',
      description:
        'Monitors total connections, queued requests, timeouts, and average response times in real time.'
    },
    {
      icon: <Brain size={28} className="text-blue-600" />,
      title: 'OS Concept Simulation',
      description:
        'Simulates core OS principles like concurrency, resource allocation, and scheduling in database systems.'
    }
  ];

  const osConcepts = [
    { os: 'Process Scheduling', pcSaver: 'Connection Queue Management' },
    { os: 'Resource Allocation', pcSaver: 'Pool Slot Assignment' },
    { os: 'Synchronization', pcSaver: 'Thread-safe Pool Access' },
    { os: 'Deadlock Handling', pcSaver: 'Queue Timeout Mechanism' },
    { os: 'Performance Metrics', pcSaver: 'Connection + Queue Statistics' }
  ];

  return (
    <div id='#top' className="min-h-screen">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-xl">
                <Database size={24} className="text-white" />
              </div>
              <a href="#top" className="text-xl font-bold text-gray-900">
                PC Saver
              </a>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#top" className="text-gray-700 hover:text-blue-600 transition-colors">
                Home
              </a>
              <a href="#about" className="text-gray-700 hover:text-blue-600 transition-colors">
                About
              </a>
              <a href="#features" className="text-gray-700 hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#metrics" className="text-gray-700 hover:text-blue-600 transition-colors">
                Metrics
              </a>
              <a href="#concepts" className="text-gray-700 hover:text-blue-600 transition-colors">
                Concepts
              </a>
              <Link to="/auth/login" className="text-gray-700 hover:text-blue-600 transition-colors">
                Login
              </Link>
              <Link
                to="/auth/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id='home' className="bg-gradient-to-b from-blue-50 to-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Database size={32} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">PC Saver</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A PostgreSQL Connection Pooler that intelligently manages concurrent database connections — bringing OS-level efficiency to your backend.
          </p>
          <Link
            to="/auth/register"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-4 font-semibold shadow-md hover:shadow-lg transition-all inline-block"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id='about' className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About PC Saver</h2>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              <strong>PC Saver</strong> is a middleware built using <strong>Django</strong> and a
              custom <strong>Python-based Pooler Engine</strong> that manages PostgreSQL connections
              smartly. It serves as a bridge between client APIs and the actual database, ensuring
              efficient use of database resources under high concurrency.
            </p>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              The pooler maintains a fixed number of active connections. When requests exceed the
              pool limit, they are queued temporarily. If both pool and queue are full, users
              receive a “Try Again Later” response — effectively demonstrating how operating systems
              manage resource contention.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              This system mimics <strong>process scheduling</strong>, <strong>queue management</strong>,
              and <strong>performance monitoring</strong> — allowing students and developers to visualize
              OS concepts in action.
            </p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-8 shadow-sm">
            <div className="text-center text-gray-600 space-y-4">
              <div className="bg-blue-100 text-blue-800 py-3 px-4 rounded-lg font-medium border border-blue-200">
                Client Request
              </div>
              <div className="text-2xl text-blue-500">↓</div>
              <div className="bg-green-100 text-green-800 py-3 px-4 rounded-lg font-medium border border-green-200">
                Django API Layer
              </div>
              <div className="text-2xl text-green-500">↓</div>
              <div className="bg-purple-100 text-purple-800 py-3 px-4 rounded-lg font-medium border border-purple-200">
                Python Pooler Engine
              </div>
              <div className="text-2xl text-purple-500">↓</div>
              <div className="bg-orange-100 text-orange-800 py-3 px-4 rounded-lg font-medium border border-orange-200">
                PostgreSQL Database
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id='features' className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm hover:shadow-md p-6 transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Metrics Section */}
      <section id='metrics' className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">📊 System Metrics (Live)</h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-2">Loading metrics...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
              <MetricCard color="blue" label="Users Registered" value={stats.users_registered} />
              <MetricCard color="green" label="Databases Connected" value={stats.databases_connected} />
              <MetricCard color="purple" label="Avg Pool Size" value={stats.avg_pool_size} />
              <MetricCard color="orange" label="Avg Queue Size" value={stats.avg_queue_size} />
              <MetricCard color="red" label="Avg Timeout (ms)" value={stats.avg_timeout_ms} />
            </div>
          ) : (
            <p className="text-gray-600 py-8">Failed to load metrics. Please try again later.</p>
          )}
        </div>
      </section>

      {/* OS Concept Mapping */}
      <section id='concepts' className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">🧠 OS Concept Mapping</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-center text-md font-bold text-gray-900">OS Concept</th>
                  <th className="px-6 py-4 text-center text-md font-bold text-gray-900">PC Saver Equivalent</th>
                </tr>
              </thead>
              <tbody>
                {osConcepts.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">{item.os}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.pcSaver}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Ready to optimize your PostgreSQL connections?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Get Started with PC Saver today.
          </p>
          <Link
            to="/auth/register"
            className="bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors inline-block shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400 text-sm">
            ©{new Date().getFullYear()} PC Saver • PostgreSQL Connection Pooler | All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}