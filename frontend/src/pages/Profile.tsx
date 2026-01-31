import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { EditProfileForm } from '../components/EditProfileForm';
import type { User } from '../types';

export const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const profileData = await userService.getCurrentUser();
      setCurrentUser(profileData);
      setUser(profileData);
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="alert alert-error" role="alert">
          {error}
          <button onClick={loadUserProfile} className="btn btn-secondary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="profile-page">
        <EditProfileForm
          onSuccess={() => {
            setIsEditing(false);
            loadUserProfile();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  const displayUser = currentUser || user;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>My Profile</h1>
          <button
            className="btn btn-primary"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        </div>

        <div className="profile-card">
          <div className="profile-section">
            <h2>Account Information</h2>
            <div className="profile-info">
              <div className="info-row">
                <span className="info-label">Username:</span>
                <span className="info-value">{displayUser?.username}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{displayUser?.email}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Full Name:</span>
                <span className="info-value">{displayUser?.full_name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Status:</span>
                <span className={`info-value status ${displayUser?.is_active ? 'active' : 'inactive'}`}>
                  {displayUser?.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Type:</span>
                <span className={`info-value role ${displayUser?.is_superuser ? 'admin' : 'user'}`}>
                  {displayUser?.is_superuser ? 'Administrator' : 'User'}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Member Since:</span>
                <span className="info-value">
                  {displayUser?.created_at ? formatDate(displayUser.created_at) : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h2>Account Actions</h2>
            <div className="profile-actions">
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
              <button
                className="btn btn-secondary"
                onClick={loadUserProfile}
              >
                Refresh Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};