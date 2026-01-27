import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import "./ProfilePage.scss";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
  last_login: string | null;
  is_active: boolean;
  is_publicly_discoverable: boolean;
  is_searchable_by_email: boolean;
  is_searchable_by_username: boolean;
}

interface UserStats {
  teams_count: number;
  leagues_created_count: number;
  leagues_joined_count: number;
  total_points: number;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get user profile from auth/me endpoint
      const response = await api.get("/auth/me");
      setProfile(response.data);

      // Get user statistics
      try {
        const statsResponse = await api.get("/users/me/stats");
        setStats(statsResponse.data);
      } catch (statsError) {
        console.error("Error loading user stats:", statsError);
        // Set default stats if stats endpoint fails
        setStats({
          teams_count: 0,
          leagues_created_count: 0,
          leagues_joined_count: 0,
          total_points: 0,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to load profile");
      console.error("Error loading profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEditProfile = () => {
    navigate("/profile/edit");
  };

  const handleChangePassword = () => {
    navigate("/profile/change-password");
  };

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-page__container">
          <div className="profile-page__loading">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-page">
        <div className="profile-page__container">
          <div className="profile-page__error">
            <h2>Error</h2>
            <p>{error || "Failed to load profile"}</p>
            <button onClick={loadUserProfile} className="btn btn-primary">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page__container">
        <div className="profile-page__header">
          <h1>My Profile</h1>
          <div className="profile-page__actions">
            <button
              onClick={handleEditProfile}
              className="btn btn-primary"
              aria-label="Edit profile"
            >
              Edit Profile
            </button>
            <button
              onClick={handleChangePassword}
              className="btn btn-secondary"
              aria-label="Change password"
            >
              Change Password
            </button>
          </div>
        </div>

        <div className="profile-page__content">
          <div className="profile-page__avatar-section">
            <div className="profile-page__avatar">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={`${profile.username}'s avatar`}
                  className="profile-page__avatar-image"
                />
              ) : (
                <div className="profile-page__avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="profile-page__status">
              <span
                className={`profile-page__status-badge ${
                  profile.is_active ? "active" : "inactive"
                }`}
              >
                {profile.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="profile-page__details">
            <div className="profile-page__detail-row">
              <label className="profile-page__detail-label">Username</label>
              <div className="profile-page__detail-value">
                {profile.username}
              </div>
            </div>

            <div className="profile-page__detail-row">
              <label className="profile-page__detail-label">Full Name</label>
              <div className="profile-page__detail-value">
                {profile.full_name || "Not set"}
              </div>
            </div>

            <div className="profile-page__detail-row">
              <label className="profile-page__detail-label">Email</label>
              <div className="profile-page__detail-value">
                {profile.email}
              </div>
            </div>

            <div className="profile-page__detail-row">
              <label className="profile-page__detail-label">Bio</label>
              <div className="profile-page__detail-value profile-page__bio">
                {profile.bio || "No bio set"}
              </div>
            </div>

            <div className="profile-page__detail-row">
              <label className="profile-page__detail-label">Member Since</label>
              <div className="profile-page__detail-value">
                {formatDate(profile.created_at)}
              </div>
            </div>

            <div className="profile-page__detail-row">
              <label className="profile-page__detail-label">Last Login</label>
              <div className="profile-page__detail-value">
                {formatDateTime(profile.last_login)}
              </div>
            </div>
          </div>

          {stats && (
            <div className="profile-page__stats">
              <h2>Statistics</h2>
              <div className="profile-page__stats-grid">
                <div className="profile-page__stat-card">
                  <div className="profile-page__stat-value">
                    {stats.teams_count}
                  </div>
                  <div className="profile-page__stat-label">Teams</div>
                </div>
                <div className="profile-page__stat-card">
                  <div className="profile-page__stat-value">
                    {stats.leagues_joined_count}
                  </div>
                  <div className="profile-page__stat-label">Leagues Joined</div>
                </div>
                <div className="profile-page__stat-card">
                  <div className="profile-page__stat-value">
                    {stats.leagues_created_count}
                  </div>
                  <div className="profile-page__stat-label">Leagues Created</div>
                </div>
                <div className="profile-page__stat-card">
                  <div className="profile-page__stat-value">
                    {stats.total_points}
                  </div>
                  <div className="profile-page__stat-label">Total Points</div>
                </div>
              </div>
            </div>
          )}

          <div className="profile-page__privacy">
            <h2>Privacy Settings</h2>
            <div className="profile-page__privacy-item">
              <span className="profile-page__privacy-label">
                Publicly Discoverable
              </span>
              <span
                className={`profile-page__privacy-status ${
                  profile.is_publicly_discoverable ? "enabled" : "disabled"
                }`}
              >
                {profile.is_publicly_discoverable ? "Yes" : "No"}
              </span>
            </div>
            <div className="profile-page__privacy-item">
              <span className="profile-page__privacy-label">
                Searchable by Email
              </span>
              <span
                className={`profile-page__privacy-status ${
                  profile.is_searchable_by_email ? "enabled" : "disabled"
                }`}
              >
                {profile.is_searchable_by_email ? "Yes" : "No"}
              </span>
            </div>
            <div className="profile-page__privacy-item">
              <span className="profile-page__privacy-label">
                Searchable by Username
              </span>
              <span
                className={`profile-page__privacy-status ${
                  profile.is_searchable_by_username ? "enabled" : "disabled"
                }`}
              >
                {profile.is_searchable_by_username ? "Yes" : "No"}
              </span>
            </div>
            <p className="profile-page__privacy-hint">
              * You can change these settings in Edit Profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
