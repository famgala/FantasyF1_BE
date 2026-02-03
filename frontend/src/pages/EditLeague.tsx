import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { League, LeagueMember, UpdateLeagueRequest } from '../types';
import { getLeagueById, getLeagueMembers, updateLeague } from '../services/leagueService';
import { useAuth } from '../context/AuthContext';
import { MobileNav } from '../components/MobileNav';

interface FormErrors {
  name?: string;
  description?: string;
  max_teams?: string;
  privacy?: string;
  draft_method?: string;
  draft_close_condition?: string;
  scoring_settings?: string;
}

interface FormData {
  name: string;
  description: string;
  max_teams: number;
  privacy: 'public' | 'private';
  draft_method: 'random' | 'sequential' | 'snake';
  draft_close_condition: 'race_start' | 'manual' | 'time_limit';
  scoring_settings: string;
}

export default function EditLeague() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [league, setLeague] = useState<League | null>(null);
  const [members, setMembers] = useState<LeagueMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isDraftActive, setIsDraftActive] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    max_teams: 10,
    privacy: 'public',
    draft_method: 'random',
    draft_close_condition: 'race_start',
    scoring_settings: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Determine user's role
  const currentMember = members.find((m) => m.user_id === user?.id);
  const userRole = currentMember?.role;
  const isCreator = userRole === 'creator';
  const isCoManager = userRole === 'co_manager';
  const canEdit = isCreator || isCoManager;

  // Fetch league data
  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');

        const [leagueData, membersData] = await Promise.all([
          getLeagueById(id),
          getLeagueMembers(id),
        ]);

        setLeague(leagueData);
        setMembers(membersData);

        // Pre-populate form data
        setFormData({
          name: leagueData.name,
          description: leagueData.description || '',
          max_teams: leagueData.max_teams,
          privacy: leagueData.privacy,
          draft_method: leagueData.draft_method,
          draft_close_condition: leagueData.draft_close_condition as 'race_start' | 'manual' | 'time_limit',
          scoring_settings: leagueData.scoring_settings 
            ? JSON.stringify(leagueData.scoring_settings, null, 2) 
            : '',
        });

        // Check if draft has started (this would come from draft status endpoint)
        // For now, we'll assume draft hasn't started unless proven otherwise
        setIsDraftActive(false);
      } catch (err: any) {
        console.error('Error fetching league data:', err);
        setError(err.response?.data?.detail || 'Failed to load league details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [id]);

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
        // Check against current team count
        const currentTeamCount = members.length;
        if (value < currentTeamCount) {
          return `Maximum teams cannot be less than current team count (${currentTeamCount})`;
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
        if (!value) {
          return 'Draft close condition is required';
        }
        break;
      case 'scoring_settings':
        if (value && value.trim()) {
          try {
            JSON.parse(value);
          } catch {
            return 'Scoring settings must be valid JSON';
          }
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

    const fieldsToValidate = ['name', 'description', 'max_teams', 'privacy', 'draft_method', 'draft_close_condition'];
    
    fieldsToValidate.forEach((key) => {
      const error = validateField(key, formData[key as keyof FormData]);
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

    if (!id) return;

    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMessage('');

    try {
      // Build update request
      const updateData: UpdateLeagueRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        max_teams: formData.max_teams,
        is_private: formData.privacy === 'private',
        draft_method: formData.draft_method,
        draft_close_condition: formData.draft_close_condition,
      };

      // Add scoring settings if provided
      if (formData.scoring_settings.trim()) {
        try {
          updateData.scoring_settings = JSON.parse(formData.scoring_settings);
        } catch {
          setError('Invalid JSON in scoring settings');
          setIsSubmitting(false);
          return;
        }
      }

      const updatedLeague = await updateLeague(id, updateData);
      setSuccessMessage(`League "${updatedLeague.name}" updated successfully!`);
      
      // Redirect to league detail page after 1.5 seconds
      setTimeout(() => {
        navigate(`/leagues/${id}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error updating league:', err);
      setError(err.response?.data?.detail || 'Failed to update league. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if user doesn't have permission to edit
  useEffect(() => {
    if (!loading && !canEdit) {
      navigate(`/leagues/${id}`);
    }
  }, [loading, canEdit, id, navigate]);

  if (loading) {
    return (
      <>
        <MobileNav />
        <div className="edit-league">
          <div className="loading-spinner">Loading league details...</div>
        </div>
      </>
    );
  }

  if (error && !league) {
    return (
      <div className="edit-league">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="edit-league">
        <div className="alert alert-error">League not found</div>
      </div>
    );
  }

  return (
    <div className="edit-league">
      <div className="page-header">
        <h1>Edit League</h1>
        <p className="league-subtitle">{league.name}</p>
      </div>

      {successMessage && (
        <div className="alert alert-success">{successMessage}</div>
      )}

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {isDraftActive && (
        <div className="alert alert-warning">
          <strong>Note:</strong> Some settings cannot be changed once the draft has started.
        </div>
      )}

      <form onSubmit={handleSubmit} className="edit-league-form">
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
          {errors.name && <div className="invalid-feedback">{errors.name}</div>}
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
          {errors.description && <div className="invalid-feedback">{errors.description}</div>}
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
            min={members.length || 2}
            max={50}
            disabled={isSubmitting}
          />
          {errors.max_teams && <div className="invalid-feedback">{errors.max_teams}</div>}
          <small className="form-text">
            Current teams: {members.length}. Cannot be set lower than current team count.
          </small>
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
            disabled={isSubmitting || isDraftActive}
          >
            <option value="public">Public - Anyone can find and join</option>
            <option value="private">Private - Only invited users can join</option>
          </select>
          {errors.privacy && <div className="invalid-feedback">{errors.privacy}</div>}
          {isDraftActive && (
            <small className="form-text text-muted">Privacy cannot be changed after draft starts</small>
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
            disabled={isSubmitting || isDraftActive}
          >
            <option value="random">Random - Teams pick in random order</option>
            <option value="sequential">Sequential - Teams pick in fixed order</option>
            <option value="snake">Snake - Draft order reverses each round</option>
          </select>
          {errors.draft_method && <div className="invalid-feedback">{errors.draft_method}</div>}
          {isDraftActive && (
            <small className="form-text text-muted">Draft method cannot be changed after draft starts</small>
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
          {errors.draft_close_condition && <div className="invalid-feedback">{errors.draft_close_condition}</div>}
        </div>

        {/* Scoring Settings */}
        <div className="form-group">
          <label htmlFor="scoring_settings">Scoring Settings (JSON)</label>
          <textarea
            id="scoring_settings"
            name="scoring_settings"
            value={formData.scoring_settings}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`form-control ${errors.scoring_settings ? 'is-invalid' : ''}`}
            placeholder='{"points_per_position": {"1": 25, "2": 18, ...}}'
            rows={5}
            disabled={isSubmitting}
          />
          {errors.scoring_settings && <div className="invalid-feedback">{errors.scoring_settings}</div>}
          <small className="form-text">Optional custom scoring rules in JSON format</small>
        </div>

        {/* Submit Buttons */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(`/leagues/${id}`)}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
