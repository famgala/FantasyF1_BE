import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./EditProfileForm.scss";

// Validation schema using yup
const editProfileSchema = yup.object().shape({
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must not exceed 30 characters")
    .matches(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores"
    ),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address"),
  firstName: yup
    .string()
    .required("First name is required")
    .min(1, "First name is required")
    .max(50, "First name must not exceed 50 characters"),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(1, "Last name is required")
    .max(50, "Last name must not exceed 50 characters"),
  country: yup.string().optional(),
  favoriteDriver: yup.string().optional(),
  favoriteTeam: yup.string().optional(),
  bio: yup
    .string()
    .optional()
    .max(500, "Bio must not exceed 500 characters"),
});

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<ProfileData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm<ProfileData>({
    resolver: yupResolver(editProfileSchema),
    mode: "onBlur",
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      country: "",
      favoriteDriver: "",
      favoriteTeam: "",
      bio: "",
    },
  });

  const bio = watch("bio", "");

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
      // const userData = response.data;

      // Mock data for now
      const userData: ProfileData = {
        username: "f1fan2024",
        email: "fan@example.com",
        firstName: "John",
        lastName: "Doe",
        country: "US",
        favoriteDriver: "Max Verstappen",
        favoriteTeam: "Red Bull Racing",
        bio: "Passionate F1 fan and fantasy player",
      };

      setInitialData(userData);
      reset(userData);
    } catch (error) {
      console.error("Failed to load profile data:", error);
    }
  };

  /**
   * Handles form submission
   */
  const onSubmit = async (data: ProfileData) => {
    setIsSubmitting(true);

    try {
      // In production, this would call the actual API
      // await api.put("/auth/profile", data);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update auth context with new user data if available
      // (This would be handled by the service/context layer)

      if (onSuccess) {
        onSuccess(data);
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
    { code: "QA", name: "Qatar" },
    { code: "MC", name: "Monaco" },
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

      <form className="edit-profile-form__form" onSubmit={handleSubmit(onSubmit)}>
        {/* Required Information Section */}
        <div className="edit-profile-form__section">
          <h3 className="edit-profile-form__section-title">Account Information</h3>

          <div className="edit-profile-form__field-group">
            <label htmlFor="username" className="edit-profile-form__label">
              Username *
            </label>
            <input
              type="text"
              id="username"
              className={`edit-profile-form__input ${
                errors.username ? "edit-profile-form__input--error" : ""
              }`}
              placeholder="Choose a username"
              maxLength={30}
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.username}
              aria-describedby={
                errors.username ? "username-error username-hint" : "username-hint"
              }
              {...register("username")}
            />
            {errors.username && (
              <span id="username-error" className="edit-profile-form__error" role="alert">
                {errors.username.message}
              </span>
            )}
            <span id="username-hint" className="edit-profile-form__hint">
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
              className={`edit-profile-form__input ${
                errors.email ? "edit-profile-form__input--error" : ""
              }`}
              placeholder="your@email.com"
              disabled={isSubmitting}
              aria-required="true"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
            {errors.email && (
              <span id="email-error" className="edit-profile-form__error" role="alert">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="edit-profile-form__row">
            <div className="edit-profile-form__field-group">
              <label htmlFor="firstName" className="edit-profile-form__label">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                className={`edit-profile-form__input ${
                  errors.firstName ? "edit-profile-form__input--error" : ""
                }`}
                placeholder="John"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "firstName-error" : undefined}
                {...register("firstName")}
              />
              {errors.firstName && (
                <span id="firstName-error" className="edit-profile-form__error" role="alert">
                  {errors.firstName.message}
                </span>
              )}
            </div>

            <div className="edit-profile-form__field-group">
              <label htmlFor="lastName" className="edit-profile-form__label">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                className={`edit-profile-form__input ${
                  errors.lastName ? "edit-profile-form__input--error" : ""
                }`}
                placeholder="Doe"
                disabled={isSubmitting}
                aria-required="true"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "lastName-error" : undefined}
                {...register("lastName")}
              />
              {errors.lastName && (
                <span id="lastName-error" className="edit-profile-form__error" role="alert">
                  {errors.lastName.message}
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
              className="edit-profile-form__select"
              disabled={isSubmitting}
              {...register("country")}
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
            <label htmlFor="favoriteDriver" className="edit-profile-form__label">
              Favorite Driver
            </label>
            <select
              id="favoriteDriver"
              className="edit-profile-form__select"
              disabled={isSubmitting}
              {...register("favoriteDriver")}
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
            <label htmlFor="favoriteTeam" className="edit-profile-form__label">
              Favorite Team
            </label>
            <select
              id="favoriteTeam"
              className="edit-profile-form__select"
              disabled={isSubmitting}
              {...register("favoriteTeam")}
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
              className="edit-profile-form__textarea"
              placeholder="Tell us about yourself and your F1 journey..."
              rows={4}
              maxLength={500}
              disabled={isSubmitting}
              aria-invalid={!!errors.bio}
              aria-describedby={errors.bio ? "bio-error bio-char-count" : "bio-char-count"}
              {...register("bio")}
            />
            {errors.bio && (
              <span id="bio-error" className="edit-profile-form__error" role="alert">
                {errors.bio.message}
              </span>
            )}
            <span id="bio-char-count" className="edit-profile-form__char-count">
              {bio?.length || 0}/500
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
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfileForm;
