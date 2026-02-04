import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService } from '../services/adminService';
import { PageLoader } from '../components/PageLoader';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { MobileNav } from '../components/MobileNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { AdminUser, AdminUserFilters, UserDetail } from '../types/admin';

interface UserDetailModalProps {
  user: UserDetail | null;
  onClose: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onMakeSuperuser: () => void;
  onRemoveSuperuser: () => void;
  isUpdating: boolean;
  currentUserId: string;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({
  user,
  onClose,
  onActivate,
  onDeactivate,
  onMakeSuperuser,
  onRemoveSuperuser,
  isUpdating,
  currentUserId,
}) => {
  if (!user) return null;

  const isCurrentUser = user.id === currentUserId;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* User Profile Section */}
          <div className="user-profile-section">
            <div className="user-profile-header">
              <div className="user-avatar-large">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-profile-info">
                <h3>{user.full_name}</h3>
                <p className="user-username">@{user.username}</p>
                <p className="user-email">{user.email}</p>
                <div className="user-badges">
                  <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                  {user.is_superuser && (
                    <span className="badge badge-superuser">Superuser</span>
                  )}
                </div>
              </div>
            </div>

            <div className="user-stats-grid">
              <div className="user-stat-card">
                <span className="user-stat-value">{user.team_count}</span>
                <span className="user-stat-label">Teams</span>
              </div>
              <div className="user-stat-card">
                <span className="user-stat-value">{user.league_count}</span>
                <span className="user-stat-label">Leagues</span>
              </div>
              <div className="user-stat-card">
                <span className="user-stat-value">{formatDate(user.created_at)}</span>
                <span className="user-stat-label">Joined</span>
              </div>
            </div>
          </div>

