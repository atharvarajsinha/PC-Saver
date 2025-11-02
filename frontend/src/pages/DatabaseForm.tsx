import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface DatabaseFormData {
  host: string;
  port: string;
  dbname: string;
  username: string;
  password: string;
  pool_size: string;
  queue_size: string;
  queue_timeout_ms: string;
}

export function DatabaseForm() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<DatabaseFormData>({
    host: '',
    port: '5432',
    dbname: '',
    username: '',
    password: '',
    pool_size: '10',
    queue_size: '20',
    queue_timeout_ms: '5000',
  });

  const [errors, setErrors] = useState<Partial<DatabaseFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isEditMode) {
      loadDatabase();
    }
  }, [id]);

  const loadDatabase = async () => {
    setIsFetchingData(true);
    try {
      const response = await api.getDatabase(Number(id));
      if (response.success) {
        const db = response.data;
        setFormData({
          host: db.host,
          port: db.port.toString(),
          dbname: db.dbname,
          username: db.username,
          password: '',
          pool_size: db.pool_config.pool_size.toString(),
          queue_size: db.pool_config.queue_size.toString(),
          queue_timeout_ms: db.pool_config.queue_timeout_ms.toString(),
        });
      } else {
        showToast(response.message, 'error');
        navigate('/databases');
      }
    } catch (error) {
      showToast('Failed to load database', 'error');
      navigate('/databases');
    } finally {
      setIsFetchingData(false);
    }
  };

  const validate = () => {
    const newErrors: Partial<DatabaseFormData> = {};

    if (!formData.host.trim()) {
      newErrors.host = 'Host is required';
    }

    const port = Number(formData.port);
    if (!formData.port || isNaN(port) || port < 1 || port > 65535) {
      newErrors.port = 'Port must be between 1 and 65535';
    }

    if (!formData.dbname.trim()) {
      newErrors.dbname = 'Database name is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (!isEditMode && !formData.password) {
      newErrors.password = 'Password is required';
    }

    const poolSize = Number(formData.pool_size);
    if (!formData.pool_size || isNaN(poolSize) || poolSize < 1) {
      newErrors.pool_size = 'Pool size must be at least 1';
    }

    const queueSize = Number(formData.queue_size);
    if (!formData.queue_size || isNaN(queueSize) || queueSize < 0) {
      newErrors.queue_size = 'Queue size must be 0 or greater';
    }

    const queueTimeout = Number(formData.queue_timeout_ms);
    if (!formData.queue_timeout_ms || isNaN(queueTimeout) || queueTimeout < 100) {
      newErrors.queue_timeout_ms = 'Queue timeout must be at least 100ms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    const payload = {
      host: formData.host,
      port: Number(formData.port),
      dbname: formData.dbname,
      username: formData.username,
      ...(formData.password && { password: formData.password }),
      pool_config: {
        pool_size: Number(formData.pool_size),
        queue_size: Number(formData.queue_size),
        queue_timeout_ms: Number(formData.queue_timeout_ms),
      },
    };

    try {
      const response = isEditMode
        ? await api.updateDatabase(Number(id), payload)
        : await api.createDatabase(payload);

      if (response.success) {
        showToast(
          isEditMode ? 'Database updated successfully' : 'Database created successfully',
          'success'
        );
        navigate('/databases');
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast(isEditMode ? 'Failed to update database' : 'Failed to create database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/databases')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        Back to Databases
      </button>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isEditMode ? 'Edit Database' : 'Add Database'}
        </h1>
        <p className="text-gray-600 mb-8">
          {isEditMode ? 'Update your database connection details' : 'Configure a new PostgreSQL database connection'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Host"
              type="text"
              placeholder="db.example.com"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              error={errors.host}
            />

            <Input
              label="Port"
              type="number"
              placeholder="5432"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              error={errors.port}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Database Name"
              type="text"
              placeholder="mydatabase"
              value={formData.dbname}
              onChange={(e) => setFormData({ ...formData, dbname: e.target.value })}
              error={errors.dbname}
            />

            <Input
              label="Username"
              type="text"
              placeholder="postgres"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
            />
          </div>

          <Input
            label={isEditMode ? 'Password (leave blank to keep current)' : 'Password'}
            type="password"
            placeholder="Enter database password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
          />

          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pool Configuration</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Input
                label="Pool Size"
                type="number"
                placeholder="10"
                value={formData.pool_size}
                onChange={(e) => setFormData({ ...formData, pool_size: e.target.value })}
                error={errors.pool_size}
              />

              <Input
                label="Queue Size"
                type="number"
                placeholder="20"
                value={formData.queue_size}
                onChange={(e) => setFormData({ ...formData, queue_size: e.target.value })}
                error={errors.queue_size}
              />

              <Input
                label="Queue Timeout (ms)"
                type="number"
                placeholder="5000"
                value={formData.queue_timeout_ms}
                onChange={(e) => setFormData({ ...formData, queue_timeout_ms: e.target.value })}
                error={errors.queue_timeout_ms}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/databases')}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
              <Save size={20} className="mr-2" />
              {isEditMode ? 'Update Database' : 'Create Database'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
