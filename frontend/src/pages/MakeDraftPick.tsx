import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDraftStatus, getAvailableDrivers, makeDraftPick } from '../services/draftService';
import type { DraftStatus, AvailableDriver, MakeDraftPickRequest } from '../types';
import { useAuth } from '../context/AuthContext';

export default function MakeDraftPick() {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [draftStatus, setDraftStatus] = useState<DraftStatus | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Determine race ID - for now, we'll use a default or get from URL params
  // In a real app, this would come from the league's current/upcoming race
  const raceId = 1; // TODO: Get this from league data or URL params

  useEffect(() => {
    if (!leagueId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statusData, driversData] = await Promise.all([
          getDraftStatus(leagueId, raceId),
          getAvailableDrivers(leagueId, raceId),
        ]);

        setDraftStatus(statusData);
        setAvailableDrivers(driversData);

        // Check if it's the user's turn
        if (statusData.current_team?.user_id !== user?.id) {
          setError('It is not your turn to make a draft pick.');
        }

        // Check if draft is complete
        if (statusData.is_draft_complete) {
          setError('The draft is already complete.');
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load draft data');
        console.error('Error fetching draft data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leagueId, raceId, user]);

  // Get unique teams for filter dropdown
  const uniqueTeams = useMemo(() => {
    const teams = new Set(availableDrivers.map((d) => d.team));
    return Array.from(teams).sort();
  }, [availableDrivers]);

  // Filter drivers based on team filter and search query
  const filteredDrivers = useMemo(() => {
    return availableDrivers.filter((driver) => {
      // Filter by team
      if (teamFilter && driver.team !== teamFilter) {
        return false;
      }

      // Filter by search query (name, code, or number)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = driver.name.toLowerCase().includes(query);
        const matchesCode = driver.code.toLowerCase().includes(query);
        const matchesNumber = driver.number.toString().includes(query);
        if (!matchesName && !matchesCode && !matchesNumber) {
          return false;
        }
      }

      return true;
    });
  }, [availableDrivers, teamFilter, searchQuery]);

  // Handle driver selection
  const handleDriverSelect = (driverId: string) => {
    setSelectedDriverId(driverId);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!leagueId || !selectedDriverId) {
      setError('Please select a driver');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const request: MakeDraftPickRequest = {
        driver_id: selectedDriverId,
      };

      await makeDraftPick(leagueId, raceId, request);

      setSuccess('Draft pick made successfully! Redirecting to draft status...');

      // Redirect to draft status after 2 seconds
      setTimeout(() => {
        navigate(`/leagues/${leagueId}/draft-status`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to make draft pick. Please try again.');
      console.error('Error making draft pick:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading draft data...</div>
      </div>
    );
  }

  if (error && !draftStatus) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  const isMyTurn = draftStatus?.current_team?.user_id === user?.id;
  const isDraftComplete = draftStatus?.is_draft_complete;

  return (
    <div className="page-container">
      <div className="make-draft-pick-container">
        {/* Header */}
        <div className="page-header">
          <h1>Make Draft Pick</h1>
          <p className="page-subtitle">
            Round {draftStatus?.current_round} / 5 • Pick #{draftStatus?.current_position}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="success-banner">
            <p>{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        {/* Draft Info Card */}
        {draftStatus && (
          <div className="draft-info-card">
            <div className="draft-info-grid">
              <div className="draft-info-item">
                <label>Current Round</label>
                <span className="draft-info-value">{draftStatus.current_round} / 5</span>
              </div>
              <div className="draft-info-item">
                <label>Current Position</label>
                <span className="draft-info-value">
                  {draftStatus.current_position} / {draftStatus.total_teams}
                </span>
              </div>
              <div className="draft-info-item">
                <label>Team on Clock</label>
                <span className="draft-info-value">
                  {draftStatus.current_team?.name || 'Unknown'}
                </span>
              </div>
              <div className="draft-info-item">
                <label>Draft Method</label>
                <span className="draft-info-value capitalize">{draftStatus.draft_method}</span>
              </div>
            </div>
          </div>
        )}

        {/* Your Turn Indicator */}
        {isMyTurn && !isDraftComplete && (
          <div className="your-turn-banner">
            <h2>🏁 It's Your Turn!</h2>
            <p>Select a driver from the available list below to make your pick.</p>
          </div>
        )}

        {/* Filters */}
        {!isDraftComplete && (
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="team-filter">Filter by Team:</label>
              <select
                id="team-filter"
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="form-select"
              >
                <option value="">All Teams</option>
                {uniqueTeams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="search-drivers">Search Drivers:</label>
              <input
                id="search-drivers"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, code, or number..."
                className="form-input"
              />
            </div>
          </div>
        )}

        {/* Drivers List */}
        {!isDraftComplete && (
          <div className="drivers-grid">
            {filteredDrivers.length === 0 ? (
              <div className="empty-state">
                <p>No drivers found matching your filters.</p>
                <button
                  onClick={() => {
                    setTeamFilter('');
                    setSearchQuery('');
                  }}
                  className="btn btn-secondary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredDrivers.map((driver) => {
                const isSelected = selectedDriverId === driver.id;

                return (
                  <div
                    key={driver.id}
                    className={`driver-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleDriverSelect(driver.id)}
                  >
                    <div className="driver-card-header">
                      <div className="driver-radio">
                        <input
                          type="radio"
                          name="driver-selection"
                          checked={isSelected}
                          onChange={() => handleDriverSelect(driver.id)}
                        />
                      </div>
                      <div className="driver-number">#{driver.number}</div>
                      <div className="driver-code">{driver.code}</div>
                    </div>

                    <div className="driver-card-body">
                      <h3 className="driver-name">{driver.name}</h3>
                      <p className="driver-team">{driver.team}</p>
                      <p className="driver-country">{driver.country}</p>
                    </div>

                    <div className="driver-card-stats">
                      <div className="stat-item">
                        <span className="stat-label">Price:</span>
                        <span className="stat-value">${driver.price}M</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Points:</span>
                        <span className="stat-value">{driver.total_points}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Avg:</span>
                        <span className="stat-value">{driver.average_points.toFixed(1)}</span>
                      </div>
                    </div>

                    {driver.is_drafted && (
                      <div className="driver-card-warning">Already Drafted</div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Submit Button */}
        {!isDraftComplete && isMyTurn && (
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/leagues/${leagueId}/draft-status`)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={!selectedDriverId || submitting}
            >
              {submitting ? 'Making Pick...' : 'Confirm Draft Pick'}
            </button>
          </div>
        )}

        {/* Draft Complete Message */}
        {isDraftComplete && (
          <div className="draft-complete-banner">
            <h2>🎉 Draft Complete!</h2>
            <p>All teams have completed their picks.</p>
            <button
              onClick={() => navigate(`/leagues/${leagueId}/draft-status`)}
              className="btn btn-primary"
            >
              View Draft Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}