          {/* Activity Section */}
          {user.activity && user.activity.length > 0 && (
            <div className="user-activity-section">
              <h4>Recent Activity</h4>
              <div className="activity-list">
                {user.activity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="activity-content">
                      <p className="activity-description">{activity.description}</p>
                      <p className="activity-time">{formatDateTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {/* Action Buttons */}
          <div className="user-actions">
            {isCurrentUser ? (
              <p className="text-muted">You cannot modify your own account</p>
            ) : (
              <>
                {user.is_active ? (
                  <button
                    className="btn btn-warning"
                    onClick={onDeactivate}
                    disabled={isUpdating}
                    title="Deactivate this user account"
                  >
                    {isUpdating ? <LoadingSpinner size="sm" /> : 'Deactivate Account'}
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={onActivate}
                    disabled={isUpdating}
                    title="Activate this user account"
                  >
                    {isUpdating ? <LoadingSpinner size="sm" color="white" /> : 'Activate Account'}
                  </button>
                )}

                {user.is_superuser ? (
                  <button
                    className="btn btn-secondary"
                    onClick={onRemoveSuperuser}
                    disabled={isUpdating}
                    title="Remove superuser privileges"
                  >
                    {isUpdating ? <LoadingSpinner size="sm" /> : 'Remove Superuser'}
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={onMakeSuperuser}
                    disabled={isUpdating}
                    title="Grant superuser privileges"
                  >
                    {isUpdating ? <LoadingSpinner size="sm" color="white" /> : 'Make Superuser'}
                  </button>
                )}
              </>
            )}
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get activity icon
const getActivityIcon = (activityType: string): string => {
  const icons: Record<string, string> = {
    registration: '👤',
    login: '🔑',
    league_created: '🏆',
    team_created: '🏎️',
    draft_pick: '✓',
    pick_added: '➕',
    invitation_sent: '📤',
    invitation_accepted: '📥',
  };
  return icons[activityType] || '📋';
};

// Confirmation Modal
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
  confirmVariant?: 'primary' | 'success' | 'warning' | 'danger';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  isConfirming,
  confirmVariant = 'primary',
}) => {
  if (!isOpen) return null;

  const variantClasses = {
    primary: 'btn-primary',
    success: 'btn-success',
    warning: 'btn-warning',
    danger: 'btn-danger',
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isConfirming}>
            {cancelText}
          </button>
          <button
            className={`btn ${variantClasses[confirmVariant]}`}
            onClick={onConfirm}
            disabled={isConfirming}
          >
            {isConfirming ? <LoadingSpinner size="sm" color="white" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    action: (() => void) | null;
    variant: 'primary' | 'success' | 'warning' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    action: null,
    variant: 'primary',
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<AdminUserFilters>(({
    page,
    page_size: pageSize,
  }));

  // Check if user is superuser
  useEffect(() => {
    if (user && !user.is_superuser) {
      showError('Access Denied', 'You do not have permission to access this page');
      navigate('/dashboard');
    }
  }, [user, navigate, showError]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getUsers({
        ...filters,
        page,
        page_size: pageSize,
      });
      setUsers(response.users);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      const message = 'Failed to load users';
      setError(message);
      showError('Error', message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, showError]);

  useEffect(() => {
    if (user?.is_superuser) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const fetchUserDetails = async (userId: string) => {
    setIsLoadingDetails(true);
    try {
      const userDetail = await adminService.getUserById(userId);
      setSelectedUser(userDetail);
    } catch (err) {
      showError('Error', 'Failed to load user details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleFilterChange = (key: keyof AdminUserFilters, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const handleUserClick = (userId: string) => {
    fetchUserDetails(userId);
  };

  const showConfirmation = (
    title: string,
    message: string,
    confirmText: string,
    action: () => void,
    variant: 'primary' | 'success' | 'warning' | 'danger' = 'primary'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      action,
      variant,
    });
  };

  const closeConfirmation = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, action: null }));
  };

  const handleActivate = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      await adminService.updateUser(selectedUser.id, { is_active: true });
      showSuccess('Success', 'User activated successfully');
      setSelectedUser((prev) => prev ? { ...prev, is_active: true } : null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      showError('Error', 'Failed to activate user');
    } finally {
      setIsUpdating(false);
      closeConfirmation();
    }
  };

  const handleDeactivate = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      await adminService.updateUser(selectedUser.id, { is_active: false });
      showSuccess('Success', 'User deactivated successfully');
      setSelectedUser((prev) => prev ? { ...prev, is_active: false } : null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      showError('Error', 'Failed to deactivate user');
    } finally {
      setIsUpdating(false);
      closeConfirmation();
    }
  };

