import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { login, ApiError } from "../../../services/authService";
import "./LoginForm.scss";

interface LoginFormData {
  password: string;
}

interface LocationState {
  email?: string;
}

/**
 * LoginForm - Authentication form for existing users
 * 
 * Receives email from location state (passed from EmailCheckForm).
 * Features:
 * - Pre-filled email display with "Change Email" option
 * - Password input with visibility toggle
 * - "Forgot Password" link
 * - Error handling for invalid credentials
 * - Loading state during authentication
 * - Secure token storage on success
 */
const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  const email = locationState?.email || "";
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    mode: "onBlur",
  });

  // Redirect to home if no email provided
  useEffect(() => {
    if (!email) {
      navigate("/", { replace: true });
    }
  }, [email, navigate]);

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await login({
        username: email,
        password: data.password,
      });

      // Get return URL or default to dashboard
      const returnUrl = new URLSearchParams(location.search).get("returnUrl");
      navigate(returnUrl || "/dashboard", { replace: true });
    } catch (error) {
      const apiErr = error as ApiError;
      
      // Clear password field on error
      reset({ password: "" });
      
      // Handle specific error messages
      if (apiErr.status === 401) {
        setApiError("Incorrect username or password");
      } else if (apiErr.status === 403) {
        setApiError("Your account is inactive. Please contact support.");
      } else if (apiErr.status === 429) {
        setApiError("Too many login attempts. Please try again later.");
      } else {
        setApiError(apiErr.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = () => {
    navigate("/");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (!email) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="login-form" role="main" aria-labelledby="form-title">
      <div className="login-form__container">
        <div className="login-form__header">
          <h1 id="form-title" className="login-form__title">
            Welcome back
          </h1>
          <p className="login-form__subtitle">
            Sign in to your Fantasy F1 account
          </p>
        </div>

        <div className="login-form__email-display">
          <span className="login-form__email-label">Email</span>
          <div className="login-form__email-row">
            <span className="login-form__email-value" aria-label="Email address">
              {email}
            </span>
            <button
              type="button"
              className="login-form__change-email-btn"
              onClick={handleChangeEmail}
              aria-label="Change email address"
            >
              Change
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="login-form__form"
          noValidate
          aria-describedby={apiError ? "api-error" : undefined}
        >
          <div className="login-form__field">
            <label htmlFor="password" className="login-form__label">
              Password
            </label>
            <div className="login-form__password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={`login-form__input ${
                  errors.password ? "login-form__input--error" : ""
                }`}
                disabled={isLoading}
                {...register("password", {
                  required: "Password is required",
                })}
              />
              <button
                type="button"
                className="login-form__visibility-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <span className="login-form__icon" aria-hidden="true">👁️‍🗨️</span>
                ) : (
                  <span className="login-form__icon" aria-hidden="true">👁️</span>
                )}
              </button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="login-form__error"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="login-form__forgot-password">
            <Link to="/forgot-password" className="login-form__forgot-link">
              Forgot password?
            </Link>
          </div>

          {apiError && (
            <div
              id="api-error"
              className="login-form__api-error"
              role="alert"
              aria-live="polite"
            >
              <span className="login-form__api-error-icon" aria-hidden="true">
                ⚠️
              </span>
              <span>{apiError}</span>
            </div>
          )}

          <button
            type="submit"
            className="login-form__submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="login-form__spinner" aria-hidden="true" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="login-form__footer">
          <p>
            Don't have an account?{" "}
            <Link to="/" className="login-form__signup-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
