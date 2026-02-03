import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { MobileNav } from '../components/MobileNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorDisplay } from '../components/ErrorDisplay';

interface UserPreferences {
  // Email notification preferences
  notify_race_completed: boolean;
  notify_draft_turn: boolean;
  notify_league_invitations: boolean;
  notify_team_updates: boolean;

  // Display preferences
  theme_preference: string;
  language_preference: string;
  timezone_preference: string;

  // Privacy settings
  profile_visibility: string;
  show_email_to_league_members: boolean;

  // Auto-pick preferences
  auto_pick_enabled: boolean;
  auto_pick_strategy: string;
}

export const UserSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const prefs = await userService.getUserPreferences();
      setPreferences(prefs);
    } catch (err: any) {
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await userService.updateUserPreferences(preferences);
      setSuccessMessage('Preferences saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (field: keyof UserPreferences) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [field]: !preferences[field] });
  };

  const handleChange = (field: keyof UserPreferences, value: string) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [field]: value });
  };

  if (loading) {
    return (
      <>
        <MobileNav />
        <div className="settings-page">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="settings-page">
        <ErrorDisplay message={error} onRetry={loadPreferences} />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="settings-page">
        <ErrorDisplay message="No preferences data available" onRetry={loadPreferences} />
      </div>
    );
  }

  return (
    <div className="settings-page">
      <MobileNav />
      <div className="settings-container">
        <div className="settings-header">
          <h1>User Settings</h1>
          <p className="settings-subtitle">Manage your account preferences and settings</p>
        </div>

        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="settings-content">
          {/* Email Notification Preferences */}
          <div className="settings-section">
            <h2>Email Notifications</h2>
            <p className="settings-description">
              Choose which email notifications you want to receive
            </p>
            <div className="settings-form">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.notify_race_completed}
                    onChange={() => handleToggle('notify_race_completed')}
                    disabled={saving}
                  />
                  <span className="checkbox-text">
                    Notify me when a race is completed
                  </span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.notify_draft_turn}
                    onChange={() => handleToggle('notify_draft_turn')}
                    disabled={saving}
                  />
                  <span className="checkbox-text">
                    Notify me when it's my turn in a draft
                  </span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.notify_league_invitations}
                    onChange={() => handleToggle('notify_league_invitations')}
                    disabled={saving}
                  />
                  <span className="checkbox-text">
                    Notify me when I receive a league invitation
                  </span>
                </label>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.notify_team_updates}
                    onChange={() => handleToggle('notify_team_updates')}
                    disabled={saving}
                  />
                  <span className="checkbox-text">
                    Notify me about team updates and changes
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Display Preferences */}
          <div className="settings-section">
            <h2>Display Preferences</h2>
            <p className="settings-description">
              Customize how the application looks and behaves
            </p>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="theme_preference">Theme</label>
                <select
                  id="theme_preference"
                  value={preferences.theme_preference}
                  onChange={(e) => handleChange('theme_preference', e.target.value)}
                  disabled={saving}
                  className="form-control"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="language_preference">Language</label>
                <select
                  id="language_preference"
                  value={preferences.language_preference}
                  onChange={(e) => handleChange('language_preference', e.target.value)}
                  disabled={saving}
                  className="form-control"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="timezone_preference">Timezone</label>
                <select
                  id="timezone_preference"
                  value={preferences.timezone_preference}
                  onChange={(e) => handleChange('timezone_preference', e.target.value)}
                  disabled={saving}
                  className="form-control"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="settings-section">
            <h2>Privacy Settings</h2>
            <p className="settings-description">
              Control who can see your profile information
            </p>
            <div className="settings-form">
              <div className="form-group">
                <label htmlFor="profile_visibility">Profile Visibility</label>
                <select
                  id="profile_visibility"
                  value={preferences.profile_visibility}
                  onChange={(e) => handleChange('profile_visibility', e.target.value)}
                  disabled={saving}
                  className="form-control"
                >
                  <option value="public">Public - Visible to everyone</option>
                  <option value="league_only">League Only - Visible to league members only</option>
                  <option value="private">Private - Not visible to anyone</option>
                </select>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.show_email_to_league_members}
                    onChange={() => handleToggle('show_email_to_league_members')}
                    disabled={saving}
                  />
                  <span className="checkbox-text">
                    Show my email address to league members
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Auto-Pick Preferences */}
          <div className="settings-section">
            <h2>Auto-Pick Preferences</h2>
            <p className="settings-description">
              Configure automatic drafting behavior for your teams
            </p>
            <div className="settings-form">
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.auto_pick_enabled}
                    onChange={() => handleToggle('auto_pick_enabled')}
                    disabled={saving}
                  />
                  <span className="checkbox-text">
                    Enable auto-pick for drafts
                  </span>
                </label>
                <p className="form-help">
                  When enabled, the system will automatically make picks for you
                  when it's your turn in a draft.
                </p>
              </div>
              <div className="form-group">
                <label htmlFor="auto_pick_strategy">Auto-Pick Strategy</label>
                <select
                  id="auto_pick_strategy"
                  value={preferences.auto_pick_strategy}
                  onChange={(e) => handleChange('auto_pick_strategy', e.target.value)}
                  disabled={saving || !preferences.auto_pick_enabled}
                  className="form-control"
                >
                  <option value="highest_ranked">Highest Ranked - Pick the best available driver</option>
                  <option value="random">Random - Pick a random available driver</option>
                  <option value="balanced">Balanced - Pick based on team balance</option>
                </select>
                <p className="form-help">
                  This strategy will be used when auto-pick is enabled.
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="settings-actions">
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={loadPreferences}
              disabled={saving}
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};