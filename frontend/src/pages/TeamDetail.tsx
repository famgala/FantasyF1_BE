import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as teamService from '../services/teamService';
import { MobileNav } from '../components/MobileNav';
import type { TeamDetail, TeamPick, UpdateTeamNameRequest } from '../types';

export const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [picks, setPicks] = useState<TeamPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit team name modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete team modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Remove pick modal state
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [pickToRemove, setPickToRemove] = useState<TeamPick | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTeamData();
    }
  }, [id]);

  const fetchTeamData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const [teamData, picksData] = await Promise.all([
        teamService.getTeamDetail(id),
        teamService.getTeamPicks(id),
      ]);

      setTeam(teamData);
      setPicks(picksData);
      setEditTeamName(teamData.name);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load team details');
    } finally {
      setIsLoading(false);
    }
  };

  const openEditModal = () => {
    setEditTeamName(team?.name || '');
    setEditError(null);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditError(null);
  };

  const handleUpdateTeamName = async () => {
    if (!id || !editTeamName.trim()) {
      setEditError('Team name is required');
      return;
    }

    if (editTeamName.length < 3) {
      setEditError('Team name must be at least 3 characters');
      return;
    }

    if (editTeamName.length > 100) {
      setEditError('Team name must be less than 100 characters');
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);

      const data: UpdateTeamNameRequest = { name: editTeamName.trim() };
      const updatedTeam = await teamService.updateTeamName(id, data);

      setTeam(updatedTeam);
      setSuccessMessage('Team name updated successfully');
      closeEditModal();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setEditError(error.response?.data?.detail || 'Failed to update team name');
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmation('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
  };

  const handleDeleteTeam = async () => {
    if (!id || !team) return;

    if (deleteConfirmation !== team.name) {
      return;
    }

    try {
      setIsDeleting(true);
      await teamService.deleteTeam(id);

      setSuccessMessage('Team deleted successfully');
      closeDeleteModal();

      setTimeout(() => {
        navigate('/my-teams');
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to delete team');
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  const openRemoveModal = (pick: TeamPick) => {
    setPickToRemove(pick);
    setShowRemoveModal(true);
  };

  const closeRemoveModal = () => {
    setShowRemoveModal(false);
    setPickToRemove(null);
  };

  const handleRemovePick = async () => {
    if (!id || !pickToRemove) return;

    try {
      setIsRemoving(true);
      await teamService.removePick(id, pickToRemove.id);

      setSuccessMessage('Pick removed successfully');
      closeRemoveModal();

      // Refresh team data to update budget
      await fetchTeamData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to remove pick');
      closeRemoveModal();
    } finally {
      setIsRemoving(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return formatDate(dateString);
  };

  // Group picks by race
  const picksByRace = picks.reduce<Record<string, TeamPick[]>>((acc, pick) => {
    if (!acc[pick.race_id]) {
      acc[pick.race_id] = [];
    }
    acc[pick.race_id].push(pick);
    return acc;
  }, {});

  // Sort races by date (upcoming first, then past)
  const sortedRaces = Object.entries(picksByRace).sort(([, picksA], [, picksB]) => {
    const dateA = new Date(picksA[0].race_date);
    const dateB = new Date(picksB[0].race_date);
    return dateA.getTime() - dateB.getTime();
  });

  if (isLoading) {
    return (
      <div className="team-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading team details...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="team-detail-page">
        <div className="error-container">
          <h2>Team Not Found</h2>
          <p>The team you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/my-teams" className="btn btn-primary">
            Back to My Teams
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="team-detail-page">
      {/* Navigation */}
      <nav className="page-nav">
        <div className="nav-content">
          <Link to="/dashboard" className="nav-brand">
            FantasyF1
          </Link>
          <div className="nav-links">
            <Link to="/my-teams" className="nav-link">
              ← Back to My Teams
            </Link>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <MobileNav />

      <main className="team-detail-container">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="alert alert-success">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="close-btn">
              ×
            </button>
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="close-btn">
              ×
            </button>
          </div>
        )}

        {/* Team Header */}
        <div className="team-header">
          <div className="team-info">
            <h1 className="team-name">{team.name}</h1>
            <div className="team-meta">
              <Link to={`/leagues/${team.league_id}`} className="league-link">
                {team.league_name}
              </Link>
              <span className="separator">•</span>
              <span className="team-owner">Owned by {team.username}</span>
              <span className="separator">•</span>
              <span className="team-status">
                {team.is_active ? (
                  <span className="status-badge status-active">Active</span>
                ) : (
                  <span className="status-badge status-inactive">Inactive</span>
                )}
              </span>
            </div>
          </div>
          <div className="team-actions">
            <button className="btn btn-secondary" onClick={openEditModal}>
              ✏️ Edit Name
            </button>
            {team.can_delete && (
              <button className="btn btn-danger" onClick={openDeleteModal}>
                🗑️ Delete Team
              </button>
            )}
          </div>
        </div>

        {/* Team Stats */}
        <div className="team-stats">
          <div className="stat-card">
            <div className="stat-label">Total Points</div>
            <div className="stat-value stat-points">{team.total_points}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Budget</div>
            <div className="stat-value stat-budget">${team.budget.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Remaining</div>
            <div className="stat-value stat-remaining">${team.budget_remaining.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Created</div>
            <div className="stat-value stat-created">{getRelativeTime(team.created_at)}</div>
          </div>
        </div>

        {/* Team Roster */}
        <div className="team-roster-section">
          <div className="section-header">
            <h2>Team Roster</h2>
            <p className="section-description">
              Driver picks organized by race
            </p>
          </div>

          {sortedRaces.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏎️</div>
              <h2>No Picks Yet</h2>
              <p>You haven't selected any drivers for your team yet.</p>
              <p className="empty-note">
                Picks will appear here once you start adding drivers to your roster.
              </p>
            </div>
          ) : (
            <div className="roster-list">
              {sortedRaces.map(([raceId, racePicks]) => {
                const race = racePicks[0];
                const isUpcoming = race.race_status === 'upcoming';
                const isOngoing = race.race_status === 'ongoing';

                return (
                  <div key={raceId} className={`race-section ${race.race_status}`}>
                    <div className="race-header">
                      <div className="race-info">
                        <h3 className="race-name">{race.race_name}</h3>
                        <span className="race-date">{formatDate(race.race_date)}</span>
                      </div>
                      <div className="race-status">
                        {isUpcoming && <span className="status-badge status-upcoming">Upcoming</span>}
                        {isOngoing && <span className="status-badge status-ongoing">Ongoing</span>}
                        {race.race_status === 'completed' && (
                          <span className="status-badge status-completed">Completed</span>
                        )}
                      </div>
                    </div>

                    <div className="picks-grid">
                      {racePicks.map((pick) => (
                        <div key={pick.id} className="driver-card">
                          <div className="driver-header">
                            <div className="driver-number">#{pick.driver_number}</div>
                            <div className="driver-name">{pick.driver_name}</div>
                          </div>
                          <div className="driver-team">{pick.driver_team}</div>
                          <div className="driver-stats">
                            <div className="driver-stat">
                              <span className="stat-label">Price:</span>
                              <span className="stat-value">${pick.driver_price.toLocaleString()}</span>
                            </div>
                            <div className="driver-stat">
                              <span className="stat-label">Points:</span>
                              <span className="stat-value stat-points">{pick.points_earned}</span>
                            </div>
                          </div>
                          {isUpcoming && (
                            <div className="pick-actions">
                              <button 
                                className="btn btn-sm btn-outline"
                                onClick={() => navigate(`/teams/${id}/picks/${raceId}`)}
                              >
                                Modify Pick
                              </button>
                              <button 
                                className="btn btn-sm btn-danger"
                                onClick={() => openRemoveModal(pick)}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {isUpcoming && (
                      <div className="race-actions">
                        <button 
                          className="btn btn-primary"
                          onClick={() => navigate(`/teams/${id}/picks/${raceId}`)}
                        >
                          + Add Pick for {race.race_name}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Edit Team Name Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Team Name</h2>
              <button className="modal-close" onClick={closeEditModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {editError && (
                <div className="alert alert-error">
                  <span>{editError}</span>
                </div>
              )}
              <div className="form-group">
                <label htmlFor="team-name">Team Name</label>
                <input
                  type="text"
                  id="team-name"
                  className="form-control"
                  value={editTeamName}
                  onChange={(e) => setEditTeamName(e.target.value)}
                  placeholder="Enter team name"
                  maxLength={100}
                  autoFocus
                />
                <div className="form-hint">
                  {editTeamName.length}/100 characters
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateTeamName}
                  disabled={isUpdating || !editTeamName.trim()}
                >
                  {isUpdating ? 'Updating...' : 'Update Name'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Team Modal */}
      {showDeleteModal && team && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Team</h2>
              <button className="modal-close" onClick={closeDeleteModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Are you sure you want to delete your team <strong>{team.name}</strong>?
              </p>
              <div className="warning-banner">
                <span className="warning-icon">⚠️</span>
                <span>This action cannot be undone. All picks and team data will be permanently deleted.</span>
              </div>
              <div className="form-group">
                <label htmlFor="delete-confirmation">
                  Type <strong>{team.name}</strong> to confirm deletion:
                </label>
                <input
                  type="text"
                  id="delete-confirmation"
                  className="form-control"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={team.name}
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteTeam}
                  disabled={isDeleting || deleteConfirmation !== team.name}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Team'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Pick Modal */}
      {showRemoveModal && pickToRemove && (
        <div className="modal-overlay" onClick={closeRemoveModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Remove Pick</h2>
              <button className="modal-close" onClick={closeRemoveModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Are you sure you want to remove <strong>{pickToRemove.driver_name}</strong> from your team?
              </p>
              <div className="pick-details">
                <div className="detail-row">
                  <span className="detail-label">Race:</span>
                  <span className="detail-value">{pickToRemove.race_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Driver:</span>
                  <span className="detail-value">#{pickToRemove.driver_number} {pickToRemove.driver_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Team:</span>
                  <span className="detail-value">{pickToRemove.driver_team}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Price:</span>
                  <span className="detail-value">${pickToRemove.driver_price.toLocaleString()}</span>
                </div>
              </div>
              <div className="info-banner">
                <span className="info-icon">ℹ️</span>
                <span>Removing this pick will refund ${pickToRemove.driver_price.toLocaleString()} to your team budget.</span>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeRemoveModal}
                  disabled={isRemoving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRemovePick}
                  disabled={isRemoving}
                >
                  {isRemoving ? 'Removing...' : 'Remove Pick'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDetailPage;
