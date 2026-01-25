import React, { useState, useEffect, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import "./LeagueInvitationsPage.scss";

/**
 * LeagueInvitationsPage Component
 *
 * Manager-only page for managing league invitations.
 * Features:
 * - Display and copy league invite code
 * - Single email invitation
 * - Bulk email invitations
 * - View and manage pending invites
 * - Revoke pending invites
 */

interface LeagueInvite {
  id: string;
  email: string;
  status: "pending" | "expired" | "accepted" | "declined";
  created_at: string;
  expires_at: string;
  token: string;
}

interface LeagueInfo {
  id: string;
  name: string;
  code: string;
  invite_url: string;
}

type TabType = "invite" | "pending" | "history";

/**
 * Main League Invitations Page Component
 */
const LeagueInvitationsPage: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();

  // States
  const [activeTab, setActiveTab] = useState<TabType>("invite");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // League info
  const [leagueInfo, setLeagueInfo] = useState<LeagueInfo | null>(null);

  // Email invite states
  const [singleEmail, setSingleEmail] = useState("");
  const [bulkEmails, setBulkEmails] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Pending invites states
  const [pendingInvites, setPendingInvites] = useState<LeagueInvite[]>([]);
  const [inviteHistory, setInviteHistory] = useState<LeagueInvite[]>([]);

  // Modal states
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedInvite, setSelectedInvite] = useState<LeagueInvite | null>(null);
  const [revokeConfirmEmail, setRevokeConfirmEmail] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  /**
   * Fetch league info and invites on mount
   */
  useEffect(() => {
    fetchLeagueData();
  }, [leagueId]);

  /**
   * Fetch league information and invitations
   */
  const fetchLeagueData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API calls - replace with actual service calls
      // const leagueResponse = await leagueService.getLeagueInviteInfo(leagueId!);
      // const invitesResponse = await leagueService.getLeagueInvites(leagueId!);

      // Mock data for simulation
      const mockLeagueInfo: LeagueInfo = {
        id: leagueId || "1",
        name: "Formula Fanatics League",
        code: "F4NF4N",
        invite_url: `${window.location.origin}/join?code=F4NF4N`,
      };

      const mockPendingInvites: LeagueInvite[] = [
        {
          id: "1",
          email: "john.doe@example.com",
          status: "pending",
          created_at: "2026-01-25T10:00:00Z",
          expires_at: "2026-02-01T10:00:00Z",
          token: "abc123xyz",
        },
        {
          id: "2",
          email: "jane.smith@example.com",
          status: "pending",
          created_at: "2026-01-24T15:30:00Z",
          expires_at: "2026-01-31T15:30:00Z",
          token: "def456uvw",
        },
      ];

      const mockInviteHistory: LeagueInvite[] = [
        {
          id: "3",
          email: "bob.wilson@example.com",
          status: "accepted",
          created_at: "2026-01-20T09:00:00Z",
          expires_at: "2026-01-27T09:00:00Z",
          token: "ghi789rst",
        },
        {
          id: "4",
          email: "alice.brown@example.com",
          status: "expired",
          created_at: "2026-01-15T12:00:00Z",
          expires_at: "2026-01-22T12:00:00Z",
          token: "jkl012opq",
        },
      ];

      setLeagueInfo(mockLeagueInfo);
      setPendingInvites(mockPendingInvites);
      setInviteHistory(mockInviteHistory);
    } catch (err) {
      setError("Failed to load league invitations. Please try again.");
      console.error("Error fetching league data:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy invite code to clipboard
   */
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(leagueInfo!.code);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
      toast.success("Invite code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy invite code");
    }
  };

  /**
   * Copy invite URL to clipboard
   */
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(leagueInfo!.invite_url);
      toast.success("Invite link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy invite link");
    }
  };

  /**
   * Validate email format
   */
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Send single email invitation
   */
  const handleSendSingleInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = singleEmail.trim();

    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    if (!isValidEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Check for duplicates
    const emailExists =
      pendingInvites.some((invite) => invite.email === email) ||
      inviteHistory.some((invite) => invite.email === email);

    if (emailExists) {
      toast.error("An invitation has already been sent to this email");
      return;
    }

    try {
      setSendingInvite(true);

      // Simulate API call - replace with actual service call
      // await leagueService.sendLeagueInvite(leagueId!, [email]);

      // Mock successful response
      const newInvite: LeagueInvite = {
        id: `${Date.now()}`,
        email,
        status: "pending",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        token: "newtoken123",
      };

      setPendingInvites([newInvite, ...pendingInvites]);
      setSingleEmail("");
      toast.success("Invitation sent successfully!");
    } catch (err) {
      toast.error("Failed to send invitation. Please try again.");
      console.error("Error sending invite:", err);
    } finally {
      setSendingInvite(false);
    }
  };

  /**
   * Send bulk email invitations
   */
  const handleSendBulkInvites = async (e: React.FormEvent) => {
    e.preventDefault();

    const emails = bulkEmails
      .split(/[\n,;]+/)
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    if (emails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    // Validate all emails
    const invalidEmails = emails.filter((email) => !isValidEmail(email));
    if (invalidEmails.length > 0) {
      toast.error(`Invalid email format: ${invalidEmails.slice(0, 3).join(", ")}`);
      return;
    }

    // Check for duplicates
    const existingEmails = [...pendingInvites, ...inviteHistory].map(
      (invite) => invite.email
    );
    const duplicateEmails = emails.filter((email) => existingEmails.includes(email));

    if (duplicateEmails.length > 0) {
      toast.error(
        `Invitations already sent to: ${duplicateEmails.slice(0, 3).join(", ")}`
      );
      return;
    }

    try {
      setSendingInvite(true);

      // Simulate API call - replace with actual service call
      // await leagueService.sendLeagueInvite(leagueId!, emails);

      // Mock successful response
      const newInvites: LeagueInvite[] = emails.map((email) => ({
        id: `${Date.now()}-${Math.random()}`,
        email,
        status: "pending" as const,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        token: `tok${Math.random().toString(36).substring(7)}`,
      }));

      setPendingInvites([...newInvites, ...pendingInvites]);
      setBulkEmails("");
      toast.success(`${newInvites.length} invitations sent successfully!`);
    } catch (err) {
      toast.error("Failed to send invitations. Please try again.");
      console.error("Error sending bulk invites:", err);
    } finally {
      setSendingInvite(false);
    }
  };

  /**
   * Open revoke confirmation modal
   */
  const openRevokeModal = (invite: LeagueInvite) => {
    setSelectedInvite(invite);
    setRevokeConfirmEmail("");
    setShowRevokeModal(true);
  };

  /**
   * Close revoke modal
   */
  const closeRevokeModal = () => {
    setShowRevokeModal(false);
    setSelectedInvite(null);
    setRevokeConfirmEmail("");
  };

  /**
   * Revoke invitation
   */
  const handleRevokeInvite = async () => {
    if (!selectedInvite || revokeConfirmEmail !== selectedInvite.email) {
      toast.error("Please enter the correct email address to confirm");
      return;
    }

    try {
      setRevoking(true);

      // Simulate API call - replace with actual service call
      // await leagueService.revokeLeagueInvite(leagueId!, selectedInvite.id);

      // Mock successful response
      setPendingInvites(
        pendingInvites.filter((invite) => invite.id !== selectedInvite.id)
      );
      const archivedInvite = { ...selectedInvite, status: "revoked" as const };
      setInviteHistory([archivedInvite, ...inviteHistory]);

      toast.success("Invitation revoked successfully!");
      closeRevokeModal();
    } catch (err) {
      toast.error("Failed to revoke invitation. Please try again.");
      console.error("Error revoking invite:", err);
    } finally {
      setRevoking(false);
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Calculate days remaining until expiration
   */
  const getDaysRemaining = (expiresAt: string): number => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  /**
   * Get status badge class
   */
  const getStatusClass = (status: string): string => {
    switch (status) {
      case "pending":
        return "status-badge--pending";
      case "accepted":
        return "status-badge--accepted";
      case "declined":
        return "status-badge--declined";
      case "expired":
        return "status-badge--expired";
      case "revoked":
        return "status-badge--revoked";
      default:
        return "";
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="league-invitations-page league-invitations-page--loading">
        <div className="skeleton skeleton--header" />
        <div className="skeleton skeleton--tabs" />
        <div className="skeleton skeleton--content" />
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="league-invitations-page league-invitations-page--error">
        <div className="error-container">
          <h2>Unable to Load Invitations</h2>
          <p>{error}</p>
          <button className="btn btn--primary" onClick={fetchLeagueData}>
            Try Again
          </button>
          <button
            className="btn btn--outline"
            onClick={() => navigate(`/dashboard/league/${leagueId}`)}
          >
            Back to League
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="league-invitations-page">
      <div className="invitations-header">
        <div className="invitations-header__content">
          <button
            className="back-button"
            onClick={() => navigate(`/dashboard/league/${leagueId}`)}
            aria-label="Back to league dashboard"
          >
            ←
          </button>
          <div>
            <h1 className="invitations-header__title">
              {leagueInfo?.name} - Manage Invitations
            </h1>
            <p className="invitations-header__subtitle">
              Invite new members to join your league
            </p>
          </div>
        </div>
      </div>

      {/* Invite Code Section */}
      <div className="invite-code-section">
        <div className="invite-code-card">
          <div className="invite-code-card__header">
            <h2 className="invite-code-card__title">Share Your League Code</h2>
            <p className="invite-code-card__description">
              Share this code with others so they can join your league directly
            </p>
          </div>

          <div className="invite-code-display">
            <div className="invite-code-display__value">
              <span className="invite-code-display__label">League Code:</span>
              <span className="invite-code-display__code">{leagueInfo?.code}</span>
            </div>
            <button
              className="btn btn--outline"
              onClick={handleCopyCode}
              disabled={!leagueInfo}
            >
              {showCopySuccess ? "✓ Copied!" : "Copy Code"}
            </button>
          </div>

          <div className="invite-url-display">
            <div className="invite-url-display__value">
              <span className="invite-url-display__label">Invite Link:</span>
              <span className="invite-url-display__url">{leagueInfo?.invite_url}</span>
            </div>
            <button
              className="btn btn--outline"
              onClick={handleCopyUrl}
              disabled={!leagueInfo}
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="invitations-tabs">
        <button
          className={`tab-button ${activeTab === "invite" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("invite")}
        >
          Send Invites
        </button>
        <button
          className={`tab-button ${activeTab === "pending" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending ({pendingInvites.length})
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "tab-button--active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          History ({inviteHistory.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="invitations-content">
        {activeTab === "invite" && (
          <div className="invitations-section">
            <div className="inviteMethods-container">
              {/* Single Email Invite */}
              <div className="invite-method-card">
                <h3 className="invite-method-card__title">Send Single Invitation</h3>
                <p className="invite-method-card__description">
                  Invite one person at a time via email
                </p>

                <form
                  className="invite-form"
                  onSubmit={handleSendSingleInvite}
                >
                  <div className="form-group">
                    <label htmlFor="singleEmail" className="form-group__label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="singleEmail"
                      className="form-input"
                      placeholder="Enter email address"
                      value={singleEmail}
                      onChange={(e) => setSingleEmail(e.target.value)}
                      disabled={sendingInvite}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={sendingInvite || !singleEmail}
                  >
                    {sendingInvite ? "Sending..." : "Send Invitation"}
                  </button>
                </form>
              </div>

              {/* Bulk Email Invite */}
              <div className="invite-method-card">
                <h3 className="invite-method-card__title">Send Bulk Invitations</h3>
                <p className="invite-method-card__description">
                  Invite multiple people at once via email
                </p>

                <form
                  className="invite-form"
                  onSubmit={handleSendBulkInvites}
                >
                  <div className="form-group">
                    <label htmlFor="bulkEmails" className="form-group__label">
                      Email Addresses
                    </label>
                    <textarea
                      id="bulkEmails"
                      className="form-input form-input--textarea"
                      placeholder="Enter email addresses separated by commas, colons, or new lines"
                      value={bulkEmails}
                      onChange={(e) => setBulkEmails(e.target.value)}
                      disabled={sendingInvite}
                      rows={8}
                    />
                    <p className="form-group__hint">
                      Separate multiple emails with commas, semicolons, or new lines
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={sendingInvite || !bulkEmails.trim()}
                  >
                    {sendingInvite
                      ? "Sending Invites..."
                      : `Send ${bulkEmails.split(/[\n,;]+/).filter((e) => e.trim()).length} Invitations`}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pending" && (
          <div className="invitations-section">
            {pendingInvites.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-state__title">No Pending Invitations</h3>
                <p className="empty-state__description">
                  You don't have any pending invitations. Send some invites to get started!
                </p>
                <button
                  className="btn btn--primary"
                  onClick={() => setActiveTab("invite")}
                >
                  Send Invites
                </button>
              </div>
            ) : (
              <div className="invites-list">
                {pendingInvites.map((invite) => (
                  <div key={invite.id} className="invite-card">
                    <div className="invite-card__info">
                      <div className="invite-card__email">{invite.email}</div>
                      <div className="invite-card__details">
                        <div className="invite-card__created">
                          Sent: {formatDate(invite.created_at)}
                        </div>
                        <div className="invite-card__expires">
                          Expires in {getDaysRemaining(invite.expires_at)} days
                        </div>
                      </div>
                    </div>
                    <div className="invite-card__actions">
                      <span className={`status-badge ${getStatusClass(invite.status)}`}>
                        {invite.status}
                      </span>
                      <button
                        className="btn btn--small btn--danger"
                        onClick={() => openRevokeModal(invite)}
                      >
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="invitations-section">
            {inviteHistory.length === 0 ? (
              <div className="empty-state">
                <h3 className="empty-state__title">No Invite History</h3>
                <p className="empty-state__description">
                  Your invitation history will appear here.
                </p>
              </div>
            ) : (
              <div className="invites-list">
                {inviteHistory.map((invite) => (
                  <div key={invite.id} className="invite-card invite-card--history">
                    <div className="invite-card__info">
                      <div className="invite-card__email">{invite.email}</div>
                      <div className="invite-card__details">
                        <div className="invite-card__created">
                          Sent: {formatDate(invite.created_at)}
                        </div>
                        <div className="invite-card__status">
                          Status: {invite.status}
                        </div>
                      </div>
                    </div>
                    <div className="invite-card__actions">
                      <span className={`status-badge ${getStatusClass(invite.status)}`}>
                        {invite.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && selectedInvite && (
        <div className="modal-overlay">
          <div className="modal modal--danger">
            <div className="modal__header">
              <h3 className="modal__title">Revoke Invitation</h3>
              <button
                className="modal__close"
                onClick={closeRevokeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="modal__body">
              <p className="modal__text">
                Are you sure you want to revoke the invitation for{" "}
                <strong>{selectedInvite.email}</strong>? This action cannot be undone.
              </p>

              <label htmlFor="revokeConfirmEmail" className="modal__label">
                Type the email address to confirm:
              </label>
              <input
                type="email"
                id="revokeConfirmEmail"
                className="modal__input"
                placeholder={selectedInvite.email}
                value={revokeConfirmEmail}
                onChange={(e) => setRevokeConfirmEmail(e.target.value)}
                disabled={revoking}
              />

              <p className="modal__warning modal__warning--bold">
                This will permanently revoke the invitation.
              </p>
            </div>

            <div className="modal__footer">
              <button
                className="btn btn--outline"
                onClick={closeRevokeModal}
                disabled={revoking}
              >
                Cancel
              </button>
              <button
                className="btn btn--danger"
                onClick={handleRevokeInvite}
                disabled={revoking || revokeConfirmEmail !== selectedInvite.email}
              >
                {revoking ? "Revoking..." : "Revoke Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueInvitationsPage;
