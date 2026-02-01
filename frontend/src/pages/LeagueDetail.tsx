import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { League, LeagueMember, FantasyTeam } from '../types';
import { getLeagueById, getLeagueMembers, getLeagueTeams, leaveLeague, deleteLeague } from '../services/leagueService';
import { useAuth } from '../context/AuthContext';

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [teams, setTeams] = useState<FantasyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLeaving, setIsLeaving] = useState(false);
  
  // Delete league modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Determine user's role and membership status
  const currentMember = members.find((m) => m.user_id === user?.id);
  const userRole = currentMember?.role;
  const isCreator = userRole === 'creator';
  const isCoManager = userRole === 'co_manager';
  const isMember = !!currentMember;
  const isLeagueFull = teams.length >= (league?.max_teams || 0);

  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');

        // Fetch all data in parallel
        const [leagueData, membersData, teamsData] = await Promise.all([
          getLeagueById(id),
          getLeagueMembers(id),
          getLeagueTeams(id),
        ]);

        setLeague(leagueData);
        setMembers(membersData);
        setTeams(teamsData);
      } catch (err: any) {
        console.error('Error fetching league data:', err);
        setError(err.response?.data?.detail || 'Failed to load league details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [id]);

  const handleJoinLeague = () => {
    alert('Join League functionality coming soon! (US-006)');
  };

  const handleLeaveLeague = async () => {
    if (!id) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      'Are you sure you want to leave this league? Your team will be deactivated and you will no longer be able to participate in this league.'
    );

    if (!confirmed) return;

    try {
      setIsLeaving(true);
      await leaveLeague(id);
      setSuccessMessage('You have successfully left the league!');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error leaving league:', err);
      setError(err.response?.data?.detail || 'Failed to leave league. Please try again.');
    } finally {
      setIsLeaving(false);
    }
  };

  const handleEditLeague = () => {
    navigate(`/leagues/${id}/edit`);
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteConfirmName('');
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmName('');
  };

  const handleDeleteLeague = async () => {
    if (!id) return;
    if (!league) return;
    
    // Validate that user typed the correct league name
    if (deleteConfirmName !== league.name) {
      setError('Please type the league name exactly to confirm deletion.');
      return;
    }

    try {
      setIsDeleting(true);
      setError('');
      await deleteLeague(id);
      setShowDeleteModal(false);
      setSuccessMessage('League deleted successfully!');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error('Error deleting league:', err);
      setError(err.response?.data?.detail || 'Failed to delete league. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInviteMembers = () => {
    navigate(`/leagues/${id}/invite`);
  };

  const handleManageInvitations = () => {
    navigate(`/leagues/${id}/invitations`);
  };

  if (loading) {
    return (
      <div className="league-detail">
        <div className="loading-spinner">Loading league details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="league-detail">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="league-detail">
        <div className="alert alert-error">League not found</div>
      </div>
    );
  }

  // Find the creator
  const creator = members.find((m) => m.role === 'creator');

  return (
    <div className="league-detail">
      <div className="league-header">
        <h1>{league.name}</h1>
        <div className="league-meta">
          <span className={`badge badge-${league.privacy}`}>{league.privacy}</span>
          <span className="league-code">Code: {league.code}</span>
        </div>
      </div>

      <div className="league-info">
        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success">{successMessage}</div>
        )}
        {/* Description Section */}
        <div className="info-section">
          <h3>Description</h3>
          <p>{league.description || 'No description provided'}</p>
        </div>

        {/* League Information Section */}
        <div className="info-section">
          <h3>League Information</h3>
          <div className="league-stats">
            <div className="stat-item">
              <span className="stat-label">Creator:</span>
              <span className="stat-value">{creator?.username || 'Unknown'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Teams:</span>
              <span className="stat-value">
                {teams.length} / {league.max_teams}
                {isLeagueFull && <span className="badge badge-full">Full</span>}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Draft Method:</span>
              <span className="stat-value">{league.draft_method}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Privacy:</span>
              <span className="stat-value">{league.privacy}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Created:</span>
              <span className="stat-value">
                {new Date(league.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Members Section */}
        <div className="info-section">
          <h3>Members ({members.length})</h3>
          {members.length > 0 ? (
            <div className="members-list">
              {members.map((member) => (
                <div key={member.user_id} className="member-item">
                  <div className="member-info">
                    <span className="member-username">{member.username}</span>
                    <span className="member-fullname">{member.full_name}</span>
                  </div>
                  <span className={`role-badge role-${member.role}`}>
                    {member.role === 'creator'
                      ? 'Creator'
                      : member.role === 'co_manager'
                      ? 'Co-Manager'
                      : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No members yet</p>
          )}
        </div>

        {/* Teams Section */}
        <div className="info-section">
          <h3>Teams ({teams.length})</h3>
          {teams.length > 0 ? (
            <div className="teams-list">
              {teams.map((team) => {
                const owner = members.find((m) => m.user_id === team.user_id);
                return (
                  <div key={team.id} className="team-item">
                    <div className="team-info">
                      <span className="team-name">{team.name}</span>
                      <span className="team-owner">
                        Owner: {owner?.username || 'Unknown'}
                      </span>
                    </div>
                    <div className="team-stats">
                      <span className="team-points">{team.total_points} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">No teams yet</p>
          )}
        </div>

        {/* Actions Section */}
        <div className="info-section">
          <h3>Actions</h3>
          <div className="action-buttons">
            {/* Join League Button - shown if not a member and league not full */}
            {!isMember && !isLeagueFull && (
              <button className="btn btn-success" onClick={handleJoinLeague}>
                Join League
              </button>
            )}

            {/* Leave League Button - shown if member but not creator */}
            {isMember && !isCreator && (
              <button 
                className="btn btn-secondary" 
                onClick={handleLeaveLeague}
                disabled={isLeaving}
              >
                {isLeaving ? 'Leaving...' : 'Leave League'}
              </button>
            )}

            {/* Edit League Button - shown if creator or co-manager */}
            {(isCreator || isCoManager) && (
              <button className="btn btn-primary" onClick={handleEditLeague}>
                Edit League
              </button>
            )}

            {/* Delete League Button - shown if creator */}
            {isCreator && (
              <button className="btn btn-danger" onClick={openDeleteModal}>
                Delete League
              </button>
            )}

            {/* Invite Members Button - shown if creator or co-manager */}
            {(isCreator || isCoManager) && (
              <button className="btn btn-primary" onClick={handleInviteMembers}>
                Invite Members
              </button>
            )}

            {/* Manage Invitations Button - shown if creator or co-manager */}
            {(isCreator || isCoManager) && (
              <button className="btn btn-secondary" onClick={handleManageInvitations}>
                Manage Invitations
              </button>
            )}

            {/* Leaderboard Link */}
            <Link to={`/leagues/${id}/leaderboard`} className="btn btn-outline">
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {/* Delete League Confirmation Modal */}
      {showDeleteModal && league && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Delete League</h3>
            </div>
            <div className="modal-content">
              <div className="delete-warning">
                <p className="warning-text">
                  <strong>Warning:</strong> This action is permanent and cannot be undone.
                </p>
                <p className="warning-details">
                  All league data, including teams, members, settings, and history will be permanently deleted.
                </p>
              </div>
              <p className="confirm-instruction">
                To confirm deletion, please type the league name: <strong>{league.name}</strong>
              </p>
              <input
                type="text"
                className="form-control"
                placeholder="Type league name to confirm"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteLeague}
                disabled={isDeleting || deleteConfirmName !== league.name}
              >
                {isDeleting ? 'Deleting...' : 'Delete League'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
