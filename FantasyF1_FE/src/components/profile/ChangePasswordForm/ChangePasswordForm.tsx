import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./ChangePasswordForm.scss";

// Validation schema using yup
const changePasswordSchema = yup
  .object()
  .shape({
    currentPassword: yup
      .string()
      .required("Current password is required")
      .min(1, "Current password is required"),
    newPassword: yup
      .string()
      .required("New password is required")
      .min(8, "Password must be at least 8 characters")
      .matches(/[a-z]/, "Password must contain at least one lowercase letter")
      .matches(/[A-Z]/, "Password must contain at least one uppercase letter")
      .matches(/\d/, "Password must contain at least one number"),
    confirmPassword: yup
      .string()
      .required("Please confirm your new password")
      .oneOf([yup.ref("newPassword")], "Passwords do not match"),
  })
  .test(
    "new-password-different",
    "New password must be different from current password",
    (data) => data.currentPassword !== data.newPassword
  );

/**
 * Form Data Interface
 */
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change Password Form Component Props
 */
interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Change Password Form Component
 * 
 * Allows authenticated users to change their password with validation:
 * - Requires current password for verification
 * - New password must meet security requirements (8+ chars, uppercase, lowercase, number)
 * - Password confirmation must match new password
 * - Real-time password strength indicator
 */
const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setError,
    reset,
  } = useForm<PasswordFormData>({
    resolver: yupResolver(changePasswordSchema),
    mode: "onBlur",
  });

  const newPassword = watch("newPassword", "");

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /**
   * Handles form submission
   */
  const onSubmit = async (data: PasswordFormData) => {
    setIsSubmitting(true);

    try {
      // In production, this would call the actual API
      // await api.put("/auth/change-password", {
      //   currentPassword: data.currentPassword,
      //   newPassword: data.newPassword,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form
      reset();

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Failed to change password:", error);
      setError("currentPassword", {
        type: "manual",
        message: error.response?.data?.detail || "Current password is incorrect",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form cancellation
   */
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to cancel?")) {
        if (onCancel) {
          onCancel();
        }
      }
    } else {
      if (onCancel) {
        onCancel();
      }
    }
  };

  /**
   * Calculates password strength
   */
  const getPasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <div className="change-password-form">
      <div className="change-password-form__header">
        <h2 className="change-password-form__title">Change Password</h2>
        <p className="change-password-form__subtitle">
          Update your password to keep your account secure
        </p>
      </div>

      <form className="change-password-form__form" onSubmit={handleSubmit(onSubmit)}>
        <div className="change-password-form__section">
          <div className="change-password-form__field-group">
            <label
              htmlFor="currentPassword"
              className="change-password-form__label"
            >
              Current Password <span className="change-password-form__required">*</span>
            </label>
            <div className="change-password-form__input-wrapper">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                className={`change-password-form__input ${
                  errors.currentPassword ? "change-password-form__input--error" : ""
                }`}
                placeholder="Enter your current password"
                disabled={isSubmitting}
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={!!errors.currentPassword}
                aria-describedby={
                  errors.currentPassword ? "currentPassword-error" : undefined
                }
                {...register("currentPassword")}
              />
              <button
                type="button"
                className="change-password-form__toggle-password"
                onClick={() => togglePasswordVisibility("current")}
                aria-label={showPasswords.current ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                {showPasswords.current ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.currentPassword && (
              <span id="currentPassword-error" className="change-password-form__error" role="alert">
                {errors.currentPassword.message}
              </span>
            )}
          </div>

          <div className="change-password-form__field-group">
            <label
              htmlFor="newPassword"
              className="change-password-form__label"
            >
              New Password <span className="change-password-form__required">*</span>
            </label>
            <div className="change-password-form__input-wrapper">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                className={`change-password-form__input ${
                  errors.newPassword ? "change-password-form__input--error" : ""
                }`}
                placeholder="Enter a new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={!!errors.newPassword}
                aria-describedby={
                  errors.newPassword ? "newPassword-error newPassword-requirements" : "newPassword-requirements"
                }
                {...register("newPassword")}
              />
              <button
                type="button"
                className="change-password-form__toggle-password"
                onClick={() => togglePasswordVisibility("new")}
                aria-label={showPasswords.new ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                {showPasswords.new ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.newPassword && (
              <span id="newPassword-error" className="change-password-form__error" role="alert">
                {errors.newPassword.message}
              </span>
            )}
            {newPassword && (
              <>
                <div className="change-password-form__strength-meter">
                  <div
                    className={`change-password-form__strength-bar ${
                      passwordStrength <= 2
                        ? "change-password-form__strength-bar--weak"
                        : passwordStrength <= 4
                        ? "change-password-form__strength-bar--medium"
                        : "change-password-form__strength-bar--strong"
                    }`}
                    style={{ width: `${(passwordStrength / 6) * 100}%` }}
                  />
                </div>
                <ul id="newPassword-requirements" className="change-password-form__requirements">
                  <li
                    className={
                      newPassword.length >= 8
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    At least 8 characters
                  </li>
                  <li
                    className={
                      /[a-z]/.test(newPassword)
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    One lowercase letter
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(newPassword)
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    One uppercase letter
                  </li>
                  <li
                    className={
                      /\d/.test(newPassword)
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    One number
                  </li>
                  <li
                    className={
                      /[^a-zA-Z0-9]/.test(newPassword)
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    One special character (optional but recommended)
                  </li>
                </ul>
              </>
            )}
          </div>

          <div className="change-password-form__field-group">
            <label
              htmlFor="confirmPassword"
              className="change-password-form__label"
            >
              Confirm New Password <span className="change-password-form__required">*</span>
            </label>
            <div className="change-password-form__input-wrapper">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                className={`change-password-form__input ${
                  errors.confirmPassword ? "change-password-form__input--error" : ""
                }`}
                placeholder="Confirm your new password"
                disabled={isSubmitting}
                autoComplete="new-password"
                aria-required="true"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
                {...register("confirmPassword")}
              />
              <button
                type="button"
                className="change-password-form__toggle-password"
                onClick={() => togglePasswordVisibility("confirm")}
                aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
                disabled={isSubmitting}
              >
                {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span id="confirmPassword-error" className="change-password-form__error" role="alert">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="change-password-form__actions">
          <button
            type="button"
            onClick={handleCancel}
            className="change-password-form__button change-password-form__button--secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="change-password-form__button change-password-form__button--primary"
            disabled={isSubmitting || !isDirty}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Changing Password..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
