import React from "react";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import "./ResetPasswordPage.scss";

/**
 * ResetPasswordPage Component
 * 
 * Dedicated page for resetting password with a token from email link.
 * Provides a centered form layout with F1 branding.
 */
const ResetPasswordPage: React.FC = () => {
  return (
    <div className="reset-password-page">
      <div className="reset-password-page__container">
        {/* F1 Brand Header */}
        <div className="reset-password-page__header">
          <div className="brand-logo">
            <svg
              className="f1-logo"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect x="10" y="30" width="80" height="40" fill="#e10600" rx="4" />
              <text
                x="50"
                y="56"
                textAnchor="middle"
                fill="white"
                fontSize="20"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                F1
              </text>
            </svg>
          </div>
          <h1 className="brand-title">Fantasy F1</h1>
          <p className="brand-tagline">Build your dream F1 team</p>
        </div>

        {/* Reset Password Form */}
        <div className="reset-password-page__form-wrapper">
          <ResetPasswordForm />
        </div>

        {/* Footer */}
        <div className="reset-password-page__footer">
          <p className="footer-text">
            Remember your password? <span className="footer-separator">|</span>{" "}
            Return to login
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
