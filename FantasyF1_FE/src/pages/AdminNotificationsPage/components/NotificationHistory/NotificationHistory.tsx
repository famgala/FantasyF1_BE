/**
 * Notification History Component
 * 
 * Displays history of sent/broadcast notifications.
 * Shows notification details, recipient info, and status.
 */

import { useState, useEffect } from "react";
import "./NotificationHistory.scss";

interface NotificationRecord {
  id: number;
  type: "system" | "announcement" | "alert";
  title: string;
  message: string;
  link?: string;
  recipients: "all" | number | number[];
  scheduledAt?: string;
  sentAt: string;
  status: "pending" | "sent" | "failed";
  sentBy: string;
  recipientsCount: number;
}

export const NotificationHistory = () => {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "system" | "announcement" | "alert">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "sent" | "failed">("all");

  useEffect(() => {
    const fetchNotifications = () => {
      // Mock data - in production, this would call the API
      const mockNotifications: NotificationRecord[] = [
        {
          id: 1,
          type: "system",
          title: "Scheduled Maintenance",
          message: "We will be performing scheduled maintenance on Sunday, January 28th from 2:00 AM to 4:00 AM EST. The platform will be temporarily unavailable during this time.",
          link: "https://fantasyf1.com/maintenance",
          recipients: "all",
          sentAt: "2026-01-26T14:00:00Z",
          status: "sent",
          sentBy: "admin_user",
          recipientsCount: 1247,
        },
        {
          id: 2,
          type: "announcement",
          title: "New Season Registration Open!",
          message: "Registration for the 2026 F1 Fantasy season is now open! Create your league and invite friends to compete. Early bird discounts available until February 15th.",
          recipients: "all",
          sentAt: "2026-01-25T10:30:00Z",
          status: "sent",
          sentBy: "admin_user",
          recipientsCount: 1247,
        },
        {
          id: 3,
          type: "alert",
          title: "Important: Draft Room Update",
          message: "The draft room has been updated with new features. Please complete your league drafts by the deadline to avoid penalties.",
          recipients: [1, 2, 3, 4],
          sentAt: "2026-01-24T16:45:00Z",
          status: "sent",
          sentBy: "admin_user",
          recipientsCount: 4,
        },
        {
          id: 4,
          type: "system",
          title: "Database Optimization Completed",
          message: "Our database optimization has been successfully completed. You may notice improved performance across the platform.",
          recipients: "all",
          sentAt: "2026-01-23T08:00:00Z",
          status: "sent",
          sentBy: "system",
          recipientsCount: 1247,
        },
        {
          id: 5,
          type: "announcement",
          title: "Bahrain Grand Prix Preview",
          message: "Get ready for the first race of the season! Check out our race preview with driver analysis and team predictions.",
          link: "https://fantasyf1.com/races/bahrain-2026",
          recipients: "all",
          sentAt: "2026-01-22T12:00:00Z",
          status: "sent",
          sentBy: "admin_user",
          recipientsCount: 1247,
        },
        {
          id: 6,
          type: "system",
          title: "Feature Rollout: Live Race Results",
          message: "We're excited to announce live race results! Get real-time updates during the race.",
          recipients: "all",
          sentAt: "2026-01-20T15:30:00Z",
          status: "failed",
          sentBy: "admin_user",
          recipientsCount: 0,
        },
        {
          id: 7,
          type: "alert",
          title: "Race Results Correction",
          message: "The results for the test race have been corrected. Your team scores have been updated accordingly.",
          recipients: "all",
          scheduledAt: "2026-02-01T09:00:00Z",
          sentAt: "2026-01-20T10:00:00Z",
          status: "pending",
          sentBy: "admin_user",
          recipientsCount: 1247,
        },
      ];

      setNotifications(mockNotifications);
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const filteredNotifications = notifications.filter((notification) => {
    const typeMatch = filterType === "all" || notification.type === filterType;
    const statusMatch = filterStatus === "all" || notification.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "system":
        return "#3b82f6"; // blue
      case "announcement":
        return "#10b981"; // green
      case "alert":
        return "#ef4444"; // red
      default:
        return "#3b82f6";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "#10b981"; // green
      case "failed":
        return "#ef4444"; // red
      case "pending":
        return "#f59e0b"; // orange
      default:
        return "#6b7280"; // gray
    }
  };

  const getRecipientLabel = (recipients: "all" | number | number[]): string => {
    if (recipients === "all") {
      return "All Users";
    } else if (typeof recipients === "number") {
      return `League #${recipients}`;
    } else {
      return `${recipients.length} user${recipients.length > 1 ? "s" : ""}`;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="notification-history loading">
        <div className="loading-spinner" />
        <p>Loading notification history...</p>
      </div>
    );
  }

  return (
    <div className="notification-history">
      <div className="history-header">
        <h2>Sent Notifications History</h2>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="filterType">Type:</label>
            <select
              id="filterType"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="filter-select"
              aria-label="Filter by notification type"
            >
              <option value="all">All Types</option>
              <option value="system">System</option>
              <option value="announcement">Announcement</option>
              <option value="alert">Alert</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="filterStatus">Status:</label>
            <select
              id="filterStatus"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="filter-select"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications found matching the current filters.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map((notification) => (
            <div key={notification.id} className="notification-card">
              <div className="notification-header">
                <div className="notification-type">
                  <div
                    className="type-indicator"
                    style={{
                      backgroundColor: getNotificationTypeColor(notification.type),
                    }}
                  />
                  <span className="type-label">
                    {notification.type.charAt(0).toUpperCase() +
                      notification.type.slice(1)}
                  </span>
                </div>
                <div
                  className="notification-status"
                  style={{
                    color: getStatusColor(notification.status),
                    backgroundColor: `${getStatusColor(notification.status)}20`,
                  }}
                >
                  {notification.status.charAt(0).toUpperCase() +
                    notification.status.slice(1)}
                  {notification.status === "pending" && notification.scheduledAt && (
                    <span className="scheduled-badge">
                      (Scheduled: {formatDate(notification.scheduledAt)})
                    </span>
                  )}
                </div>
              </div>

              <div className="notification-body">
                <h3 className="notification-title">{notification.title}</h3>
                <p className="notification-message">{notification.message}</p>
                {notification.link && (
                  <a
                    href={notification.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="notification-link"
                  >
                    {notification.link}
                  </a>
                )}
              </div>

              <div className="notification-footer">
                <div className="notification-meta">
                  <div className="meta-item">
                    <span className="meta-label">Recipients:</span>
                    <span className="meta-value">
                      {getRecipientLabel(notification.recipients)} (
                      {notification.recipientsCount})
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Sent:</span>
                    <span className="meta-value">{formatDate(notification.sentAt)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">By:</span>
                    <span className="meta-value">{notification.sentBy}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredNotifications.length > 0 && (
        <div className="history-footer">
          <p className="results-count">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
        </div>
      )}
    </div>
  );
};
