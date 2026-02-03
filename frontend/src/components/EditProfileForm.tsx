import { useState } from 'react';
import { userService, type UpdateProfileRequest, type ChangePasswordRequest } from '../services/userService';
import { useAuth } from '../context/AuthContext';

interface EditProfileFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ onSuccess, onCancel }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile fields
  const [email, setEmail] = useState(user?.email || '');
  const [fullName, setFullName] = useState(user?.full_name || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [currentPasswordError, setCurrentPasswordError] = useState<string | null>(null);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(value)) {
      setEmailError('Invalid email format');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validateFullName = (value: string): boolean => {
    if (!value || value.trim().length < 3) {
      setFullNameError('Full name must be at least 3 characters');
      return false;
    }
    if (value.trim().length > 100) {
      setFullNameError('Full name must be less than 100 characters');
      return false;
    }
    setFullNameError(null);
    return true;
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setNewPasswordError('Password is required');
      return false;
    }
    if (value.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(value)) {
      setNewPasswordError('Password must contain at least 1 uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(value)) {
      setNewPasswordError('Password must contain at least 1 lowercase letter');
      return false;
    }
    if (!/\d/.test(value)) {
      setNewPasswordError('Password must contain at least 1 digit');
      return false;
    }
    setNewPasswordError(null);
    return true;
  };

  const validateConfirmPassword = (value: string): boolean => {
    if (value !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError(null);
    return true;
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const isEmailValid = validateEmail(email);
    const isFullNameValid = validateFullName(fullName);

    if (!isEmailValid || !isFullNameValid) {
      return;
    }

    setLoading(true);

    try {
      const updateData: UpdateProfileRequest = {};
      if (email !== user?.email) {
        updateData.email = email;
      }
      if (fullName !== user?.full_name) {
        updateData.full_name = fullName;
      }

      if (Object.keys(updateData).length === 0) {
        setSuccess('No changes to save');
        setLoading(false);
        return;
      }

      const updatedUser = await userService.updateProfile(updateData);
      setUser(updatedUser);
      setSuccess('Profile updated successfully');
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!currentPassword) {
      setCurrentPasswordError('Current password is required');
      return;
    }

    const isNewPasswordValid = validatePassword(newPassword);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (!isNewPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const passwordData: ChangePasswordRequest = {
        current_password: currentPassword,
        new_password: newPassword,
      };

      await userService.changePassword(passwordData);
      setSuccess('Password changed successfully');
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => onSuccess(), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
      if (err.message?.includes('current password')) {
        setCurrentPasswordError('Current password is incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-profile-form">
      <h2>Edit Profile</h2>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" role="alert">
          {success}
        </div>
      )}

      {/* Profile Information Section */}
      <div className="form-section">
        <h3>Profile Information</h3>
        <form onSubmit={handleProfileUpdate}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={user?.username || ''}
              disabled
              className="form-control disabled"
            />
            <small className="form-text">Username cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              className={`form-control ${emailError ? 'is-invalid' : ''}`}
              required
            />
            {emailError && <div className="invalid-feedback">{emailError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                validateFullName(e.target.value);
              }}
              onBlur={(e) => validateFullName(e.target.value)}
              className={`form-control ${fullNameError ? 'is-invalid' : ''}`}
              required
            />
            {fullNameError && <div className="invalid-feedback">{fullNameError}</div>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="form-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                setCurrentPasswordError(null);
              }}
              className={`form-control ${currentPasswordError ? 'is-invalid' : ''}`}
              required
            />
            {currentPasswordError && <div className="invalid-feedback">{currentPasswordError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                validatePassword(e.target.value);
              }}
              onBlur={(e) => validatePassword(e.target.value)}
              className={`form-control ${newPasswordError ? 'is-invalid' : ''}`}
              required
            />
            {newPasswordError && <div className="invalid-feedback">{newPasswordError}</div>}
            <small className="form-text">
              Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 digit
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                validateConfirmPassword(e.target.value);
              }}
              onBlur={(e) => validateConfirmPassword(e.target.value)}
              className={`form-control ${confirmPasswordError ? 'is-invalid' : ''}`}
              required
            />
            {confirmPasswordError && <div className="invalid-feedback">{confirmPasswordError}</div>}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};