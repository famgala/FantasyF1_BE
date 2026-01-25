import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { checkEmailExists, ApiError } from "../../../services/authService";
import "./EmailCheckForm.scss";

interface EmailFormData {
  email: string;
}

/**
 * EmailCheckForm - Entry point for authentication flow
 * 
 * Checks if email exists in system:
 * - If exists: redirects to login page with email pre-filled
 * - If not exists: redirects to registration page with email pre-filled
 * 
 * Features:
 * - Client-side email validation
 * - Loading state during API call
 * - Network error handling with retry
 * - Accessible with ARIA labels and keyboard navigation
 */
const EmailCheckForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    mode: "onBlur",
  });

  // Focus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  const validateEmail = (email: string): boolean | string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return true;
  };

  const onSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const result = await checkEmailExists(data.email);

      if (result.exists) {
        // User exists - go to login with email pre-filled
        navigate("/login", { state: { email: data.email } });
      } else {
        // New user - go to registration with email pre-filled
        navigate("/register", { state: { email: data.email } });
      }
    } catch (error) {
      const apiErr = error as ApiError;
      setApiError(
        apiErr.message || "Unable to verify email. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="email-check-form" role="main" aria-labelledby="form-title">
      <div className="email-check-form__container">
        <div className="email-check-form__header">
          <h1 id="form-title" className="email-check-form__title">
            Welcome to Fantasy F1
          </h1>
          <p className="email-check-form__subtitle">
            Enter your email to get started
          </p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="email-check-form__form"
          noValidate
          aria-describedby={apiError ? "api-error" : undefined}
        >
          <div className="email-check-form__field">
            <label htmlFor="email" className="email-check-form__label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`email-check-form__input ${
                errors.email ? "email-check-form__input--error" : ""
              }`}
              disabled={isLoading}
              {...register("email", {
                required: "Email address is required",
                validate: validateEmail,
              })}
              ref={(e) => {
                register("email").ref(e);
                (emailInputRef as React.MutableRefObject<HTMLInputElement | null>).current = e;
              }}
            />
            {errors.email && (
              <p
                id="email-error"
                className="email-check-form__error"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {apiError && (
            <div
              id="api-error"
              className="email-check-form__api-error"
              role="alert"
              aria-live="polite"
            >
              <span className="email-check-form__api-error-icon" aria-hidden="true">
                ⚠️
              </span>
              <span>{apiError}</span>
              <button
                type="button"
                className="email-check-form__retry-btn"
                onClick={() => setApiError(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          <button
            type="submit"
            className="email-check-form__submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span
                  className="email-check-form__spinner"
                  aria-hidden="true"
                />
                <span>Checking...</span>
              </>
            ) : (
              "Continue"
            )}
          </button>
        </form>

        <p className="email-check-form__footer">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default EmailCheckForm;
