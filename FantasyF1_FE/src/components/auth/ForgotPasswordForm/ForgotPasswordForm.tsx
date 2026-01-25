import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { forgotPassword } from "../../../services/authService";
import { parseApiError } from "../../../services/api";
import "./ForgotPasswordForm.scss";

/**
 * Form data structure for forgot password
 */
interface ForgotPasswordFormData {
  email: string;
}

/**
 * ForgotPasswordForm Component
 * 
 * Allows users to request a password reset link via email.
 * For security, always shows a success message regardless of
 * whether the email exists in the system.
 */
const ForgotPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: "",
    },
  });

  /**
   * Handle form submission
   * Requests password reset email
   */
  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await forgotPassword(data.email);
      setIsSuccess(true);
    } catch (error) {
      // For security, we always show success even on error
      // This prevents email enumeration attacks
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate back to login page
   */
  const handleBackToLogin = () => {
    navigate("/login");
  };

  // Show success message after submission
  if (isSuccess) {
    return (
      <div className="forgot-password-form forgot-password-form--success">
        <div className="icon-wrapper">
          <svg
            className="icon icon--success"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        </div>

        <h2 className="floating-label">Email sent</h2>
        <p className="success-message">
          If an account exists for the email provided, you'll receive a password reset link shortly.
          Please check your inbox and spam folder.
        </p>

        <p className="hint-text">The link will expire in 1 hour.</p>

        <button
          type="button"
          className="button button--secondary"
          onClick={handleBackToLogin}
          aria-label="Return to login page"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <form className="forgot-password-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 classNamefloating-label>Reset your password</h2>
      <p className="subheading">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {errorMessage && (
        <div className="error-message" role="alert">
          <svg
            className="icon icon--error"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="form-field">
        <label htmlFor="email" className="floating-label">
          Email address
        </label>
        <input
          id="email"
          type="email"
          className={`input input--text ${errors.email ? "input--error" : ""}`}
          placeholder="Enter your email"
          autoComplete="email"
          disabled={isLoading || isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Please enter a valid email address",
            },
          })}
        />
        {errors.email && (
          <p className="error-text" id="email-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="button button--primary"
        disabled={isLoading || isSubmitting}
        aria-busy={isLoading || isSubmitting}
      >
        {isLoading || isSubmitting ? (
          <>
            <span className="spinner" aria-hidden="true"></span>
            Sending reset link...
          </>
        ) : (
          "Send reset link"
        )}
      </button>

      <div className="form-footer">
        <button
          type="button"
          className="link-button"
          onClick={handleBackToLogin}
          disabled={isLoading || isSubmitting}
        >
          ← Back to login
        </button>
      </div>
    </form>
  );
};

export default ForgotPasswordForm;
