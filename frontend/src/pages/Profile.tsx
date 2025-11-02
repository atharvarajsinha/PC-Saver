import { useState, useEffect } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

export function Profile() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!fullName.trim()) {
      showToast('Full name is required', 'error');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await api.updateProfile(fullName);
      if (response.success) {
        showToast('Profile updated successfully', 'success');
        await refreshUser();
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Failed to update profile', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const validatePassword = () => {
    const errors: any = {};

    if (!passwordData.oldPassword) {
      errors.oldPassword = 'Old password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsChangingPassword(true);
    try {
      const response = await api.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );

      if (response.success) {
        showToast('Password changed successfully', 'success');
        setShowChangePasswordModal(false);
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordErrors({});
      } else {
        showToast(response.message, 'error');
      }
    } catch (error) {
      showToast('Failed to change password', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      <div className="grid gap-6">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{user?.full_name}</h2>
              <p className="text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
              <Input
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Button
                onClick={handleUpdateProfile}
                variant="primary"
                isLoading={isUpdating}
                disabled={fullName === user?.full_name}
              >
                <Save size={20} className="mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="flex items-center gap-3 mb-4">
            <Lock size={24} className="text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Update your password to keep your account secure
          </p>
          <Button
            onClick={() => setShowChangePasswordModal(true)}
            variant="secondary"
          >
            <Lock size={20} className="mr-2" />
            Change Password
          </Button>
        </div>
      </div>

      <Modal
        isOpen={showChangePasswordModal}
        onClose={() => {
          setShowChangePasswordModal(false);
          setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
          setPasswordErrors({});
        }}
        title="Change Password"
      >
        <div className="space-y-4">
          <Input
            label="Old Password"
            type="password"
            placeholder="Enter your current password"
            value={passwordData.oldPassword}
            onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
            error={passwordErrors.oldPassword}
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            error={passwordErrors.newPassword}
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            error={passwordErrors.confirmPassword}
          />
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowChangePasswordModal(false);
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleChangePassword}
              isLoading={isChangingPassword}
            >
              Change Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
