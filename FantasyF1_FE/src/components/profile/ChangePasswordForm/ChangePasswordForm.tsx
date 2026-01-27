import React, { useState } from "react";
import "./ChangePasswordForm.scss";

/**
 * Form Data Interface
 */
interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Form Validation Errors Interface
 */
interface FormErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
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
 * - New password must meet security requirements
 * - Password confirmation must match new password
 */
const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  /**
   * Handles input field changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: PasswordFormData) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    setErrors((prev: FormErrors) => ({ ...prev, [name]: undefined }));
  };

  /**
   * Toggles password visibility
   */
  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /**
   * Validates the form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Current password validation
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    // New password validation
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      newErrors.newPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // In production, this would call the actual API
      // await api.put("/auth/change-password", {
      //   currentPassword: formData.currentPassword,
      //   newPassword: formData.newPassword,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Reset form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      setErrors({
        currentPassword: "Current password is incorrect",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handles form cancellation
   */
  const handleCancel = () => {
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
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

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <div className="change-password-form">
      <div className="change-password-form__header">
        <h2 className="change-password-form__title">Change Password</h2>
        <p className="change-password-form__subtitle">
          Update your password to keep your account secure
        </p>
      </div>

      <form className="change-password-form__form" onSubmit={handleSubmit}>
        <div className="change-password-form__section">
          <div className="change-password-form__field-group">
            <label
              htmlFor="currentPassword"
              className="change-password-form__label"
            >
              Current Password *
            </label>
            <div className="change-password-form__input-wrapper">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={`change-password-form__input ${
                  errors.currentPassword ? "change-password-form__input--error" : ""
                }`}
                placeholder="Enter your current password"
                disabled={isSubmitting}
                autoComplete="current-password"
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
              <span className="change-password-form__error">
                {errors.currentPassword}
              </span>
            )}
          </div>

          <div className="change-password-form__field-group">
            <label
              htmlFor="newPassword"
              className="change-password-form__label"
            >
              New Password *
            </label>
            <div className="change-password-form__input-wrapper">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`change-password-form__input ${
                  errors.newPassword ? "change-password-form__input--error" : ""
                }`}
                placeholder="Enter a new password"
                disabled={isSubmitting}
                autoComplete="new-password"
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
              <span className="change-password-form__error">
                {errors.newPassword}
              </span>
            )}
            {formData.newPassword && (
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
                <ul className="change-password-form__requirements">
                  <li
                    className={
                      formData.newPassword.length >= 8
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    At least 8 characters
                  </li>
                  <li
                    className={
                      /[a-z]/.test(formData.newPassword)
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    One lowercase letter
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(formData.newPassword)
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    One uppercase letter
                  </li>
                  <li
                    className={
                      /\d/.test(formData.newPassword)
                        ? "change-password-form__requirement--met"
                        : ""
                    }
                  >
                    One number
                  </li>
                  <li
                    className={
                      /[^a-zA-Z0-9]/.test(formData.newPassword)
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
              Confirm New Password *
            </label>
            <div className="change-password-form__input-wrapper">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`change-password-form__input ${
                  errors.confirmPassword ? "change-password-form__input--error" : ""
                }`}
                placeholder="Confirm your new password"
                disabled={isSubmitting}
                autoComplete="new-password"
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
              <span className="change-password-form__error">
                {errors.confirmPassword}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Changing Password..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
