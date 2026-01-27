import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { register as registerUser, ApiError } from "../../../services/authService";
import "./RegistrationForm.scss";

// Validation schema using yup
const registrationSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address format"),
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be less than 50 characters")
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  fullName: yup
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must include uppercase, lowercase, and number"
    ),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords do not match"),
  acceptTerms: yup
    .boolean()
    .required("You must accept the terms to continue")
    .oneOf([true], "You must accept the terms to continue"),
});

interface RegistrationFormData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface LocationState {
  email?: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

/**
 * RegistrationForm - Account creation form for new users
 * 
 * Receives email from location state (passed from EmailCheckForm).
 * Features:
 * - Pre-filled email display with "Change Email" option (editable)
 * - Username field (3-50 chars, alphanumeric and underscores)
 * - Optional full name input (max 100 chars)
 * - Password with strength indicator
 * - Confirm password with match validation
 * - Terms & privacy checkbox
 * - Error handling for registration failures (duplicate username/email)
 * - Redirect to login after successful registration
 */
const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  const email = locationState?.email || "";
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: yupResolver(registrationSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      email,
      fullName: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = watch("password", "");

  // Calculate password strength
  const passwordStrength = useMemo((): PasswordStrength => {
    if (!password) {
      return { score: 0, label: "", color: "" };
    }

    let score = 0;
    
    // Length checks
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) {
      return { score, label: "Weak", color: "#dc3545" };
    } else if (score <= 4) {
      return { score, label: "Fair", color: "#ffc107" };
    } else {
      return { score, label: "Strong", color: "#28a745" };
    }
  }, [password]);

  // Redirect to home if no email provided
  useEffect(() => {
    if (!email) {
      navigate("/", { replace: true });
    }
  }, [email, navigate]);

