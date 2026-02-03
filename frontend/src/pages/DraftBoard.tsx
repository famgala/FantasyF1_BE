import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDraftPicks } from '../services/draftService';
import type { DraftPick } from '../types';
import { useAuth } from '../context/AuthContext';
import { MobileNav } from '../components/MobileNav';
import { ConnectionStatus, type ConnectionStatusType } from '../components/ConnectionStatus';

export default function DraftBoard() {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [draftPicks, setDraftPicks] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterRound, setFilterRound] = useState<string>('all');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatusType>('connecting');
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Polling configuration
  const POLLING_INTERVAL = 3000; // 3 seconds
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Determine race ID - for now, we'll use a default or get from URL params
  // In a real app, this would come from the league's current/upcoming race
  const raceId = 1; // TODO: Get this from league data or URL params

  // Fetch draft picks data
  const fetchDraftPicks = async (isInitialLoad: boolean = false) => {
    if (!leagueId) return;

    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const picksData = await getDraftPicks(leagueId, raceId);
      setDraftPicks(picksData.draft_picks);
      setError(null);
      setConnectionStatus('connected');
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching draft picks:', err);
      if (!isInitialLoad) {
        setConnectionStatus('error');
      } else {
        setError('Failed to load draft board');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
      setIsRefreshing(false);
    }
  };

  // Manual refresh handler
  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchDraftPicks(false);
  };

  // Initial data fetch and polling setup
  useEffect(() => {
    if (!leagueId) return;

    // Initial fetch
    fetchDraftPicks(true);

    // Set up polling
    pollingIntervalRef.current = setInterval(() => {
      fetchDraftPicks(false);
    }, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [leagueId, raceId]);

  // Get unique teams for filter
  const teams = Array.from(new Set(draftPicks.map((pick) => pick.team_name)));
  
  // Get unique rounds for filter
  const rounds = Array.from(new Set(draftPicks.map((pick) => pick.round))).sort((a, b) => a - b);

  // Filter picks
  const filteredPicks = draftPicks.filter((pick) => {
    const teamMatch = filterTeam === 'all' || pick.team_name === filterTeam;
    const roundMatch = filterRound === 'all' || pick.round === parseInt(filterRound);
    return teamMatch && roundMatch;
  });

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Round', 'Pick Number', 'Team', 'Driver', 'Auto Pick', 'Timestamp'];
    const rows = draftPicks.map((pick) => [
      pick.round,
      pick.pick_number,
      pick.team_name,
      pick.driver_name,
      pick.is_auto_pick ? 'Yes' : 'No',
      new Date(pick.created_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `draft-board-${leagueId}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
    <>
      <MobileNav />
      <div className="page-container">
        <div className="loading">Loading draft board...</div>
      </div>
    </>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (draftPicks.length === 0) {
    return (
      <div className="page-container">
        <div className="draft-board-container">
          <div className="draft-board-header">
            <h1>Draft Board</h1>
            <button onClick={() => navigate(-1)} className="btn btn-secondary">
              Back to League
            </button>
          </div>
          <div className="empty-state">
            <p>No draft picks have been made yet.</p>
            <button
              onClick={() => navigate(`/leagues/${leagueId}/draft-status`)}
              className="btn btn-primary"
            >
              Go to Draft Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MobileNav />
      <div className="page-container">
        <div className="draft-board-container">
          {/* Header */}
          <div className="draft-board-header">
            <h1>Draft Board</h1>
            <div className="header-actions">
              <ConnectionStatus
                status={connectionStatus}
                lastUpdated={lastUpdated}
                onManualRefresh={handleManualRefresh}
                isRefreshing={isRefreshing}
              />
              <button onClick={exportToCSV} className="btn btn-secondary">
                Export CSV
              </button>
              <button onClick={() => navigate(-1)} className="btn btn-secondary">
                Back to League
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="draft-board-filters">
            <div className="filter-group">
              <label htmlFor="team-filter">Filter by Team:</label>
              <select
                id="team-filter"
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="round-filter">Filter by Round:</label>
              <select
                id="round-filter"
                value={filterRound}
                onChange={(e) => setFilterRound(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Rounds</option>
                {rounds.map((round) => (
                  <option key={round} value={round}>
                    Round {round}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="draft-board-legend">
            <div className="legend-item">
              <div className="legend-color your-pick-color"></div>
              <span>Your Picks</span>
            </div>
            <div className="legend-item">
              <div className="legend-color auto-pick-color"></div>
              <span>Auto Picks</span>
            </div>
          </div>

          {/* Draft Board Table */}
          <div className="draft-board-table-container">
            <table className="draft-board-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Pick #</th>
                  <th>Team</th>
                  <th>Driver</th>
                  <th>Auto Pick</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredPicks.map((pick) => {
                  const isYourPick = pick.team_name === user?.username; // Assuming team_name is username
                  return (
                    <tr
                      key={pick.id}
                      className={`draft-board-row ${isYourPick ? 'your-pick-row' : ''} ${
                        pick.is_auto_pick ? 'auto-pick-row' : ''
                      }`}
                    >
                      <td className="round-cell">{pick.round}</td>
                      <td className="pick-number-cell">#{pick.pick_number}</td>
                      <td className="team-cell">{pick.team_name}</td>
                      <td className="driver-cell">{pick.driver_name}</td>
                      <td className="auto-pick-cell">
                        {pick.is_auto_pick ? (
                          <span className="auto-pick-badge">Auto</span>
                        ) : (
                          <span className="manual-pick-badge">Manual</span>
                        )}
                      </td>
                      <td className="timestamp-cell">
                        {new Date(pick.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Stats */}
          <div className="draft-board-stats">
            <div className="stat-item">
              <label>Total Picks</label>
              <span>{draftPicks.length}</span>
            </div>
            <div className="stat-item">
              <label>Total Rounds</label>
              <span>{rounds.length}</span>
            </div>
            <div className="stat-item">
              <label>Your Picks</label>
              <span>
                {draftPicks.filter((pick) => pick.team_name === user?.username).length}
              </span>
            </div>
            <div className="stat-item">
              <label>Auto Picks</label>
              <span>{draftPicks.filter((pick) => pick.is_auto_pick).length}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}