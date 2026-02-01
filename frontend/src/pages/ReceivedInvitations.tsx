import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invitationService } from '../services/invitationService';
import type { ReceivedInvitation } from '../types';

type ModalType = 'accept' | 'reject' | null;

export const ReceivedInvitations: React.FC = () => {
  const navigate = useNavigate();

  const [invitations, setInvitations] = useState<ReceivedInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal state
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedInvitation, setSelectedInvitation] = useState<ReceivedInvitation | null>(null);

  // Accept form state
  const [teamName, setTeamName] = useState('');
  const [teamNameError, setTeamNameError] = useState<string | null>(null);

  // Reject form state
  const [rejectReason, setRejectReason] = useState('');

  // Loading states for actions
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await invitationService.getReceivedInvitations();
      // Filter to only show pending invitations
      const pendingInvitations = response.items.filter(
        (inv) => inv.status === 'pending'
      ) as ReceivedInvitation[];
      setInvitations(pendingInvitations);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load invitations');
    } finally {
      setIsLoading(false);
    }
  };

  const openAcceptModal = (invitation: ReceivedInvitation) => {
    setSelectedInvitation(invitation);
    setTeamName('');
    setTeamNameError(null);
    setActiveModal('accept');
  };

  const openRejectModal = (invitation: ReceivedInvitation) => {
    setSelectedInvitation(invitation);
    setRejectReason('');
    setActiveModal('reject');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedInvitation(null);
    setTeamName('');
    setTeamNameError(null);
    setRejectReason('');
  };

  const validateTeamName = (name: string): boolean => {
    if (!name.trim()) {
      setTeamNameError('Team name is required');
      return false;
    }
    if (name.trim().length < 3) {
      setTeamNameError('Team name must be at least 3 characters');
      return false;
    }
    if (name.trim().length > 100) {
      setTeamNameError('Team name must be less than 100 characters');
      return false;
    }
    setTeamNameError(null);
    return true;
  };

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvitation) return;

    if (!validateTeamName(teamName)) {
      return;
    }

    try {
      setIsProcessing(true);
      await invitationService.acceptInvitation(selectedInvitation.id, {
        team_name: teamName.trim(),
      });

      // Remove the accepted invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== selectedInvitation.id));
      setSuccessMessage(`You have joined ${selectedInvitation.league_name}!`);

      // Close modal after a delay
      setTimeout(() => {
        closeModal();
        // Navigate to the league page
        navigate(`/leagues/${selectedInvitation.league_id}`);
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setTeamNameError(error.response?.data?.detail || 'Failed to accept invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInvitation) return;

    try {
      setIsProcessing(true);
      await invitationService.rejectInvitation(selectedInvitation.id, {
        reason: rejectReason.trim() || undefined,
      });

      // Remove the rejected invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== selectedInvitation.id));
      setSuccessMessage('Invitation rejected');

      // Close modal after a delay
      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to reject invitation');
      setIsProcessing(false);
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

  if (isLoading) {
    return (
      <div className="received-invitations-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="received-invitations-page">
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
          <h1>League Invitations</h1>
          <p>View and manage invitations to join leagues</p>
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

        {/* Invitations List */}
        {invitations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h2>No Pending Invitations</h2>
            <p>You don't have any league invitations at the moment.</p>
            <div className="empty-actions">
              <Link to="/leagues" className="btn btn-primary">
                Browse Leagues
              </Link>
              <Link to="/leagues/join" className="btn btn-secondary">
                Join by Code
              </Link>
            </div>
          </div>
        ) : (
          <div className="invitations-list">
            {invitations.map((invitation) => (
              <div key={invitation.id} className="invitation-card">
                <div className="invitation-header">
                  <div className="invitation-league">
                    <h3>{invitation.league_name}</h3>
                    <span className="invitation-time">
                      {getRelativeTime(invitation.created_at)}
                    </span>
                  </div>
                </div>

                <div className="invitation-body">
                  <div className="invitation-details">
                    <p className="inviter-info">
                      <span className="label">Invited by:</span>
                      <span className="value">@{invitation.inviter_username}</span>
                    </p>
                    {invitation.message && (
                      <div className="invitation-message">
                        <span className="label">Message:</span>
                        <p className="message-text">"{invitation.message}"</p>
                      </div>
                    )}
                    <p className="expires-info">
                      <span className="label">Expires:</span>
                      <span className="value">{formatDate(invitation.expires_at)}</span>
                    </p>
                  </div>
                </div>

                <div className="invitation-actions">
                  <button
                    className="btn btn-success"
                    onClick={() => openAcceptModal(invitation)}
                  >
                    ✓ Accept
                  </button>
                  <button
                    className="btn btn-danger btn-outline"
                    onClick={() => openRejectModal(invitation)}
                  >
                    ✕ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Accept Modal */}
      {activeModal === 'accept' && selectedInvitation && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Accept Invitation</h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                You're about to join <strong>{selectedInvitation.league_name}</strong>.
                Create a team name to complete your registration.
              </p>

              <form onSubmit={handleAccept}>
                <div className="form-group">
                  <label htmlFor="team-name">Team Name *</label>
                  <input
                    type="text"
                    id="team-name"
                    className={`form-control ${teamNameError ? 'is-invalid' : ''}`}
                    value={teamName}
                    onChange={(e) => {
                      setTeamName(e.target.value);
                      if (teamNameError) setTeamNameError(null);
                    }}
                    placeholder="Enter your team name"
                    autoFocus
                  />
                  {teamNameError && (
                    <div className="invalid-feedback">{teamNameError}</div>
                  )}
                  <small className="form-text">
                    Team name must be 3-100 characters
                  </small>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Joining...' : 'Join League'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {activeModal === 'reject' && selectedInvitation && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Decline Invitation</h2>
              <button className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="modal-description">
                Are you sure you want to decline the invitation to join{' '}
                <strong>{selectedInvitation.league_name}</strong>?
              </p>

              <form onSubmit={handleReject}>
                <div className="form-group">
                  <label htmlFor="reject-reason">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reject-reason"
                    className="form-control"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Optionally provide a reason for declining..."
                    rows={3}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeModal}
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-danger"
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Declining...' : 'Decline Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceivedInvitations;
