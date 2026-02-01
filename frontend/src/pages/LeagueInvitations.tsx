import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { invitationService } from '../services/invitationService';
import { getLeagueById } from '../services/leagueService';
import { useAuth } from '../context/AuthContext';
import type { SentInvitation, League } from '../types';

type InvitationStatus = 'all' | 'pending' | 'accepted' | 'rejected' | 'expired';

export const LeagueInvitations: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [league, setLeague] = useState<League | null>(null);
  const [invitations, setInvitations] = useState<SentInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InvitationStatus>('all');

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<SentInvitation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchLeagueAndInvitations();
  }, [id, statusFilter]);

  const fetchLeagueAndInvitations = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch league data and invitations in parallel
      const [leagueData, invitationsData] = await Promise.all([
        getLeagueById(id),
        invitationService.getLeagueInvitations(id, statusFilter === 'all' ? undefined : statusFilter),
      ]);

      setLeague(leagueData);
      setInvitations(invitationsData.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string }; status?: number } };
      if (error.response?.status === 403) {
        setError('You do not have permission to view invitations for this league.');
      } else {
        setError(error.response?.data?.detail || 'Failed to load league invitations');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const openCancelModal = (invitation: SentInvitation) => {
    setSelectedInvitation(invitation);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setShowCancelModal(false);
    setSelectedInvitation(null);
  };

  const handleCancel = async () => {
    if (!selectedInvitation) return;

    try {
      setIsCancelling(true);
      await invitationService.cancelInvitation(selectedInvitation.id);

      // Remove the cancelled invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== selectedInvitation.id));
      setSuccessMessage('Invitation cancelled successfully');

      // Close modal after a delay
      setTimeout(() => {
        closeCancelModal();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to cancel invitation');
    } finally {
      setIsCancelling(false);
    }
  };

  const getInviteeDisplay = (invitation: SentInvitation): string => {
    if (invitation.invitee_username) {
      return `@${invitation.invitee_username}`;
    }
    if (invitation.invitee_email) {
      return invitation.invitee_email;
    }
    if (invitation.invitee_user_id) {
      return `User ID: ${invitation.invitee_user_id}`;
    }
    return 'Unknown';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'accepted':
        return 'status-accepted';
      case 'rejected':
        return 'status-rejected';
      case 'expired':
        return 'status-expired';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'pending':
        return '⏳';
      case 'accepted':
        return '✓';
      case 'rejected':
        return '✕';
      case 'expired':
        return '⌛';
      default:
        return '';
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

  const getFilteredCount = (): number => {
    if (statusFilter === 'all') {
      return invitations.length;
    }
    return invitations.filter((inv) => inv.status === statusFilter).length;
  };

  // Get unique inviters for the filter
  const getUniqueInviters = () => {
    const inviters = invitations.map((inv) => inv.inviter_id);
    return [...new Set(inviters)];
  };

  if (isLoading) {
    return (
      <div className="league-invitations-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading league invitations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="league-invitations-page">
        <nav className="page-nav">
          <div className="nav-content">
            <Link to="/dashboard" className="nav-brand">
              FantasyF1
            </Link>
            <div className="nav-links">
              <Link to="/dashboard" className="nav-link">
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </nav>
        <main className="invitations-container">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
          <div className="error-actions">
            <button onClick={() => navigate('/my-leagues')} className="btn btn-primary">
              Back to My Leagues
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="league-invitations-page">
      {/* Navigation */}
      <nav className="page-nav">
        <div className="nav-content">
          <Link to="/dashboard" className="nav-brand">
            FantasyF1
          </Link>
          <div className="nav-links">
            <Link to={`/leagues/${id}`} className="nav-link">
              ← Back to League
            </Link>
          </div>
        </div>
      </nav>

      <main className="invitations-container">
        {/* Header */}
        <div className="page-header">
          <h1>League Invitations</h1>
          <p className="league-name">{league?.name}</p>
          <p className="page-description">
            View and manage invitations for this league. Co-managers can cancel any pending invitation.
          </p>
        </div>

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

        {/* Action Buttons */}
        <div className="page-actions">
          <Link to={`/leagues/${id}/invite`} className="btn btn-primary">
            + Send New Invitation
          </Link>
        </div>

        {/* Filter Controls */}
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="status-filter">Filter by Status:</label>
            <select
              id="status-filter"
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InvitationStatus)}
            >
              <option value="all">All ({invitations.length})</option>
              <option value="pending">
                Pending ({invitations.filter((i) => i.status === 'pending').length})
              </option>
              <option value="accepted">
                Accepted ({invitations.filter((i) => i.status === 'accepted').length})
              </option>
              <option value="rejected">
                Rejected ({invitations.filter((i) => i.status === 'rejected').length})
              </option>
              <option value="expired">
                Expired ({invitations.filter((i) => i.status === 'expired').length})
              </option>
            </select>
          </div>
          <span className="results-count">
            Showing {getFilteredCount()} invitation{getFilteredCount() !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Invitations List */}
        {invitations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📨</div>
            <h2>No Invitations</h2>
            <p>No invitations have been sent for this league yet.</p>
            <div className="empty-actions">
              <Link to={`/leagues/${id}/invite`} className="btn btn-primary">
                Send First Invitation
              </Link>
            </div>
          </div>
        ) : (
          <div className="invitations-list">
            {/* Table Header for Desktop */}
            <div className="invitations-table-header">
              <span className="col-invitee">Invitee</span>
              <span className="col-inviter">Invited By</span>
              <span className="col-status">Status</span>
              <span className="col-date">Sent</span>
              <span className="col-actions">Actions</span>
            </div>

            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`invitation-card ${getStatusColor(invitation.status)}`}
              >
                <div className="invitation-row">
                  {/* Invitee */}
                  <div className="invitee-cell">
                    <span className="cell-label">Invitee:</span>
                    <span className="invitee-name">{getInviteeDisplay(invitation)}</span>
                  </div>

                  {/* Inviter */}
                  <div className="inviter-cell">
                    <span className="cell-label">Invited By:</span>
                    <span className="inviter-name">
                      {invitation.inviter_id === user?.id ? 'You' : `User ${invitation.inviter_id.slice(0, 8)}...`}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="status-cell">
                    <span className="cell-label">Status:</span>
                    <div className={`status-badge ${getStatusColor(invitation.status)}`}>
                      <span className="status-icon">{getStatusIcon(invitation.status)}</span>
                      <span className="status-text">
                        {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="date-cell">
                    <span className="cell-label">Sent:</span>
                    <span className="date-text">{getRelativeTime(invitation.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="actions-cell">
                    <span className="cell-label">Actions:</span>
                    {invitation.status === 'pending' ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => openCancelModal(invitation)}
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="status-note">
                        {invitation.status === 'accepted' && 'Joined'}
                        {invitation.status === 'rejected' && 'Declined'}
                        {invitation.status === 'expired' && 'Expired'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Mobile-only details */}
                <div className="invitation-details-mobile">
                  {invitation.message && (
                    <div className="detail-row">
                      <span className="detail-label">Message:</span>
                      <span className="detail-value">"{invitation.message}"</span>
                    </div>
                  )}
                  {invitation.invite_code && (
                    <div className="detail-row">
                      <span className="detail-label">Code:</span>
                      <code className="code-value">{invitation.invite_code}</code>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Expires:</span>
                    <span className="detail-value">{formatDate(invitation.expires_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unique Inviters Info */}
        {invitations.length > 0 && getUniqueInviters().length > 1 && (
          <div className="inviters-info">
            <p>
              <strong>Note:</strong> Invitations sent by {getUniqueInviters().length} different manager
              {getUniqueInviters().length !== 1 ? 's' : ''}.
            </p>
          </div>
        )}
      </main>

      {/* Cancel Modal */}
      {showCancelModal && selectedInvitation && (
        <div className="modal-overlay" onClick={closeCancelModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Invitation</h2>
              <button className="modal-close" onClick={closeCancelModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Are you sure you want to cancel the invitation sent to{' '}
                <strong>{getInviteeDisplay(selectedInvitation)}</strong>?
              </p>
              <div className="warning-banner">
                <span className="warning-icon">⚠️</span>
                <span>This action cannot be undone.</span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeCancelModal}
                  disabled={isCancelling}
                >
                  Keep Invitation
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Invitation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueInvitations;
