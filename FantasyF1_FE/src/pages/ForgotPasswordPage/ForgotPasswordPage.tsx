import React from "react";
import { Link } from "react-router-dom";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";
import "./ForgotPasswordPage.scss";

/**
 * ForgotPasswordPage Component
 * 
 * Dedicated page for requesting password reset.
 * Provides a centered form layout with F1 branding.
 */
const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__container">
        {/* F1 Brand Header */}
        <div className="forgot-password-page__header">
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

        {/* Forgot Password Form */}
        <div className="forgot-password-page__form-wrapper">
          <ForgotPasswordForm />
        </div>

        {/* Footer */}
        <div className="forgot-password-page__footer">
          <Link to="/login" className="footer-link">
            ← Back to login
          </Link>
          <div className="footer-links">
            <Link to="/register" className="footer-link">
              Create an account
            </Link>
            <span className="footer-divider">|</span>
            <Link to="/" className="footer-link">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
