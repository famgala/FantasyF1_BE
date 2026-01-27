import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../../contexts/NotificationContext";
import "./NotificationBadge.scss";

export const NotificationBadge: React.FC = () => {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleClick = () => {
    navigate("/notifications");
  };

  return (
    <button
      className="notification-badge"
      onClick={handleClick}
      aria-label="Notifications"
      aria-live="polite"
    >
      <svg
        className="notification-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="badge-count" aria-label={`${unreadCount} unread notifications`}>
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
};
