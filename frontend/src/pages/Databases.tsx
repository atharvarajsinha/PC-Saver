import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, TestTube, Database as DatabaseIcon } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

interface Database {
  id: number;
  host: string;
  port: number;
  dbname: string;
  username: string;
  created_at: string;
  pool_config: {
    pool_size: number;
    queue_size: number;
    queue_timeout_ms: number;
  };
}

export function Databases() {
  const [databases, setDatabases] = useState<Database[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDb, setSelectedDb] = useState<Database | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [accountPassword, setAccountPassword] = useState('');
  const [revealedPassword, setRevealedPassword] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    setIsLoading(true);
    try {
      const response = await api.getDatabases();
      if (response.success) {
        setDatabases(response.data);
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Failed to load databases', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async (db: Database) => {
    setIsTestingConnection(db.id);
    try {
      const response = await api.testConnection(db.id);
      if (response.success) {
        showToast(`Connection successful! Latency: ${response.data.latency_ms}ms`, 'success');
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Connection test failed', 'error');
    } finally {
      setIsTestingConnection(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedDb) return;

    setIsDeleting(true);
    try {
      const response = await api.deleteDatabase(selectedDb.id);
      if (response.success) {
        showToast('Database deleted successfully', 'success');
        setShowDeleteModal(false);
        setSelectedDb(null);
        loadDatabases();
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Failed to delete database', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRevealPassword = async () => {
    if (!selectedDb || !accountPassword) return;

    setIsRevealing(true);
    try {
      const response = await api.revealPassword(selectedDb.id, accountPassword);
      if (response.success) {
        setRevealedPassword(response.data.password);
        showToast('Password revealed', 'success');
        setTimeout(() => {
          setRevealedPassword('');
          setShowRevealModal(false);
          setAccountPassword('');
        }, 10000);
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Failed to reveal password', 'error');
    } finally {
      setIsRevealing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Databases</h1>
          <p className="text-gray-600 mt-1">Manage your PostgreSQL database connections</p>
        </div>
        <Button onClick={() => navigate('/databases/create')} size="lg">
          <Plus size={20} className="mr-2" />
          Add Database
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : databases.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <DatabaseIcon size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No databases yet</h3>
          <p className="text-gray-600 mb-6">Get started by adding your first database connection</p>
          <Button onClick={() => navigate('/databases/create')}>
            <Plus size={20} className="mr-2" />
            Add Database
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {databases.map((db) => (
            <div key={db.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DatabaseIcon size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{db.dbname}</h3>
                    <p className="text-sm text-gray-500">{db.host}:{db.port}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-medium text-gray-900">{db.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pool Size:</span>
                  <span className="font-medium text-gray-900">{db.pool_config.pool_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Queue Size:</span>
                  <span className="font-medium text-gray-900">{db.pool_config.queue_size}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/databases/${db.id}/edit`)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => {
                    setSelectedDb(db);
                    setShowDeleteModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => handleTestConnection(db)}
                  disabled={isTestingConnection === db.id}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Test Connection"
                >
                  <TestTube size={16} />
                  {isTestingConnection === db.id ? 'Testing...' : ''}
                </button>
                <button
                  onClick={() => {
                    setSelectedDb(db);
                    setShowRevealModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Reveal Password"
                >
                  <Eye size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedDb(null);
        }}
        title="Delete Database"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedDb?.dbname}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedDb(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRevealModal}
        onClose={() => {
          setShowRevealModal(false);
          setSelectedDb(null);
          setAccountPassword('');
          setRevealedPassword('');
        }}
        title="Reveal Password"
        size="sm"
      >
        <div className="space-y-4">
          {!revealedPassword ? (
            <>
              <p className="text-sm text-gray-600">
                Enter your account password to reveal the database password for <strong>{selectedDb?.dbname}</strong>
              </p>
              <Input
                label="Account Password"
                type="password"
                placeholder="Enter your account password"
                value={accountPassword}
                onChange={(e) => setAccountPassword(e.target.value)}
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowRevealModal(false);
                    setAccountPassword('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleRevealPassword} isLoading={isRevealing} disabled={!accountPassword}>
                  Reveal
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Database Password:</p>
                <p className="font-mono text-lg font-semibold text-gray-900 break-all">{revealedPassword}</p>
              </div>
              <Button variant="secondary" className="w-full" onClick={() => copyToClipboard(revealedPassword)}>
                Copy Password
              </Button>
              <p className="text-xs text-gray-500 text-center">This modal will close automatically in 10 seconds</p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
