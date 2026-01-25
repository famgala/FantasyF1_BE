import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../../services/authService";
import { parseApiError } from "../../../services/api";
import "./ResetPasswordForm.scss";

/**
 * Form data structure for password reset
 */
interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

/**
 * Password strength calculation (matches RegistrationForm)
 * Returns strength score 0-6 based on criteria
 */
const calculatePasswordStrength = (password: string): number => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  return score;
};

/**
 * Get password strength label and color
 */
const getPasswordStrengthLabel = (score: number): { label: string; color: string } => {
  if (score <= 2) return { label: "Weak", color: "#ef4444" };
  if (score <= 4) return { label: "Fair", color: "#f59e0b" };
  return { label: "Strong", color: "#10b981" };
};

/**
 * ResetPasswordForm Component
 * 
 * Allows users to reset their password using a token from email link.
 * Validates password strength and confirmation.
 */
const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const passwordValue = watch("password", "");
  const passwordStrength = calculatePasswordStrength(passwordValue);
  const { label: strengthLabel, color: strengthColor } = getPasswordStrengthLabel(passwordStrength);

  /**
   * Validate password match
   */
  const validatePasswordMatch = useCallback(
    (confirmPassword: string) => {
      return confirmPassword === passwordValue || "Passwords do not match";
    },
    [passwordValue]
  );

  /**
   * Validate password strength
   */
  const validatePasswordStrength = useCallback(
    (password: string) => {
      if (password.length < 8) {
        return "Password must be at least 8 characters";
      }
      if (!/[a-z]/.test(password)) {
        return "Password must contain at least 1 lowercase letter";
      }
      if (!/[A-Z]/.test(password)) {
        return "Password must contain at least 1 uppercase letter";
      }
      if (!/[0-9]/.test(password)) {
        return "Password must contain at least 1 number";
      }
      return true;
    },
    []
  );

  /**
   * Handle form submission
   * Resets password with token from URL
   */
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setErrorMessage("Invalid or missing reset token. Please request a new password reset link.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await resetPassword({
        token,
        new_password: data.password,
      });
      setIsSuccess(true);
    } catch (error) {
      const apiError = parseApiError(error);
      if (apiError.status === 400) {
        setErrorMessage("Invalid or expired reset token. Please request a new password reset link.");
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Navigate to login page after successful reset
   */
  const handleGoToLogin = () => {
    navigate("/login");
  };

  // Show success message after successful reset
  if (isSuccess) {
    return (
      <div className="reset-password-form reset-password-form--success">
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h2 className="floating-label">Password reset successful</h2>
        <p className="success-message">
          Your password has been successfully updated. You can now login with your new password.
        </p>

        <button
          type="button"
          className="button button--primary"
          onClick={handleGoToLogin}
          aria-label="Go to login page"
        >
          Go to Login
        </button>
      </div>
    );
  }

  // Show error if token is missing
  if (!token) {
    return (
      <div className="reset-password-form reset-password-form--error">
        <div className="icon-wrapper">
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
        </div>

        <h2 className="floating-label">Invalid reset link</h2>
        <p className="error-message">
          This password reset link is invalid or has expired. Please request a new password reset link.
        </p>

        <button
          type="button"
          className="button button--secondary"
          onClick={() => navigate("/forgot-password")}
          aria-label="Request new password reset link"
        >
          Request new reset link
        </button>
      </div>
    );
  }

  return (
    <form className="reset-password-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <h2 className="floating-label">Set new password</h2>
      <p className="subheading">
        Enter your new password below. Make sure it meets the security requirements.
      </p>

      {errorMessage && (
        <div className="error-message error-message--block" role="alert">
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
        <label htmlFor="password" className="floating-label">
          New password
        </label>
        <div className="password-wrapper">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className={`input input--text input--password ${errors.password ? "input--error" : ""}`}
            placeholder="Enter new password"
            autoComplete="new-password"
            disabled={isLoading || isSubmitting}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? "password-error" : passwordValue ? "password-strength" : undefined
            }
            {...register("password", {
              required: "Password is required",
              validate: validatePasswordStrength,
            })}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading || isSubmitting}
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {passwordValue && !errors.password && (
          <div className="password-strength" id="password-strength">
            <div className="strength-bar">
              <div
                className="strength-fill"
                style={{
                  width: `${(passwordStrength / 6) * 100}%`,
                  backgroundColor: strengthColor,
                }}
              />
            </div>
            <span className="strength-label" style={{ color: strengthColor }}>
              {strengthLabel}
            </span>
          </div>
        )}

        {errors.password && (
          <p className="error-text" id="password-error" role="alert">
            {errors.password.message}
          </p>
        )}

        <p className="hint-text">8+ characters, uppercase, lowercase, and number required</p>
      </div>

      <div className="form-field">
        <label htmlFor="confirm-password" className="floating-label">
          Confirm password
        </label>
        <div className="password-wrapper">
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            className={`input input--text input--password ${
              errors.confirmPassword ? "input--error" : ""
            }`}
            placeholder="Confirm new password"
            autoComplete="new-password"
            disabled={isLoading || isSubmitting}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: validatePasswordMatch,
            })}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading || isSubmitting}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showConfirmPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {errors.confirmPassword && (
          <p className="error-text" id="confirm-password-error" role="alert">
            {errors.confirmPassword.message}
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
            Resetting password...
          </>
        ) : (
          "Reset password"
        )}
      </button>

      <div className="form-footer">
        <button
          type="button"
          className="link-button"
          onClick={() => navigate("/login")}
          disabled={isLoading || isSubmitting}
        >
          ← Back to login
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
