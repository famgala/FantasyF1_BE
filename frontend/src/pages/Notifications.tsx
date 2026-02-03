import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { notificationService } from '../services/notificationService';
import type { Notification, NotificationType } from '../types';
import { MobileNav } from '../components/MobileNav';

const notificationTypeLabels: Record<NotificationType, string> = {
  race_finished: 'Race Finished',
  draft_update: 'Draft Update',
  pick_turn: 'Your Pick',
  league_invite: 'League Invite',
  team_update: 'Team Update',
  points_updated: 'Points Updated',
  system: 'System',
};

const notificationTypeColors: Record<NotificationType, string> = {
  race_finished: 'bg-green-100 text-green-800',
  draft_update: 'bg-blue-100 text-blue-800',
  pick_turn: 'bg-red-100 text-red-800',
  league_invite: 'bg-purple-100 text-purple-800',
  team_update: 'bg-yellow-100 text-yellow-800',
  points_updated: 'bg-orange-100 text-orange-800',
  system: 'bg-gray-100 text-gray-800',
};

const notificationTypeIcons: Record<NotificationType, string> = {
  race_finished: '🏁',
  draft_update: '📋',
  pick_turn: '⏰',
  league_invite: '📧',
  team_update: '👥',
  points_updated: '📊',
  system: '🔔',
};

export const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterReadStatus, setFilterReadStatus] = useState<'all' | 'read' | 'unread'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const pageSize = 20;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        skip: (page - 1) * pageSize,
        limit: pageSize,
        unread_only: filterReadStatus === 'unread',
        notification_type: filterType !== 'all' ? filterType : undefined,
      };
      const data = await notificationService.getNotifications(filters);
      setNotifications(data);
      setHasMore(data.length === pageSize);
    } catch {
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, filterType, filterReadStatus]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const summary = await notificationService.getNotificationSummary();
      setUnreadCount(summary.unread_count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Continue navigation even if mark as read fails
      }
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleMarkAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      setError('Failed to mark as read. Please try again.');
    }
  };

  const handleMarkAsUnread = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.markAsUnread(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: false } : n))
      );
      setUnreadCount((prev) => prev + 1);
    } catch {
      setError('Failed to mark as unread. Please try again.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      setError('Failed to mark all as read. Please try again.');
    }
  };

  const openDeleteModal = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotificationToDelete(notificationId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setNotificationToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!notificationToDelete) return;
    try {
      await notificationService.deleteNotification(notificationToDelete);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationToDelete));
      const deletedNotification = notifications.find((n) => n.id === notificationToDelete);
      if (deletedNotification && !deletedNotification.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      closeDeleteModal();
    } catch {
      setError('Failed to delete notification. Please try again.');
      closeDeleteModal();
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterReadStatus === 'read') return n.is_read;
    if (filterReadStatus === 'unread') return !n.is_read;
    return true;
  });

  return (
    <>
      <MobileNav />
      <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-2xl font-bold text-gray-900">
                FantasyF1
              </Link>
              <span className="mx-4 text-gray-300">|</span>
              <h1 className="text-xl font-semibold text-gray-800">Notifications</h1>
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <Link
              to="/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => { setFilterType(e.target.value as NotificationType | 'all'); setPage(1); }}
                  className="block w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All Types</option>
                  {Object.entries(notificationTypeLabels).map(([type, label]) => (
                    <option key={type} value={type}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filterReadStatus}
                  onChange={(e) => { setFilterReadStatus(e.target.value as 'all' | 'read' | 'unread'); setPage(1); }}
                  className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="all">All</option>
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Mark All as Read ({unreadCount})
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">{error}</div>
        )}

        {loading && notifications.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-4xl mb-4">🔔</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-500">
              {filterReadStatus === 'unread'
                ? "You don't have any unread notifications."
                : filterType !== 'all'
                ? `No notifications of type "${notificationTypeLabels[filterType]}".`
                : "You don't have any notifications yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all hover:shadow-md ${
                  notification.is_read
                    ? 'border-l-4 border-gray-300'
                    : 'border-l-4 border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <span className="text-2xl" role="img" aria-label="notification type">
                      {notificationTypeIcons[notification.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${notificationTypeColors[notification.type]}`}>
                          {notificationTypeLabels[notification.type]}
                        </span>
                        {!notification.is_read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">New</span>
                        )}
                      </div>
                      <h3 className={`text-base font-medium ${notification.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(notification.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {notification.is_read ? (
                      <button onClick={(e) => handleMarkAsUnread(notification.id, e)} className="text-gray-400 hover:text-gray-600 p-1" title="Mark as unread">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </button>
                    ) : (
                      <button onClick={(e) => handleMarkAsRead(notification.id, e)} className="text-blue-500 hover:text-blue-700 p-1" title="Mark as read">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button onClick={(e) => openDeleteModal(notification.id, e)} className="text-red-400 hover:text-red-600 p-1" title="Delete">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore || loading}
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </main>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Notification</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this notification? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button onClick={closeDeleteModal} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Notifications;
