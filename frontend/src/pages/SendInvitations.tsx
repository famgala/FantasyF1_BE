import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLeagueById } from '../services/leagueService';
import { invitationService } from '../services/invitationService';
import { userService, type UserSearchResult } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { MobileNav } from '../components/MobileNav';
import type { League, SentInvitation } from '../types';

type InvitationTab = 'email' | 'username' | 'userId' | 'code';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const SendInvitations: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [league, setLeague] = useState<League | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<InvitationTab>('email');
  
  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Success/error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Pending invitations
  const [pendingInvitations, setPendingInvitations] = useState<SentInvitation[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagueAndInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Search users when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const results = await userService.searchUsers(debouncedSearchQuery, 10);
          setSearchResults(results);
          setShowSearchResults(true);
        } catch (err) {
          console.error('Search failed:', err);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setSearchQuery(value);
  };

  const handleSelectUser = (user: UserSearchResult) => {
    setUsername(user.username);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const fetchLeagueAndInvitations = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch league details
      const leagueData = await getLeagueById(id);
      setLeague(leagueData);
      
      // Check if user is creator or co-manager
      const isAuthorized = leagueData.creator_id === user?.id || user?.is_superuser;
      // TODO: Add co-manager check when implemented
      
      if (!isAuthorized) {
        setError('Only league creators and co-managers can send invitations.');
        setIsLoading(false);
        return;
      }
      
      // Fetch pending invitations
      const invitationsResponse = await invitationService.getLeagueInvitations(id, 'pending');
      setPendingInvitations(invitationsResponse.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to load league details');
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendEmailInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    
    if (!email.trim()) {
      setFormError('Please enter an email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setFormError('Please enter a valid email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await invitationService.sendEmailInvitation(id!, {
        email: email.trim(),
        message: message.trim() || undefined,
      });
      
      setSuccessMessage(`Invitation sent to ${email}`);
      setEmail('');
      setMessage('');
      
      // Refresh pending invitations
      const invitationsResponse = await invitationService.getLeagueInvitations(id!, 'pending');
      setPendingInvitations(invitationsResponse.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setFormError(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendUsernameInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!username.trim()) {
      setFormError('Please enter a username');
      return;
    }

    try {
      setIsSubmitting(true);
      await invitationService.sendUsernameInvitation(id!, {
        username: username.trim(),
        message: message.trim() || undefined,
      });

      setSuccessMessage(`Invitation sent to @${username}`);
      setUsername('');
      setMessage('');

      // Refresh pending invitations
      const invitationsResponse = await invitationService.getLeagueInvitations(id!, 'pending');
      setPendingInvitations(invitationsResponse.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setFormError(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendUserIdInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!userId.trim()) {
      setFormError('Please enter a user ID');
      return;
    }

    try {
      setIsSubmitting(true);
      await invitationService.sendUserIdInvitation(id!, {
        user_id: userId.trim(),
        message: message.trim() || undefined,
      });

      setSuccessMessage('Invitation sent successfully');
      setUserId('');
      setMessage('');

      // Refresh pending invitations
      const invitationsResponse = await invitationService.getLeagueInvitations(id!, 'pending');
      setPendingInvitations(invitationsResponse.items);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setFormError(error.response?.data?.detail || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCodeInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    try {
      setIsSubmitting(true);
      const response = await invitationService.sendCodeInvitation(id!, {
        message: message.trim() || undefined,
      });

      setSuccessMessage('Invite code created successfully!');
      setMessage('');

      // Refresh pending invitations
      const invitationsResponse = await invitationService.getLeagueInvitations(id!, 'pending');
      setPendingInvitations(invitationsResponse.items);

      // Auto-copy the new invite code
      if (response.invite_code) {
        copyToClipboard(response.invite_code);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setFormError(error.response?.data?.detail || 'Failed to create invite code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await invitationService.cancelInvitation(invitationId);

      // Refresh pending invitations
      const invitationsResponse = await invitationService.getLeagueInvitations(id!, 'pending');
      setPendingInvitations(invitationsResponse.items);

      setSuccessMessage('Invitation cancelled successfully');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setFormError(error.response?.data?.detail || 'Failed to cancel invitation');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
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

  if (isLoading) {
    return (
      <div className="send-invitations-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading league details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="send-invitations-page">
        <div className="error-container">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
          <div className="error-actions">
            <Link to={`/leagues/${id}`} className="btn btn-primary">
              Back to League
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="send-invitations-page">
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

      {/* Mobile Navigation */}
      <MobileNav />

      <main className="invitations-container">
        {/* Header */}
        <div className="page-header">
          <h1>Invite Members to {league?.name}</h1>
          <p>Send invitations to users to join your league</p>
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
        {formError && (
          <div className="alert alert-error">
            <span>{formError}</span>
            <button onClick={() => setFormError(null)} className="close-btn">
              ×
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="invitation-tabs">
          <button
            className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('email');
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            📧 By Email
          </button>
          <button
            className={`tab-btn ${activeTab === 'username' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('username');
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            👤 By Username
          </button>
          <button
            className={`tab-btn ${activeTab === 'userId' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('userId');
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            🆔 By User ID
          </button>
          <button
            className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('code');
              setFormError(null);
              setSuccessMessage(null);
            }}
          >
            🔗 Invite Code
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Email Tab */}
          {activeTab === 'email' && (
            <form onSubmit={handleSendEmailInvitation} className="invitation-form">
              <h3>Send Invitation by Email</h3>
              <p className="form-description">
                Enter the email address of the person you want to invite.
              </p>
              
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email-message">Message (Optional)</label>
                <textarea
                  id="email-message"
                  className="form-control"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          )}

          {/* Username Tab */}
          {activeTab === 'username' && (
            <form onSubmit={handleSendUsernameInvitation} className="invitation-form">
              <h3>Send Invitation by Username</h3>
              <p className="form-description">
                Enter the username of the person you want to invite. Start typing to search for users.
              </p>
              
              <div className="form-group" ref={searchDropdownRef}>
                <label htmlFor="username">Username *</label>
                <div className="search-input-container">
                  <input
                    type="text"
                    id="username"
                    className="form-control"
                    value={username}
                    onChange={handleUsernameChange}
                    placeholder="Start typing to search..."
                    required
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="search-spinner">
                      <div className="spinner-small"></div>
                    </div>
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="search-results-dropdown">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="search-result-item"
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="search-result-info">
                          <span className="search-result-username">@{user.username}</span>
                          {user.full_name && (
                            <span className="search-result-name">{user.full_name}</span>
                          )}
                          <span className="search-result-email">{user.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && !isSearching && (
                  <div className="search-results-dropdown">
                    <div className="search-result-empty">
                      No users found matching "{searchQuery}"
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="username-message">Message (Optional)</label>
                <textarea
                  id="username-message"
                  className="form-control"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          )}

          {/* User ID Tab */}
          {activeTab === 'userId' && (
            <form onSubmit={handleSendUserIdInvitation} className="invitation-form">
              <h3>Send Invitation by User ID</h3>
              <p className="form-description">
                Enter the user ID of the person you want to invite.
              </p>
              
              <div className="form-group">
                <label htmlFor="userId">User ID *</label>
                <input
                  type="text"
                  id="userId"
                  className="form-control"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter user ID"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="userId-message">Message (Optional)</label>
                <textarea
                  id="userId-message"
                  className="form-control"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          )}

          {/* Code Tab */}
          {activeTab === 'code' && (
            <form onSubmit={handleCreateCodeInvitation} className="invitation-form">
              <h3>Create Invite Code</h3>
              <p className="form-description">
                Generate a shareable invite code that anyone can use to join your league.
              </p>
              
              <div className="form-group">
                <label htmlFor="code-message">Message (Optional)</label>
                <textarea
                  id="code-message"
                  className="form-control"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message to include with the invite code..."
                  rows={3}
                />
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Generate Invite Code'}
              </button>
            </form>
          )}
        </div>

        {/* Pending Invitations Section */}
        <div className="pending-invitations-section">
          <h2>Pending Invitations</h2>
          
          {pendingInvitations.length === 0 ? (
            <div className="empty-state-small">
              <p>No pending invitations</p>
              <p className="empty-hint">
                Send invitations using one of the methods above
              </p>
            </div>
          ) : (
            <div className="invitations-list">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="invitation-item">
                  <div className="invitation-info">
                    <div className="invitation-recipient">
                      {invitation.invitee_email && (
                        <span className="recipient-email">
                          📧 {invitation.invitee_email}
                        </span>
                      )}
                      {invitation.invitee_username && (
                        <span className="recipient-username">
                          👤 @{invitation.invitee_username}
                        </span>
                      )}
                      {invitation.invitee_user_id && (
                        <span className="recipient-userid">
                          🆔 User ID: {invitation.invitee_user_id}
                        </span>
                      )}
                      {invitation.invite_code && (
                        <div className="invite-code-container">
                          <span className="invite-code-label">Invite Code:</span>
                          <code className="invite-code">{invitation.invite_code}</code>
                          <button
                            className="btn-copy"
                            onClick={() => copyToClipboard(invitation.invite_code!)}
                            title="Copy to clipboard"
                          >
                            {copiedCode === invitation.invite_code ? '✓ Copied!' : '📋 Copy'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {invitation.message && (
                      <p className="invitation-message">
                        "{invitation.message}"
                      </p>
                    )}
                    
                    <p className="invitation-date">
                      Sent: {formatDate(invitation.created_at)} • 
                      Expires: {formatDate(invitation.expires_at)}
                    </p>
                  </div>
                  
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancelInvitation(invitation.id)}
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SendInvitations;
