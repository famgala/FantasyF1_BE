import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLeague } from '../services/leagueService';
import type { CreateLeagueRequest } from '../types';
import { Announcer } from './Announcer';

interface FormErrors {
  name?: string;
  description?: string;
  max_teams?: string;
  privacy?: string;
  draft_method?: string;
  draft_close_condition?: string;
}

export default function CreateLeagueForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateLeagueRequest>({
    name: '',
    description: '',
    max_teams: 10,
    privacy: 'public',
    draft_method: 'random',
    draft_close_condition: 'race_start',
    scoring_settings: {},
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [createdLeagueCode, setCreatedLeagueCode] = useState('');
  const [announcement, setAnnouncement] = useState('');

  // Validate form fields
  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length === 0) {
          return 'League name is required';
        }
        if (value.trim().length < 3) {
          return 'League name must be at least 3 characters';
        }
        if (value.trim().length > 100) {
          return 'League name must be less than 100 characters';
        }
        break;
      case 'description':
        if (value && value.length > 500) {
          return 'Description must be less than 500 characters';
        }
        break;
      case 'max_teams':
        if (!value || value < 2) {
          return 'Maximum teams must be at least 2';
        }
        if (value > 50) {
          return 'Maximum teams must be less than 50';
        }
        break;
      case 'privacy':
        if (!value) {
          return 'Privacy setting is required';
        }
        break;
      case 'draft_method':
        if (!value) {
          return 'Draft method is required';
        }
        break;
      case 'draft_close_condition':
        if (!value || value.trim().length === 0) {
          return 'Draft close condition is required';
        }
        break;
      default:
        break;
    }
    return undefined;
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof CreateLeagueRequest]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'max_teams' ? parseInt(value) || 0 : value;

    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Validate field on change if it has been touched
    if (touched[name]) {
      const error = validateField(name, newValue);
      setErrors({
        ...errors,
        [name]: error,
      });
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue = name === 'max_teams' ? parseInt(value) || 0 : value;

    setTouched({
      ...touched,
      [name]: true,
    });

    const error = validateField(name, newValue);
    setErrors({
      ...errors,
      [name]: error,
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      // Announce validation errors to screen readers
      const errorCount = Object.keys(errors).length;
      setAnnouncement(`Form has ${errorCount} error${errorCount > 1 ? 's' : ''}. Please review and correct.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    setAnnouncement('Creating league, please wait...');

    try {
      const createdLeague = await createLeague(formData);
      setCreatedLeagueCode(createdLeague.code);
      setSuccessMessage(`League "${createdLeague.name}" created successfully! Your league code is: ${createdLeague.code}`);
      setAnnouncement(`League "${createdLeague.name}" created successfully! Redirecting to league page...`);

      // Redirect to league detail page after 2 seconds
      setTimeout(() => {
        navigate(`/leagues/${createdLeague.id}`);
      }, 2000);
    } catch (error: any) {
      console.error('Error creating league:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to create league. Please try again.';
      setErrorMessage(errorMsg);
      setAnnouncement(`Error: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-league-form">
      <Announcer message={announcement} ariaLive="assertive" role="alert" />
      <h2>Create New League</h2>

      {successMessage && (
        <div className="alert alert-success" role="alert" aria-live="polite">
          {successMessage}
          {createdLeagueCode && (
            <div className="league-code-display">
              <strong>League Code:</strong> {createdLeagueCode}
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-error" role="alert" aria-live="assertive">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* League Name */}
        <div className="form-group">
          <label htmlFor="name">League Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-control ${errors.name ? 'is-invalid' : ''}`}
            placeholder="Enter league name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <div className="invalid-feedback" role="alert" aria-live="polite">
              {errors.name}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
            placeholder="Enter league description (optional)"
            rows={3}
            disabled={isSubmitting}
          />
          {errors.description && (
            <div className="invalid-feedback" role="alert" aria-live="polite">
              {errors.description}
            </div>
          )}
        </div>

        {/* Max Teams */}
        <div className="form-group">
          <label htmlFor="max_teams">Maximum Teams *</label>
          <input
            type="number"
            id="max_teams"
            name="max_teams"
            value={formData.max_teams}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-control ${errors.max_teams ? 'is-invalid' : ''}`}
            min={2}
            max={50}
            disabled={isSubmitting}
          />
          {errors.max_teams && (
            <div className="invalid-feedback" role="alert" aria-live="polite">
              {errors.max_teams}
            </div>
          )}
          <small className="form-text">Number of teams that can join the league (2-50)</small>
        </div>

        {/* Privacy */}
        <div className="form-group">
          <label htmlFor="privacy">Privacy *</label>
          <select
            id="privacy"
            name="privacy"
            value={formData.privacy}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-control ${errors.privacy ? 'is-invalid' : ''}`}
            disabled={isSubmitting}
          >
            <option value="public">Public - Anyone can find and join</option>
            <option value="private">Private - Only invited users can join</option>
          </select>
          {errors.privacy && (
            <div className="invalid-feedback" role="alert" aria-live="polite">
              {errors.privacy}
            </div>
          )}
        </div>

        {/* Draft Method */}
        <div className="form-group">
          <label htmlFor="draft_method">Draft Method *</label>
          <select
            id="draft_method"
            name="draft_method"
            value={formData.draft_method}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-control ${errors.draft_method ? 'is-invalid' : ''}`}
            disabled={isSubmitting}
          >
            <option value="random">Random - Teams pick in random order</option>
            <option value="sequential">Sequential - Teams pick in fixed order</option>
            <option value="snake">Snake - Draft order reverses each round</option>
          </select>
          {errors.draft_method && (
            <div className="invalid-feedback" role="alert" aria-live="polite">
              {errors.draft_method}
            </div>
          )}
        </div>

        {/* Draft Close Condition */}
        <div className="form-group">
          <label htmlFor="draft_close_condition">Draft Close Condition *</label>
          <select
            id="draft_close_condition"
            name="draft_close_condition"
            value={formData.draft_close_condition}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-control ${errors.draft_close_condition ? 'is-invalid' : ''}`}
            disabled={isSubmitting}
          >
            <option value="race_start">Race Start - Draft closes when race starts</option>
            <option value="manual">Manual - League manager closes draft manually</option>
            <option value="time_limit">Time Limit - Draft closes after set time</option>
          </select>
          {errors.draft_close_condition && (
            <div className="invalid-feedback" role="alert" aria-live="polite">
              {errors.draft_close_condition}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="form-group">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating League...' : 'Create League'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/leagues')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}