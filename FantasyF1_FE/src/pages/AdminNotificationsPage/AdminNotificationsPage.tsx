/**
 * Admin Notifications Page
 * 
 * Admin interface for creating and managing system notifications.
 * Allows broadcasting messages to all users, specific leagues, or specific users.
 * Supports scheduling notifications for future delivery.
 */

import { useState, useEffect } from "react";
import { CreateNotificationForm } from "./components/CreateNotificationForm";
import { NotificationHistory } from "./components/NotificationHistory";
import { updateAdminService } from "./services/adminNotificationsService";
import "./AdminNotificationsPage.scss";

export const AdminNotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleNotificationCreated = () => {
    // Switch to history tab after creating notification
    setActiveTab("history");
    setRefreshHistory((prev) => prev + 1);
  };

  return (
    <div className="admin-notifications-page">
      <div className="page-header">
        <h1>Notifications & Broadcasts</h1>
        <p className="page-description">
          Send system-wide notifications, announcements, or alerts to users
        </p>
      </div>

      <div className="notifications-tabs">
        <button
          className={`tab-button ${activeTab === "create" ? "active" : ""}`}
          onClick={() => setActiveTab("create")}
          aria-label="Create new notification"
        >
          Create Notification
        </button>
        <button
          className={`tab-button ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
          aria-label="View notification history"
        >
          Sent History
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "create" && (
          <CreateNotificationForm onNotificationCreated={handleNotificationCreated} />
        )}
        {activeTab === "history" && (
          <NotificationHistory key={refreshHistory} />
        )}
      </div>
    </div>
  );
};
