import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeamDetail, getTeamPicks, addTeamPick, getAvailableDrivers } from '../services/teamService';
import type { TeamDetail, Driver, AddPickRequest } from '../types';

interface AddPicksProps {}

const AddPicks: React.FC<AddPicksProps> = () => {
  const { teamId, raceId } = useParams<{ teamId: string; raceId: string }>();
  const navigate = useNavigate();

  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverIds, setSelectedDriverIds] = useState<Set<string>>(new Set());
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Pick limits (default values - could be fetched from league settings)
  const MAX_DRIVERS = 5;
  const MAX_PER_TEAM = 2;

  useEffect(() => {
    const fetchData = async () => {
      if (!teamId || !raceId) {
        setError('Invalid team or race ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        // Fetch team detail, existing picks, and available drivers in parallel
        const [teamData, picksData, driversData] = await Promise.all([
          getTeamDetail(teamId),
          getTeamPicks(teamId),
          getAvailableDrivers(),
        ]);

        setTeam(teamData);
        setDrivers(driversData);

        // Check if picks already exist for this race
        const racePicks = picksData.filter(pick => pick.race_id === raceId);
        if (racePicks.length > 0) {
          setError('You have already made picks for this race. View your team details to see your picks.');
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [teamId, raceId]);

  // Get unique teams for filter dropdown
  const uniqueTeams = useMemo(() => {
    const teams = new Set(drivers.map(d => d.team));
    return Array.from(teams).sort();
  }, [drivers]);

  // Filter drivers based on team filter and search query
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
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
  }, [drivers, teamFilter, searchQuery]);

  // Calculate total cost of selected drivers
  const selectedDriversCost = useMemo(() => {
    return Array.from(selectedDriverIds).reduce((total, driverId) => {
      const driver = drivers.find(d => d.id === driverId);
      return total + (driver?.price || 0);
    }, 0);
  }, [selectedDriverIds, drivers]);

  // Check if selection is valid
  const selectionErrors = useMemo(() => {
    const errors: string[] = [];

    if (selectedDriverIds.size === 0) {
      errors.push('Please select at least one driver');
    }

    if (selectedDriverIds.size > MAX_DRIVERS) {
      errors.push(`You can only select up to ${MAX_DRIVERS} drivers`);
    }

    // Check max per team
    const teamCounts: Record<string, number> = {};
    selectedDriverIds.forEach(driverId => {
      const driver = drivers.find(d => d.id === driverId);
      if (driver) {
        teamCounts[driver.team] = (teamCounts[driver.team] || 0) + 1;
      }
    });

    Object.entries(teamCounts).forEach(([team, count]) => {
      if (count > MAX_PER_TEAM) {
        errors.push(`You can only select up to ${MAX_PER_TEAM} drivers from ${team}`);
      }
    });

    // Check budget
    if (team && selectedDriversCost > team.budget_remaining) {
      errors.push(`Selected drivers cost $${selectedDriversCost}M, but you only have $${team.budget_remaining}M remaining`);
    }

    return errors;
  }, [selectedDriverIds, drivers, team, selectedDriversCost]);

  const isValidSelection = selectionErrors.length === 0;

  // Toggle driver selection
  const toggleDriverSelection = (driverId: string) => {
    setSelectedDriverIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(driverId)) {
        newSet.delete(driverId);
      } else {
        if (newSet.size < MAX_DRIVERS) {
          newSet.add(driverId);
        }
      }
      return newSet;
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamId || !raceId || !isValidSelection) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const request: AddPickRequest = {
        race_id: raceId,
        driver_ids: Array.from(selectedDriverIds),
      };

      await addTeamPick(teamId, request);

      setSuccess('Picks added successfully! Redirecting to team details...');

      // Redirect to team detail after 2 seconds
      setTimeout(() => {
        navigate(`/teams/${teamId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add picks. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Get count of selected drivers per team
  const getTeamCount = (teamName: string): number => {
    return Array.from(selectedDriverIds).filter(driverId => {
      const driver = drivers.find(d => d.id === driverId);
      return driver?.team === teamName;
    }).length;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading drivers...</p>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="page-container">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => navigate(`/teams/${teamId}`)} className="btn btn-secondary">
            Back to Team
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Add Picks for Race</h1>
        <p className="page-subtitle">
          {team?.name} • {team?.league_name}
        </p>
      </div>

      {success && (
        <div className="success-banner">
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}

      {team && (
        <>
          {/* Budget Display */}
          <div className="budget-display">
            <div className="budget-info">
              <div className="budget-item">
                <span className="budget-label">Total Budget:</span>
                <span className="budget-value">${team.budget}M</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Remaining:</span>
                <span className="budget-value budget-remaining">${team.budget_remaining}M</span>
              </div>
              <div className="budget-item">
                <span className="budget-label">Selected Cost:</span>
                <span className={`budget-value ${selectedDriversCost > team.budget_remaining ? 'budget-exceeded' : ''}`}>
                  ${selectedDriversCost}M
                </span>
              </div>
            </div>
            <div className="budget-bar">
              <div
                className="budget-bar-fill"
                style={{
                  width: `${((team.budget - team.budget_remaining) / team.budget) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Selection Summary */}
          <div className="selection-summary">
            <div className="summary-item">
              <span className="summary-label">Drivers Selected:</span>
              <span className="summary-value">
                {selectedDriverIds.size} / {MAX_DRIVERS}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Max per Team:</span>
              <span className="summary-value">{MAX_PER_TEAM}</span>
            </div>
          </div>

          {/* Filters */}
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

          {/* Selection Errors */}
          {selectionErrors.length > 0 && (
            <div className="error-list">
              {selectionErrors.map((error, index) => (
                <p key={index} className="error-item">
                  ⚠️ {error}
                </p>
              ))}
            </div>
          )}

          {/* Drivers List */}
          <div className="drivers-grid">
            {filteredDrivers.length === 0 ? (
              <div className="empty-state">
                <p>No drivers found matching your filters.</p>
                <button onClick={() => { setTeamFilter(''); setSearchQuery(''); }} className="btn btn-secondary">
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredDrivers.map((driver) => {
                const isSelected = selectedDriverIds.has(driver.id);
                const teamCount = getTeamCount(driver.team);
                const isMaxPerTeam = teamCount >= MAX_PER_TEAM && !isSelected;

                return (
                  <div
                    key={driver.id}
                    className={`driver-card ${isSelected ? 'selected' : ''} ${isMaxPerTeam ? 'disabled' : ''}`}
                    onClick={() => !isMaxPerTeam && toggleDriverSelection(driver.id)}
                  >
                    <div className="driver-card-header">
                      <div className="driver-checkbox">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleDriverSelection(driver.id)}
                          disabled={isMaxPerTeam}
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

                    {isMaxPerTeam && (
                      <div className="driver-card-warning">
                        Max {MAX_PER_TEAM} from {driver.team}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/teams/${teamId}`)}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={!isValidSelection || submitting || selectedDriverIds.size === 0}
            >
              {submitting ? 'Adding Picks...' : `Confirm ${selectedDriverIds.size} Pick${selectedDriverIds.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AddPicks;