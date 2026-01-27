import React, { useEffect, useState } from "react";
import { type Notification } from "../../../services/notificationService";
import "./NotificationToast.scss";

interface NotificationToastProps {
  notification: Notification;
  onClose?: () => void;
  onClick?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification]);

  if (!visible) {
    return null;
  }

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return (
          <svg
            className="icon-success"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="icon-warning"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case "error":
        return (
          <svg
            className="icon-error"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return (
          <svg
            className="icon-info"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  const getProgressColor = () => {
    switch (notification.type) {
      case "success":
        return "#4caf50";
      case "warning":
        return "#ff9800";
      case "error":
        return "#f44336";
      default:
        return "#2196f3";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`notification-toast ${exiting ? "exiting" : ""} ${notification.type}`}
      role="alert"
      aria-live="polite"
      onClick={onClick}
    >
      <div className="toast-icon">{getIcon()}</div>
      
      <div className="toast-content">
        <div className="toast-header">
          <h4 className="toast-title">{notification.title}</h4>
          <span className="toast-time">{formatTime(notification.timestamp)}</span>
        </div>
        
        <p className="toast-message">{notification.message}</p>
        
        {notification.actionLabel && notification.actionUrl && (
          <a
            href={notification.actionUrl}
            className="toast-action"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) {
                onClick();
              }
            }}
          >
            {notification.actionLabel}
          </a>
        )}
      </div>
      
      {!onClick && (
        <button
          className="toast-close"
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          aria-label="Close notification"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
      
      <div className="toast-progress">
        <div
          className="toast-progress-bar"
          style={{
            backgroundColor: getProgressColor(),
            animation: "progress 5s linear forwards",
          }}
        />
      </div>
    </div>
  );
};
