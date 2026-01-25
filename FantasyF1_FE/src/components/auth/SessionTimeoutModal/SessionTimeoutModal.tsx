import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import "./SessionTimeoutModal.scss";

/**
 * SessionTimeoutModal Component
 * 
 * Displays a modal warning when the user's session is about to expire.
 * Shows remaining time and provides an option to extend the session.
 * Automatically dismisses when user dismisses or extends session.
 */
const SessionTimeoutModal: React.FC = () => {
  const { sessionWarningVisible, sessionRemainingTime, logout, dismissSessionWarning } = useAuth();

  const handleExtendSession = () => {
    // Dismiss the modal - the API service will handle token refresh on next request
    dismissSessionWarning();
  };

  const handleLogoutNow = () => {
    logout();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!sessionWarningVisible) {
    return null;
  }

  return (
    <div className="session-timeout-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="session-timeout-title">
      <div className="session-timeout-modal">
        <div className="session-timeout-modal__header">
          <h2 id="session-timeout-title">Session Expiring Soon</h2>
        </div>
        <div className="session-timeout-modal__body">
          <div className="session-timeout-modal__icon">⏰</div>
          <p>
            Your session will expire in{" "}
            <span className="session-timeout-modal__time">{formatTime(sessionRemainingTime)}</span>
          </p>
          <p className="session-timeout-modal__message">
            For your security, you'll be automatically logged out when your session expires.
          </p>
        </div>
        <div className="session-timeout-modal__footer">
          <button
            type="button"
            className="session-timeout-modal__btn session-timeout-modal__btn--secondary"
            onClick={handleLogoutNow}
          >
            Logout Now
          </button>
          <button
            type="button"
            className="session-timeout-modal__btn session-timeout-modal__btn--primary"
            onClick={handleExtendSession}
          >
            Extend Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
