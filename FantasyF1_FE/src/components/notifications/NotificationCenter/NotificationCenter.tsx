import React, { useState, useEffect } from "react";
import "./NotificationCenter.scss";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  leagueId?: string;
  raceId?: string;
  draftId?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
  onClearAll?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "info" | "success" | "warning" | "error">("all");
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread" && notification.read) return false;
    if (typeFilter !== "all" && notification.type !== typeFilter) return false;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    setExpandedNotifications((prev) => {
      const next = new Set(prev);
      if (next.has(notification.id)) {
        next.delete(notification.id);
      } else {
        next.add(notification.id);
      }
      return next;
    });
  };

  const handleActionClick = (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notificationId);
    }
  };

  const handleDelete = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    if (onDeleteNotification) {
      onDeleteNotification(notificationId);
    }
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <svg className="icon icon-success" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>;
      case "warning":
        return <svg className="icon icon-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>;
      case "error":
        return <svg className="icon icon-error" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>;
      case "info":
      default:
        return <svg className="icon icon-info" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  if (notifications.length === 0) {
    return (
      <div className="notification-center">
        <div className="notification-center-header">
          <h2>Notifications</h2>
        </div>
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p>No notifications yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-center">
      <div className="notification-center-header">
        <div className="header-title">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        <div className="header-actions">
          {unreadCount > 0 && onMarkAllAsRead && (
            <button onClick={onMarkAllAsRead} className="action-button">
              Mark all as read
            </button>
          )}
          {onClearAll && (
            <button onClick={onClearAll} className="action-button">
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <button
            className={`filter-button ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-button ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Unread
          </button>
        </div>
        <div className="filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="type-filter"
          >
            <option value="all">All Types</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      <div className="notification-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications match your filters</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification-item ${
                !notification.read ? "unread" : ""
              } ${expandedNotifications.has(notification.id) ? "expanded" : ""}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-details">
                  <div className="notification-header">
                    <h3 className="notification-title">{notification.title}</h3>
                    <span className="notification-time">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                  </div>
                  <p className="notification-message">{notification.message}</p>
                  {notification.actionUrl && notification.actionLabel && (
                    <button
                      className="notification-action"
                      onClick={(e) => handleActionClick(e, notification)}
                    >
                      {notification.actionLabel}
                    </button>
                  )}
                </div>
                <div className="notification-actions">
                  {!notification.read && onMarkAsRead && (
                    <button
                      className="action-icon"
                      onClick={(e) => handleMarkAsRead(e, notification.id)}
                      title="Mark as read"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </button>
                  )}
                  {onDeleteNotification && (
                    <button
                      className="action-icon"
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Delete"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 6h18" />
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredNotifications.length > 0 && (
        <div className="notification-footer">
          <span className="notification-count">
            {filteredNotifications.length} of {notifications.length} notifications
          </span>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
