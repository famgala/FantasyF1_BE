import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { invitationService } from '../services/invitationService';
import type { SentInvitation } from '../types';

type InvitationStatus = 'all' | 'pending' | 'accepted' | 'rejected' | 'expired';

export const SentInvitations: React.FC = () => {
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
    fetchInvitations();
  }, [statusFilter]);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const statusParam = statusFilter === 'all' ? undefined : statusFilter;
      const response = await invitationService.getSentInvitations(statusParam);
      setInvitations(response.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load sent invitations');
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

  if (isLoading) {
    return (
      <div className="sent-invitations-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading sent invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sent-invitations-page">
      {/* Navigation */}
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
        {/* Header */}
        <div className="page-header">
          <h1>Sent Invitations</h1>
          <p>Track and manage invitations you've sent to other users</p>
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

        {/* Filter Controls */}
        <div className="filter-controls">
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
          <span className="results-count">
            Showing {getFilteredCount()} invitation{getFilteredCount() !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Invitations List */}
        {invitations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📤</div>
            <h2>No Invitations Sent</h2>
            <p>You haven't sent any league invitations yet.</p>
            <div className="empty-actions">
              <Link to="/leagues" className="btn btn-primary">
                Browse Leagues
              </Link>
              <Link to="/my-leagues" className="btn btn-secondary">
                My Leagues
              </Link>
            </div>
          </div>
        ) : (
          <div className="invitations-list">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className={`invitation-card ${getStatusColor(invitation.status)}`}
              >
                <div className="invitation-header">
                  <div className="invitation-info">
                    <h3>{getInviteeDisplay(invitation)}</h3>
                    <span className="invitation-time">
                      Sent {getRelativeTime(invitation.created_at)}
                    </span>
                  </div>
                  <div className={`status-badge ${getStatusColor(invitation.status)}`}>
                    <span className="status-icon">{getStatusIcon(invitation.status)}</span>
                    <span className="status-text">
                      {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="invitation-body">
                  <div className="invitation-details">
                    <p className="league-info">
                      <span className="label">League:</span>
                      <Link
                        to={`/leagues/${invitation.league_id}`}
                        className="value league-link"
                      >
                        View League
                      </Link>
                    </p>
                    {invitation.message && (
                      <div className="invitation-message">
                        <span className="label">Your Message:</span>
                        <p className="message-text">"{invitation.message}"</p>
                      </div>
                    )}
                    {invitation.invite_code && (
                      <p className="invite-code">
                        <span className="label">Invite Code:</span>
                        <code className="code-value">{invitation.invite_code}</code>
                      </p>
                    )}
                    <p className="expires-info">
                      <span className="label">Expires:</span>
                      <span className="value">{formatDate(invitation.expires_at)}</span>
                    </p>
                  </div>
                </div>

                <div className="invitation-actions">
                  {invitation.status === 'pending' && (
                    <button
                      className="btn btn-danger btn-outline"
                      onClick={() => openCancelModal(invitation)}
                    >
                      ✕ Cancel Invitation
                    </button>
                  )}
                  {invitation.status !== 'pending' && (
                    <span className="status-note">
                      {invitation.status === 'accepted' && 'User has joined the league'}
                      {invitation.status === 'rejected' && 'User declined the invitation'}
                      {invitation.status === 'expired' && 'Invitation has expired'}
                    </span>
                  )}
                </div>
              </div>
            ))}
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

export default SentInvitations;
