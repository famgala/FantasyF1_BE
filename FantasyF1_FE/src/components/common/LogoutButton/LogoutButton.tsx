import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../../services/authService";

/**
 * Logout Button Component
 * 
 * Provides a logout button with confirmation dialog.
 * Clears auth tokens and redirects to homepage.
 */
const LogoutButton: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Clear tokens and redirect to homepage
    logout(true);
  };

  const handleClick = () => {
    setShowConfirm(true);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  // If showing confirmation dialog
  if (showConfirm) {
    return (
      <div className="logout-button__confirm">
        <span className="logout-button__confirm-text">Are you sure?</span>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="logout-button__confirm-yes"
          aria-label="Confirm logout"
        >
          Yes
        </button>
        <button
          onClick={handleCancel}
          disabled={isLoggingOut}
          className="logout-button__confirm-no"
          aria-label="Cancel logout"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoggingOut}
      className="logout-button"
      aria-label="Log out"
    >
      {isLoggingOut ? "Logging out..." : "Log out"}
    </button>
  );
};

export default LogoutButton;