  const onSubmit = async (data: RegistrationFormData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      await registerUser({
        username: data.username,
        email: data.email,
        full_name: data.fullName,
        password: data.password,
      });

      // Navigate to login with success message
      navigate("/login", { 
        state: { 
          email: data.email,
          registrationSuccess: true 
        },
        replace: true 
      });
    } catch (error) {
      const apiErr = error as ApiError;
      
      if (apiErr.status === 409) {
        if (apiErr.message?.toLowerCase().includes("username")) {
          setApiError("Username already registered. Please choose another.");
        } else if (apiErr.message?.toLowerCase().includes("email")) {
          setApiError("Email already registered. Please use another email.");
        } else {
          setApiError("An account with this email already exists.");
        }
      } else if (apiErr.status === 400) {
        setApiError(apiErr.message || "Invalid registration data. Please check your inputs.");
      } else if (apiErr.status === 429) {
        setApiError("Too many registration attempts. Please try again later.");
      } else {
        setApiError(apiErr.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setIsEmailEditable(true);
  };

  const handleCancelEditEmail = () => {
    setIsEmailEditable(false);
  };

  if (!email) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="registration-form" role="main" aria-labelledby="form-title">
      <div className="registration-form__container">
        <div className="registration-form__header">
          <h1 id="form-title" className="registration-form__title">
            Create your account
          </h1>
          <p className="registration-form__subtitle">
            Join Fantasy F1 and compete with friends
          </p>
        </div>

        {/* Email Display / Edit Section */}
        {!isEmailEditable ? (
          <div className="registration-form__email-display">
            <span className="registration-form__email-label">Email</span>
            <div className="registration-form__email-row">
              <span className="registration-form__email-value" aria-label="Email address">
                {email}
              </span>
              <button
                type="button"
                className="registration-form__change-email-btn"
                onClick={handleChangeEmail}
                aria-label="Change email address"
              >
                Change
              </button>
            </div>
          </div>
        ) : (
          <div className="registration-form__field">
            <label htmlFor="email" className="registration-form__label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={`registration-form__input ${
                errors.email ? "registration-form__input--error" : ""
              }`}
              disabled={isLoading}
              {...register("email")}
            />
            {errors.email && (
              <p
                id="email-error"
                className="registration-form__error"
                role="alert"
              >
                {errors.email.message}
              </p>
            )}
            <button
              type="button"
              className="registration-form__cancel-edit-btn"
              onClick={handleCancelEditEmail}
              aria-label="Cancel email edit"
            >
              Cancel
            </button>
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="registration-form__form"
          noValidate
          aria-describedby={apiError ? "api-error" : undefined}
        >
          {/* Username Field */}
          <div className="registration-form__field">
            <label htmlFor="username" className="registration-form__label">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
              aria-required="true"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error username-requirements" : "username-requirements"}
              className={`registration-form__input ${
                errors.username ? "registration-form__input--error" : ""
              }`}
              disabled={isLoading}
              {...register("username")}
            />
            <p id="username-requirements" className="registration-form__hint">
              3-50 characters, letters, numbers, and underscores only
            </p>
            {errors.username && (
              <p
                id="username-error"
                className="registration-form__error"
                role="alert"
              >
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Full Name Field */}
          <div className="registration-form__field">
            <label htmlFor="fullName" className="registration-form__label">
              Full Name <span className="registration-form__optional">(Optional)</span>
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              placeholder="Enter your full name"
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
              className={`registration-form__input ${
                errors.fullName ? "registration-form__input--error" : ""
              }`}
              disabled={isLoading}
              {...register("fullName")}
            />
            {errors.fullName && (
              <p
                id="fullName-error"
                className="registration-form__error"
                role="alert"
              >
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="registration-form__field">
            <label htmlFor="password" className="registration-form__label">
              Password
            </label>
            <div className="registration-form__password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
                aria-required="true"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password 
                    ? "password-error password-requirements" 
                    : "password-requirements"
                }
                className={`registration-form__input ${
                  errors.password ? "registration-form__input--error" : ""
                }`}
                disabled={isLoading}
                {...register("password")}
              />
              <button
                type="button"
                className="registration-form__visibility-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <span className="registration-form__icon" aria-hidden="true">
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </span>
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {password && (
              <div className="registration-form__strength">
                <div className="registration-form__strength-bar">
                  <div 
                    className="registration-form__strength-fill"
                    style={{ 
                      width: `${(passwordStrength.score / 6) * 100}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  />
                </div>
                <span 
                  className="registration-form__strength-label"
                  style={{ color: passwordStrength.color }}
                >
                  {passwordStrength.label}
                </span>
              </div>
            )}
            
            <p id="password-requirements" className="registration-form__hint">
              8+ characters, uppercase, lowercase, and number required
            </p>
            
            {errors.password && (
              <p
                id="password-error"
                className="registration-form__error"
                role="alert"
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="registration-form__field">
            <label htmlFor="confirmPassword" className="registration-form__label">
              Confirm Password
            </label>
            <div className="registration-form__password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm your password"
                aria-required="true"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                className={`registration-form__input ${
                  errors.confirmPassword ? "registration-form__input--error" : ""
                }`}
                disabled={isLoading}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className="registration-form__visibility-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                tabIndex={-1}
              >
                <span className="registration-form__icon" aria-hidden="true">
                  {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                </span>
              </button>
            </div>
            {errors.confirmPassword && (
              <p
                id="confirmPassword-error"
                className="registration-form__error"
                role="alert"
              >
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="registration-form__field registration-form__field--checkbox">
            <label className="registration-form__checkbox-label">
              <input
                type="checkbox"
                className="registration-form__checkbox"
                aria-invalid={!!errors.acceptTerms}
                aria-describedby={errors.acceptTerms ? "terms-error" : undefined}
                disabled={isLoading}
                {...register("acceptTerms")}
              />
              <span className="registration-form__checkbox-text">
                I agree to the{" "}
                <Link to="/terms" className="registration-form__link">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="registration-form__link">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {errors.acceptTerms && (
              <p
                id="terms-error"
                className="registration-form__error"
                role="alert"
              >
                {errors.acceptTerms.message}
              </p>
            )}
          </div>

          {apiError && (
            <div
              id="api-error"
              className="registration-form__api-error"
              role="alert"
              aria-live="polite"
            >
              <span className="registration-form__api-error-icon" aria-hidden="true">
                ⚠️
              </span>
              <span>{apiError}</span>
            </div>
          )}

          <button
            type="submit"
            className="registration-form__submit"
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="registration-form__spinner" aria-hidden="true" />
                <span>Creating account...</span>
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="registration-form__footer">
          <p>
            Already have an account?{" "}
            <Link 
              to="/login" 
              state={{ email }}
              className="registration-form__login-link"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
