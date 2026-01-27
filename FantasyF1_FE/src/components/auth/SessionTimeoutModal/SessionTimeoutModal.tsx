import React, { useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import "./SessionTimeoutModal.scss";

/**
 * SessionTimeoutModal Component
 * 
 * Displays a modal warning when the user's session is about to expire.
 * Shows remaining time and provides an option to extend the session.
 * Automatically dismisses when user dismisses or extends session.
 * 
 * Accessibility features:
 * - Focus trapping within modal
 * - ARIA attributes for screen readers
 * - Keyboard navigation
 * - Returns focus to previously focused element on close
 */
const SessionTimeoutModal: React.FC = () => {
  const { sessionWarningVisible, sessionRemainingTime, logout, dismissSessionWarning } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const extendButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  /**
   * Handle keyboard events for focus trapping
   */
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      dismissSessionWarning();
      return;
    }

    if (event.key === "Tab" && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  /**
   * Store previous active element when modal opens
   * Focus the extend button for accessibility
   */
  useEffect(() => {
    if (sessionWarningVisible) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        extendButtonRef.current?.focus();
      }, 100);
    }
  }, [sessionWarningVisible]);

  /**
   * Return focus to previous element when modal closes
   */
  useEffect(() => {
    return () => {
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, []);

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
    <div 
      className="session-timeout-modal-overlay" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-description"
      onKeyDown={handleKeyDown}
      ref={modalRef}
    >
      <div className="session-timeout-modal" tabIndex={-1}>
        <div className="session-timeout-modal__header">
          <h2 id="session-timeout-title">Session Expiring Soon</h2>
        </div>
        <div className="session-timeout-modal__body">
          <div className="session-timeout-modal__icon" aria-hidden="true">⏰</div>
          <p id="session-timeout-description">
            Your session will expire in{" "}
            <span className="session-timeout-modal__time" aria-live="polite" aria-atomic="true">
              {formatTime(sessionRemainingTime)}
            </span>
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
            ref={extendButtonRef}
            autoFocus
          >
            Extend Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
