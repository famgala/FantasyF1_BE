import React, { useState, useEffect } from "react";
import "./EditProfileForm.scss";

/**
 * User Profile Data Interface
 */
interface ProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  country: string;
  favoriteDriver?: string;
  favoriteTeam?: string;
  bio?: string;
}

/**
 * Form Validation Errors Interface
 */
interface FormErrors {
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Edit Profile Form Component Props
 */
interface EditProfileFormProps {
  onSuccess?: (updatedData: ProfileData) => void;
  onCancel?: () => void;
}

/**
 * Edit Profile Form Component
 * 
 * Allows users to update their profile information including:
 * - Personal details (username, email, name)
 * - Location (country)
 * - Preferences (favorite driver, favorite team)
 * - Bio
 */
const EditProfileForm: React.FC<EditProfileFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProfileData>({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    country: "",
    favoriteDriver: "",
    favoriteTeam: "",
    bio: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Load user data on mount
  useEffect(() => {
    loadUserData();
  }, []);

  /**
   * Loads current user data from API
   */
  const loadUserData = async () => {
    try {
      // In production, this would call the actual API
      // const response = await api.get("/auth/profile");
      // setFormData(response.data);

      // Mock data for now
      setFormData({
        username: "f1fan2024",
        email: "fan@example.com",
        firstName: "John",
        lastName: "Doe",
        country: "US",
        favoriteDriver: "Max Verstappen",
        favoriteTeam: "Red Bull Racing",
        bio: "Passionate F1 fan and fantasy player",
      });
    } catch (error) {
      console.error("Failed to load profile data:", error);
    }
  };

  /**
   * Handles input field changes
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    // Clear error for this field when user starts typing
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  /**
   * Validates the form data
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 30) {
      newErrors.username = "Username must not exceed 30 characters";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
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
      // await api.put("/auth/profile", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update auth context with new user data if available
      // (This would be handled by the service/context layer)

      if (onSuccess) {
        onSuccess(formData);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Handle error display
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
   * List of country options
   */
  const countries = [
    { code: "US", name: "United States" },
    { code: "UK", name: "United Kingdom" },
    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "DE", name: "Germany" },
    { code: "FR", name: "France" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "NL", name: "Netherlands" },
    { code: "BE", name: "Belgium" },
    { code: "AT", name: "Austria" },
    { code: "CH", name: "Switzerland" },
    { code: "MX", name: "Mexico" },
    { code: "BR", name: "Brazil" },
    { code: "AR", name: "Argentina" },
    { code: "JP", name: "Japan" },
    { code: "SG", name: "Singapore" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "Q", name: "Qatar" },
    { code: "MO", name: "Monaco" },
    { code: "HU", name: "Hungary" },
    { code: "FI", name: "Finland" },
    { code: "DK", name: "Denmark" },
    { code: "NO", name: "Norway" },
    { code: "SE", name: "Sweden" },
    { code: "IE", name: "Ireland" },
    { code: "PT", name: "Portugal" },
    { code: "GR", name: "Greece" },
    { code: "CZ", name: "Czech Republic" },
    { code: "PL", name: "Poland" },
    { code: "NL", name: "Netherlands" },
    { code: "RU", name: "Russia" },
    { code: "CN", name: "China" },
    { code: "KR", name: "South Korea" },
    { code: "IN", name: "India" },
    { code: "ZA", name: "South Africa" },
    { code: "NZ", name: "New Zealand" },
    { code: "CO", name: "Colombia" },
    { code: "CL", name: "Chile" },
    { code: "PE", name: "Peru" },
    { code: "VE", name: "Venezuela" },
    { code: "CR", name: "Costa Rica" },
    { code: "PA", name: "Panama" },
  ];

  /**
   * List of F1 drivers (mock data)
   */
  const drivers = [
    "Max Verstappen",
    "Lewis Hamilton",
    "Charles Leclerc",
    "Fernando Alonso",
    "Lando Norris",
    "Carlos Sainz",
    "Sergio Perez",
    "George Russell",
    "Esteban Ocon",
    "Nico Rosberg",
    "Pierre Gasly",
    "Alex Albon",
    "Valtteri Bottas",
    "Lance Stroll",
    "Kevin Magnussen",
    "Yuki Tsunoda",
    "Zhou Guanyu",
    "Oscar Piastri",
    "Logan Sargeant",
    "Nyck de Vries",
  ];

  /**
   * List of F1 teams (mock data)
   */
  const teams = [
    "Red Bull Racing",
    "Mercedes-AMG Petronas",
    "Scuderia Ferrari",
    "McLaren F1 Team",
    "Aston Martin Aramco",
    "Alpine F1 Team",
    "AlphaTauri",
    "Williams Racing",
    "Alfa Romeo Racing",
    "Haas F1 Team",
  ];

  return (
    <div className="edit-profile-form">
      <div className="edit-profile-form__header">
        <h2 className="edit-profile-form__title">Edit Profile</h2>
        <p className="edit-profile-form__subtitle">
          Update your personal information and preferences
        </p>
      </div>

      <form className="edit-profile-form__form" onSubmit={handleSubmit}>
        {/* Required Information Section */}
        <div className="edit-profile-form__section">
          <h3 className="edit-profile-form__section-title">Account Information</h3>

          <div className="edit-profile-form__field-group">
            <label
              htmlFor="username"
              className="edit-profile-form__label"
            >
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`edit-profile-form__input ${
                errors.username ? "edit-profile-form__input--error" : ""
              }`}
              placeholder="Choose a username"
              maxLength={30}
              disabled={isSubmitting}
            />
            {errors.username && (
              <span className="edit-profile-form__error">
                {errors.username}
              </span>
            )}
            <span className="edit-profile-form__hint">
              3-30 characters, letters, numbers, and underscores only
            </span>
          </div>

          <div className="edit-profile-form__field-group">
            <label htmlFor="email" className="edit-profile-form__label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`edit-profile-form__input ${
                errors.email ? "edit-profile-form__input--error" : ""
              }`}
              placeholder="your@email.com"
              disabled={isSubmitting}
            />
            {errors.email && (
              <span className="edit-profile-form__error">{errors.email}</span>
            )}
          </div>

          <div className="edit-profile-form__row">
            <div className="edit-profile-form__field-group">
              <label
                htmlFor="firstName"
                className="edit-profile-form__label"
              >
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`edit-profile-form__input ${
                  errors.firstName ? "edit-profile-form__input--error" : ""
                }`}
                placeholder="John"
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <span className="edit-profile-form__error">
                  {errors.firstName}
                </span>
              )}
            </div>

            <div className="edit-profile-form__field-group">
              <label
                htmlFor="lastName"
                className="edit-profile-form__label"
              >
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`edit-profile-form__input ${
                  errors.lastName ? "edit-profile-form__input--error" : ""
                }`}
                placeholder="Doe"
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <span className="edit-profile-form__error">
                  {errors.lastName}
                </span>
              )}
            </div>
          </div>

          <div className="edit-profile-form__field-group">
            <label htmlFor="country" className="edit-profile-form__label">
              Country
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="edit-profile-form__select"
              disabled={isSubmitting}
            >
              <option value="">Select your country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="edit-profile-form__section">
          <h3 className="edit-profile-form__section-title">F1 Preferences</h3>

          <div className="edit-profile-form__field-group">
            <label
              htmlFor="favoriteDriver"
              className="edit-profile-form__label"
            >
              Favorite Driver
            </label>
            <select
              id="favoriteDriver"
              name="favoriteDriver"
              value={formData.favoriteDriver}
              onChange={handleChange}
              className="edit-profile-form__select"
              disabled={isSubmitting}
            >
              <option value="">Select your favorite driver</option>
              {drivers.map((driver) => (
                <option key={driver} value={driver}>
                  {driver}
                </option>
              ))}
            </select>
          </div>

          <div className="edit-profile-form__field-group">
            <label
              htmlFor="favoriteTeam"
              className="edit-profile-form__label"
            >
              Favorite Team
            </label>
            <select
              id="favoriteTeam"
              name="favoriteTeam"
              value={formData.favoriteTeam}
              onChange={handleChange}
              className="edit-profile-form__select"
              disabled={isSubmitting}
            >
              <option value="">Select your favorite team</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bio Section */}
        <div className="edit-profile-form__section">
          <h3 className="edit-profile-form__section-title">About You</h3>

          <div className="edit-profile-form__field-group">
            <label htmlFor="bio" className="edit-profile-form__label">
              Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              className="edit-profile-form__textarea"
              placeholder="Tell us about yourself and your F1 journey..."
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
            />
            <span className="edit-profile-form__char-count">
              {formData.bio?.length || 0}/500
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="edit-profile-form__actions">
          <button
            type="button"
            onClick={handleCancel}
            className="edit-profile-form__button edit-profile-form__button--secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="edit-profile-form__button edit-profile-form__button--primary"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;
