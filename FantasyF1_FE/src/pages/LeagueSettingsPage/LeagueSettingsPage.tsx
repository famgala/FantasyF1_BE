import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  LeagueSettings,
  LeagueMember,
  getLeagueSettings,
  updateLeagueSettings,
  getLeagueMembers,
  removeLeagueMember,
  updateMemberRole,
  deleteLeague,
} from "../../services/leagueService";
import "./LeagueSettingsPage.scss";

/**
 * LeagueSettingsPage Component
 *
 * Manager-only settings page for league configuration.
 * Allows updating league settings, managing members, and deleting the league.
 * Includes editable fields (description, max_teams, is_private) and
 * non-editable fields (name, code). Member management with role assignment.
 */

type TabType = "settings" | "members" | "danger";

const LeagueSettingsPage: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<LeagueSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("settings");
  const [saving, setSaving] = useState(false);

  // Settings form state
  const [settings, setSettings] = useState({
    description: "",
    max_teams: 20,
    is_private: true,
  });

  // Members state
  const [members, setMembers] = useState<LeagueMember[]>([]);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteStep, setDeleteStep] = useState<"first" | "second">("first");

  // Fetch league settings data
  const fetchSettingsData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!leagueId) {
        throw new Error("League ID is required");
      }

      // Fetch settings
      const settingsData = await getLeagueSettings(leagueId);
      setData(settingsData);
      setSettings({
        description: settingsData.description,
        max_teams: settingsData.max_teams,
        is_private: settingsData.is_private,
      });

      // Fetch members
      const membersData = await getLeagueMembers(leagueId);
      setMembers(membersData);
    } catch (err) {
      setError("Failed to load settings data. Please try again.");
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leagueId) {
      fetchSettingsData();
    }
  }, [leagueId]);

  const handleSettingsChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setSettings((prev) => ({
      ...prev,
      [name]: checked !== undefined ? checked : value,
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);

    try {
      if (!leagueId) {
        throw new Error("League ID is required");
      }

      // Validate max_teams
      if (data && settings.max_teams < data.current_teams) {
        toast.error(`Cannot reduce max teams below current count (${data.current_teams})`);
        setSaving(false);
        return;
      }

      await updateLeagueSettings(leagueId, settings);
      toast.success("Settings updated successfully!");
      await fetchSettingsData();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || "Failed to update settings. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!leagueId) {
      toast.error("League ID is required");
      return;
    }

    if (!window.confirm("Are you sure you want to remove this member from the league?")) {
      return;
    }

    try {
      await removeLeagueMember(leagueId, memberId);
      toast.success("Member removed successfully!");
      await fetchSettingsData();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || "Failed to remove member. Please try again.";
      toast.error(errorMessage);
      console.error("Error removing member:", err);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: "manager" | "co_manager" | "member") => {
    if (!leagueId) {
      toast.error("League ID is required");
      return;
    }

    try {
      await updateMemberRole(leagueId, memberId, newRole);
      toast.success(`Role updated to ${newRole.replace("_", " ")}!`);
      await fetchSettingsData();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || "Failed to update role. Please try again.";
      toast.error(errorMessage);
      console.error("Error updating role:", err);
    }
  };

  const handleDeleteLeague = async () => {
    if (!leagueId) {
      toast.error("League ID is required");
      return;
    }

    try {
      await deleteLeague(leagueId);
      toast.success("League deleted successfully!");
      navigate("/dashboard");
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || "Failed to delete league. Please try again.";
      toast.error(errorMessage);
      console.error("Error deleting league:", err);
    }
  };

  if (loading) {
    return (
      <div className="league-settings-page league-settings-page--loading">
        <div className="skeleton skeleton--header" />
        <div className="skeleton skeleton--tabs" />
        <div className="skeleton skeleton--content" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="league-settings-page league-settings-page--error">
        <div className="error-container">
          <h2>Error Loading Settings</h2>
          <p>{error || "Failed to load settings data."}</p>
          <button className="btn btn--primary" onClick={fetchSettingsData}>
            Try Again
          </button>
          <button className="btn btn--outline" onClick={() => navigate(`/league/${leagueId}`)}>
            Back to League
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="league-settings-page">
      {/* Header */}
      <header className="settings-header">
        <div className="settings-header__content">
          <h1 className="settings-header__title">
            <button
              className="back-button"
              onClick={() => navigate(`/league/${leagueId}`)}
            >
              ←
            </button>
            League Settings
          </h1>
          <p className="settings-header__subtitle">{data.name}</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === "settings" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          League Settings
        </button>
        <button
          className={`tab-button ${activeTab === "members" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("members")}
        >
          Members ({members.length})
        </button>
        <button
          className={`tab-button tab-button--danger ${activeTab === "danger" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("danger")}
        >
          Danger Zone
        </button>
      </div>

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="settings-content">
          <div className="settings-section">
            <h2 className="settings-section__title">Basic Information</h2>

            <div className="form-group form-group--disabled">
              <label htmlFor="league-name" className="form-group__label">
                League Name
              </label>
              <input
                id="league-name"
                type="text"
                value={data.name}
                disabled
                className="form-input form-input--disabled"
                title="League name cannot be changed"
              />
              <p className="form-group__hint">League name cannot be changed after creation</p>
            </div>

            <div className="form-group form-group--disabled">
              <label htmlFor="league-code" className="form-group__label">
                League Code
              </label>
              <input
                id="league-code"
                type="text"
                value={data.code}
                disabled
                className="form-input form-input--disabled"
                title="League code cannot be changed"
              />
              <p className="form-group__hint">Share this code to invite new members</p>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-group__label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={settings.description}
                onChange={handleSettingsChange}
                maxLength={500}
                rows={4}
                className="form-input form-input--textarea"
                placeholder="Enter a description for your league"
              />
              <p className="form-group__hint">
                {settings.description.length}/500 characters
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="max-teams" className="form-group__label">
                Maximum Teams
              </label>
              <input
                id="max-teams"
                name="max_teams"
                type="number"
                min={data.current_teams}
                max={100}
                value={settings.max_teams}
                onChange={handleSettingsChange}
                className="form-input"
              />
              <p className="form-group__hint">
                Cannot be lower than current team count ({data.current_teams})
              </p>
            </div>

            <div className="form-group form-group--toggle">
              <label htmlFor="is-private" className="form-group__label">
                Private League
              </label>
              <div className="toggle-switch">
                <input
                  id="is-private"
                  name="is_private"
                  type="checkbox"
                  checked={settings.is_private}
                  onChange={handleSettingsChange}
                  className="toggle-switch__input"
                />
                <label htmlFor="is-private" className="toggle-switch__label">
                  <span className="toggle-switch__slider"></span>
                </label>
              </div>
              <p className="form-group__hint">
                {settings.is_private
                  ? "Private leagues can only be joined via invite code"
                  : "Public leagues can be searched and joined by anyone"}
              </p>
            </div>

            <div className="settings-actions">
              <button
                className="btn btn--primary btn--large"
                onClick={handleSaveSettings}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <div className="settings-content">
          <div className="settings-section">
            <h2 className="settings-section__title">League Members</h2>

            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-card">
                  <div className="member-card__info">
                    <div className="member-avatar">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-details">
                      <h3 className="member-details__name">{member.username}</h3>
                      <p className="member-details__team">{member.team_name}</p>
                      <p className="member-details__email">{member.email}</p>
                    </div>
                  </div>

                  <div className="member-card__actions">
                    <div className="member-role">
                      <span
                        className={`role-badge role-badge--${member.role.replace("_", "-")}`}
                      >
                        {member.role === "manager" && "⭐ Manager"}
                        {member.role === "co_manager" && "🔹 Co-Manager"}
                        {member.role === "member" && "Member"}
                      </span>
                    </div>

                    {member.role !== "manager" && (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="member">Member</option>
                        <option value="co_manager">Co-Manager</option>
                      </select>
                    )}

                    {member.role !== "manager" && (
                      <button
                        className="btn btn--danger btn--small"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone Tab */}
      {activeTab === "danger" && (
        <div className="settings-content">
          <div className="settings-section settings-section--danger">
            <h2 className="settings-section__title">Danger Zone</h2>
            <p className="settings-section__description">
              These actions are irreversible. Please be certain.
            </p>

            <div className="danger-card">
              <div className="danger-card__content">
                <h3 className="danger-card__title">Delete League</h3>
                <p className="danger-card__description">
                  Permanently delete this league and all associated data. This action cannot be undone.
                  All members will lose access to their teams and standings.
                </p>

                <button
                  className="btn btn--danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Delete League
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal modal--danger">
            <div className="modal__header">
              <h2 className="modal__title">Delete League</h2>
              <button
                className="modal__close"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                  setDeleteStep("first");
                }}
              >
                ×
              </button>
            </div>

            <div className="modal__body">
              {deleteStep === "first" ? (
                <>
                  <p className="modal__text">
                    This action will permanently delete the league "<strong>{data.name}</strong>". This cannot be undone.
                  </p>

                  <p className="modal__warning">
                    ⚠️ All members will lose access to their teams, standings, and league data.
                  </p>

                  <label className="modal__label">
                    Type the league name to confirm:
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={data.name}
                      className="modal__input"
                    />
                  </label>
                </>
              ) : (
                <>
                  <p className="modal__text">
                    This is your last chance to cancel. Are you absolutely sure you want to delete the league?
                  </p>

                  <p className="modal__warning modal__warning--bold">
                    ⚠️ This action is irreversible!
                  </p>
                </>
              )}
            </div>

            <div className="modal__footer">
              <button
                className="btn btn--outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                  setDeleteStep("first");
                }}
              >
                Cancel
              </button>
              {deleteStep === "first" ? (
                <button
                  className="btn btn--danger"
                  onClick={() => setDeleteStep("second")}
                  disabled={deleteConfirmation !== data.name}
                >
                  I Understand, Continue
                </button>
              ) : (
                <button className="btn btn--danger" onClick={handleDeleteLeague}>
                  Delete League Permanently
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueSettingsPage;
