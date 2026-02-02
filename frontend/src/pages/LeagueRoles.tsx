import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { LeagueMember } from '../types';
import { getLeagueRoles, promoteToCoManager, demoteToMember } from '../services/leagueRoleService';
import { useAuth } from '../context/AuthContext';
import { MobileNav } from '../components/MobileNav';

export default function LeagueRoles() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Promote modal state
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promoteMember, setPromoteMember] = useState<LeagueMember | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  // Demote modal state
  const [showDemoteModal, setShowDemoteModal] = useState(false);
  const [demoteMember, setDemoteMember] = useState<LeagueMember | null>(null);
  const [isDemoting, setIsDemoting] = useState(false);

  // Determine if current user is creator
  const currentMember = members.find((m) => m.user_id === user?.id);
  const isCreator = currentMember?.role === 'creator';

  useEffect(() => {
    const fetchRoles = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');
        const data = await getLeagueRoles(id);
        setMembers(data);
      } catch (err: any) {
        console.error('Error fetching league roles:', err);
        setError(err.response?.data?.detail || 'Failed to load league roles');
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [id]);

  const openPromoteModal = (member: LeagueMember) => {
    setPromoteMember(member);
    setShowPromoteModal(true);
  };

  const closePromoteModal = () => {
    setShowPromoteModal(false);
    setPromoteMember(null);
  };

  const handlePromote = async () => {
    if (!id || !promoteMember) return;

    try {
      setIsPromoting(true);
      setError('');
      await promoteToCoManager(id, promoteMember.user_id);
      setSuccessMessage(`Successfully promoted ${promoteMember.username} to Co-Manager!`);
      closePromoteModal();
      
      // Refresh the list
      const data = await getLeagueRoles(id);
      setMembers(data);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error promoting member:', err);
      setError(err.response?.data?.detail || 'Failed to promote member. Please try again.');
    } finally {
      setIsPromoting(false);
    }
  };

  const openDemoteModal = (member: LeagueMember) => {
    setDemoteMember(member);
    setShowDemoteModal(true);
  };

  const closeDemoteModal = () => {
    setShowDemoteModal(false);
    setDemoteMember(null);
  };

  const handleDemote = async () => {
    if (!id || !demoteMember) return;

    try {
      setIsDemoting(true);
      setError('');
      await demoteToMember(id, demoteMember.user_id);
      setSuccessMessage(`Successfully demoted ${demoteMember.username} to Member!`);
      closeDemoteModal();
      
      // Refresh the list
      const data = await getLeagueRoles(id);
      setMembers(data);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error demoting member:', err);
      setError(err.response?.data?.detail || 'Failed to demote member. Please try again.');
    } finally {
      setIsDemoting(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'creator':
        return 'role-creator';
      case 'co_manager':
        return 'role-co-manager';
      default:
        return 'role-member';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'creator':
        return 'Creator';
      case 'co_manager':
        return 'Co-Manager';
      default:
        return 'Member';
    }
  };

  if (loading) {
    return (
    <>
      <MobileNav />
      <div className="league-roles">
        <div className="loading-spinner">Loading league roles...</div>
      </div>
    );
  }

  return (
    <div className="league-roles">
      <div className="page-header">
        <h1>Manage League Roles</h1>
        <button className="btn btn-secondary" onClick={() => navigate(`/leagues/${id}`)}>
          Back to League
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Info Box */}
      {!isCreator && (
        <div className="info-box">
          <p>
            <strong>Note:</strong> Only the league creator can manage member roles.
          </p>
        </div>
      )}

      {/* Members List */}
      <div className="roles-section">
        <h2>League Members ({members.length})</h2>
        
        {members.length > 0 ? (
          <div className="members-grid">
            {members.map((member) => (
              <div key={member.user_id} className="member-card">
                <div className="member-header">
                  <div className="member-avatar">
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="member-details">
                    <h3 className="member-username">{member.username}</h3>
                    <p className="member-fullname">{member.full_name}</p>
                    <p className="member-joined">
                      Joined: {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="member-role-section">
                  <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>
                    {getRoleLabel(member.role)}
                  </span>
                  
                  {/* Action Buttons - only for creator */}
                  {isCreator && member.role !== 'creator' && (
                    <div className="role-actions">
                      {member.role === 'member' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openPromoteModal(member)}
                        >
                          Promote to Co-Manager
                        </button>
                      )}
                      {member.role === 'co_manager' && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => openDemoteModal(member)}
                        >
                          Demote to Member
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Creator indicator */}
                  {member.role === 'creator' && (
                    <span className="creator-indicator">League Creator</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No members in this league yet.</p>
          </div>
        )}
      </div>

      {/* Promote Confirmation Modal */}
      {showPromoteModal && promoteMember && (
        <div className="modal-overlay" onClick={closePromoteModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Promote to Co-Manager</h3>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to promote <strong>{promoteMember.username}</strong> to Co-Manager?
              </p>
              <p className="modal-warning">
                Co-Managers can edit league settings, invite members, and manage invitations.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closePromoteModal}
                disabled={isPromoting}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handlePromote}
                disabled={isPromoting}
              >
                {isPromoting ? 'Promoting...' : 'Promote'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demote Confirmation Modal */}
      {showDemoteModal && demoteMember && (
        <div className="modal-overlay" onClick={closeDemoteModal}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Demote to Member</h3>
            </div>
            <div className="modal-content">
              <p>
                Are you sure you want to demote <strong>{demoteMember.username}</strong> to Member?
              </p>
              <p className="modal-warning">
                They will lose all Co-Manager privileges and will only be able to participate as a regular member.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeDemoteModal}
                disabled={isDemoting}
              >
                Cancel
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleDemote}
                disabled={isDemoting}
              >
                {isDemoting ? 'Demoting...' : 'Demote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}