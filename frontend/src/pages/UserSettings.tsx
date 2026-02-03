import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import type { UserPreferences } from '../services/userService';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import MobileNav from '../components/MobileNav';

const UserSettings = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await userService.getUserPreferences();
      setPreferences(data);
    } catch (error) {
      showToast('Failed to load preferences', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    if (!preferences) return;

    try {
      setSaving(prev => ({ ...prev, [key]: true }));
      const updated = await userService.updateUserPreferences({ [key]: value });
      setPreferences(updated);
      showToast('Preference updated successfully', 'success');
    } catch (error) {
      showToast('Failed to update preference', 'error');
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MobileNav />
        <div className="max-w-4xl mx-auto px-4 py-8 pt-20 md:pt-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MobileNav />
        <div className="max-w-4xl mx-auto px-4 py-8 pt-20 md:pt-8">
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Failed to load preferences</p>
            <button
              onClick={loadPreferences}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MobileNav />
      <div className="max-w-4xl mx-auto px-4 py-8 pt-20 md:pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account preferences and settings
          </p>
        </div>

        {/* Email Notification Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Email Notifications
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose which email notifications you want to receive
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-900 dark:text-white font-medium">
                  Race Completed
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when a race finishes
                </p>
              </div>
              <button
                onClick={() => updatePreference('notify_race_completed', !preferences.notify_race_completed)}
                disabled={saving.notify_race_completed}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_race_completed ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } ${saving.notify_race_completed ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notify_race_completed ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-900 dark:text-white font-medium">
                  Draft Turn
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when it's your turn in a draft
                </p>
              </div>
              <button
                onClick={() => updatePreference('notify_draft_turn', !preferences.notify_draft_turn)}
                disabled={saving.notify_draft_turn}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_draft_turn ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } ${saving.notify_draft_turn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notify_draft_turn ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-900 dark:text-white font-medium">
                  League Invitations
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified when someone invites you to a league
                </p>
              </div>
              <button
                onClick={() => updatePreference('notify_league_invitations', !preferences.notify_league_invitations)}
                disabled={saving.notify_league_invitations}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_league_invitations ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } ${saving.notify_league_invitations ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notify_league_invitations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-900 dark:text-white font-medium">
                  Team Updates
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get notified about changes to your teams
                </p>
              </div>
              <button
                onClick={() => updatePreference('notify_team_updates', !preferences.notify_team_updates)}
                disabled={saving.notify_team_updates}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.notify_team_updates ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } ${saving.notify_team_updates ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.notify_team_updates ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Display Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Display Preferences
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Customize how the application looks and behaves
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">
                Theme
              </label>
              <select
                value={preferences.theme_preference}
                onChange={(e) => updatePreference('theme_preference', e.target.value)}
                disabled={saving.theme_preference}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose your preferred color theme
              </p>
            </div>
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">
                Language
              </label>
              <select
                value={preferences.language_preference}
                onChange={(e) => updatePreference('language_preference', e.target.value)}
                disabled={saving.language_preference}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select your preferred language
              </p>
            </div>
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">
                Timezone
              </label>
              <select
                value={preferences.timezone_preference}
                onChange={(e) => updatePreference('timezone_preference', e.target.value)}
                disabled={saving.timezone_preference}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Australia/Sydney">Sydney (AEST)</option>
              </select>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select your timezone for race times
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Privacy Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Control your privacy and what information is visible to others
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">
                Profile Visibility
              </label>
              <select
                value={preferences.profile_visibility}
                onChange={(e) => updatePreference('profile_visibility', e.target.value)}
                disabled={saving.profile_visibility}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="public">Public</option>
                <option value="league_only">League Members Only</option>
                <option value="private">Private</option>
              </select>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Control who can see your profile
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-900 dark:text-white font-medium">
                  Show Email to League Members
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Allow league members to see your email address
                </p>
              </div>
              <button
                onClick={() => updatePreference('show_email_to_league_members', !preferences.show_email_to_league_members)}
                disabled={saving.show_email_to_league_members}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.show_email_to_league_members ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } ${saving.show_email_to_league_members ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.show_email_to_league_members ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Auto-Pick Preferences */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Auto-Pick Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Configure automatic draft pick behavior
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-gray-900 dark:text-white font-medium">
                  Enable Auto-Pick
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically pick a driver if you miss your turn
                </p>
              </div>
              <button
                onClick={() => updatePreference('auto_pick_enabled', !preferences.auto_pick_enabled)}
                disabled={saving.auto_pick_enabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.auto_pick_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                } ${saving.auto_pick_enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.auto_pick_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-gray-900 dark:text-white font-medium mb-2">
                Auto-Pick Strategy
              </label>
              <select
                value={preferences.auto_pick_strategy}
                onChange={(e) => updatePreference('auto_pick_strategy', e.target.value)}
                disabled={saving.auto_pick_strategy || !preferences.auto_pick_enabled}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="highest_ranked">Highest Ranked</option>
                <option value="random">Random</option>
                <option value="balanced">Balanced</option>
              </select>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Choose how drivers are selected for auto-pick
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;