  const handleMakeSuperuser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      await adminService.updateUser(selectedUser.id, { is_superuser: true });
      showSuccess('Success', 'Superuser privileges granted');
      setSelectedUser((prev) => prev ? { ...prev, is_superuser: true } : null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      showError('Error', 'Failed to grant superuser privileges');
    } finally {
      setIsUpdating(false);
      closeConfirmation();
    }
  };

  const handleRemoveSuperuser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      await adminService.updateUser(selectedUser.id, { is_superuser: false });
      showSuccess('Success', 'Superuser privileges removed');
      setSelectedUser((prev) => prev ? { ...prev, is_superuser: false } : null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      showError('Error', 'Failed to remove superuser privileges');
    } finally {
      setIsUpdating(false);
      closeConfirmation();
    }
  };

  const promptDeactivate = () => {
    showConfirmation(
      'Deactivate User',
      `Are you sure you want to deactivate ${selectedUser?.full_name}? They will no longer be able to log in.`,
      'Deactivate',
      handleDeactivate,
      'warning'
    );
  };

  const promptActivate = () => {
    showConfirmation(
      'Activate User',
      `Are you sure you want to activate ${selectedUser?.full_name}?`,
      'Activate',
      handleActivate,
      'success'
    );
  };

  const promptMakeSuperuser = () => {
    showConfirmation(
      'Grant Superuser Privileges',
      `Are you sure you want to grant superuser privileges to ${selectedUser?.full_name}? This will give them full access to the admin dashboard.`,
      'Grant Superuser',
      handleMakeSuperuser,
      'primary'
    );
  };

  const promptRemoveSuperuser = () => {
    showConfirmation(
      'Remove Superuser Privileges',
      `Are you sure you want to remove superuser privileges from ${selectedUser?.full_name}?`,
      'Remove Superuser',
      handleRemoveSuperuser,
      'warning'
    );
  };

  const clearFilters = () => {
    setFilters({ page: 1, page_size: pageSize });
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && users.length === 0) {
    return <PageLoader message="Loading users..." />;
  }

  if (error && users.length === 0) {
    return (
      <ErrorDisplay
        title="Failed to Load Users"
        message={error}
        onRetry={fetchUsers}
      />
    );
  }

  return (
    <div className="page-container">
      <nav className="page-nav">
        <div className="nav-brand">
          <h1>FantasyF1 Admin</h1>
        </div>
        <div className="nav-links">
          <a href="/admin" className="nav-link">← Back to Admin</a>
          <a href="/dashboard" className="nav-link">Dashboard</a>
        </div>
      </nav>

      <MobileNav />

      <main className="page-content">
        <div className="admin-header">
          <div className="admin-title-section">
            <h1 className="page-title">User Management</h1>
            <p className="page-subtitle">Manage user accounts and permissions</p>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group filter-group-large">
              <label htmlFor="search-filter">Search</label>
              <input
                id="search-filter"
                type="text"
                placeholder="Search by username, email, or full name..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="active-filter">Status</label>
              <select
                id="active-filter"
                value={filters.is_active === undefined ? '' : String(filters.is_active)}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('is_active', value === '' ? undefined : value === 'true');
                }}
              >
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="superuser-filter">Role</label>
              <select
                id="superuser-filter"
                value={filters.is_superuser === undefined ? '' : String(filters.is_superuser)}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange('is_superuser', value === '' ? undefined : value === 'true');
                }}
              >
                <option value="">All Users</option>
                <option value="true">Superusers</option>
                <option value="false">Regular Users</option>
              </select>
            </div>
          </div>

          <div className="filters-actions">
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="results-info">
          <p>Showing {users.length} of {total} users</p>
        </div>

        {/* Users Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Full Name</th>
                <th>Status</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr
                  key={userItem.id}
                  onClick={() => handleUserClick(userItem.id)}
                  className="clickable-row"
                >
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{userItem.username.charAt(0).toUpperCase()}</div>
                      <span className="user-name">{userItem.username}</span>
                    </div>
                  </td>
                  <td>{userItem.email}</td>
                  <td>{userItem.full_name}</td>
                  <td>
                    <span className={`status-badge ${userItem.is_active ? 'status-active' : 'status-inactive'}`}>
                      {userItem.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {userItem.is_superuser ? (
                      <span className="badge badge-superuser">Superuser</span>
                    ) : (
                      <span className="text-muted">User</span>
                    )}
                  </td>
                  <td>{formatDate(userItem.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {users.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <h2>No Users Found</h2>
            <p>No users match your current filters.</p>
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onActivate={promptActivate}
          onDeactivate={promptDeactivate}
          onMakeSuperuser={promptMakeSuperuser}
          onRemoveSuperuser={promptRemoveSuperuser}
          isUpdating={isUpdating}
          currentUserId={user?.id || ''}
        />
      )}

      {/* Loading overlay for details */}
      {isLoadingDetails && (
        <div className="modal-overlay">
          <div className="loading-spinner-container">
            <LoadingSpinner size="lg" />
            <p>Loading user details...</p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        cancelText="Cancel"
        onConfirm={() => confirmModal.action?.()}
        onCancel={closeConfirmation}
        isConfirming={isUpdating}
        confirmVariant={confirmModal.variant}
      />
    </div>
  );
};

export default AdminUsers;
