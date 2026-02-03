import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import type { LeaderboardResponse, Race } from '../types';
import { getLeaderboard } from '../services/leaderboardService';
import { getRaces } from '../services/raceService';
import { useAuth } from '../context/AuthContext';
import { MobileNav } from '../components/MobileNav';

export default function LeagueLeaderboard() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scrollingToUser, setScrollingToUser] = useState(false);
  const userRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');

        // Fetch races for the dropdown
        const racesData = await getRaces();
        setRaces(racesData.races);

        // Fetch leaderboard
        const leaderboardData = await getLeaderboard(id, selectedRaceId ?? undefined);
        setLeaderboard(leaderboardData);
      } catch (err: unknown) {
        console.error('Error fetching leaderboard data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load leaderboard';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, selectedRaceId]);

  // Scroll to user's position when requested
  useEffect(() => {
    if (scrollingToUser && userRowRef.current) {
      userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setScrollingToUser(false);
    }
  }, [scrollingToUser]);

  const handleRaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raceId = e.target.value === 'overall' ? null : parseInt(e.target.value);
    setSelectedRaceId(raceId);
  };

  const handleScrollToUser = () => {
    setScrollingToUser(true);
  };

  // Find current user's entry
  const currentUserEntry = leaderboard?.entries.find(
    (entry) => entry.user_id === parseInt(user?.id || '0')
  );

  // Get podium entries (top 3)
  const podiumEntries = leaderboard?.entries.slice(0, 3) || [];
  const firstPlace = podiumEntries[0];
  const secondPlace = podiumEntries[1];
  const thirdPlace = podiumEntries[2];

  // Get remaining entries for the table
  const tableEntries = leaderboard?.entries.slice(3) || [];

  if (loading) {
    return (
      <>
        <MobileNav />
        <div className="league-leaderboard">
          <div className="loading-spinner">Loading leaderboard...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="league-leaderboard">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!leaderboard) {
    return (
      <div className="league-leaderboard">
        <div className="alert alert-error">Leaderboard not found</div>
      </div>
    );
  }

  return (
    <div className="league-leaderboard">
      <div className="leaderboard-header">
        <div className="header-content">
          <h1>{leaderboard.league_name} Leaderboard</h1>
          <div className="header-actions">
            <Link to={`/leagues/${id}`} className="btn btn-secondary">
              Back to League
            </Link>
            {currentUserEntry && (
              <button className="btn btn-primary" onClick={handleScrollToUser}>
                Scroll to My Position
              </button>
            )}
          </div>
        </div>

        {/* Race Filter */}
        <div className="race-filter">
          <label htmlFor="race-select">Filter by Race:</label>
          <select
            id="race-select"
            value={selectedRaceId || 'overall'}
            onChange={handleRaceChange}
            className="form-control"
          >
            <option value="overall">Overall Standings</option>
            {races.map((race) => (
              <option key={race.id} value={race.id}>
                {race.name} (Round {race.round_number})
              </option>
            ))}
          </select>
        </div>

        {/* Current Race Info */}
        {leaderboard.race_name && (
          <div className="race-info">
            <span className="race-label">Showing results for:</span>
            <span className="race-name">{leaderboard.race_name}</span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {leaderboard.entries.length === 0 ? (
        <div className="empty-state">
          <p>No teams in this league yet.</p>
          <Link to={`/leagues/${id}`} className="btn btn-primary">
            Join League
          </Link>
        </div>
      ) : (
        <>
          {/* Podium Display */}
          {podiumEntries.length > 0 && (
            <div className="podium-display">
              {/* Second Place */}
              {secondPlace && (
                <div className="podium-place podium-second">
                  <div className="podium-rank">2nd</div>
                  <div className="podium-team">
                    <div className="podium-team-name">{secondPlace.team_name}</div>
                    <div className="podium-username">{secondPlace.username}</div>
                  </div>
                  <div className="podium-points">{secondPlace.total_points} pts</div>
                  <div className="podium-stats">
                    <span className="stat">🏆 {secondPlace.wins}</span>
                    <span className="stat">🥉 {secondPlace.podiums}</span>
                  </div>
                </div>
              )}

              {/* First Place */}
              {firstPlace && (
                <div className="podium-place podium-first">
                  <div className="podium-rank">🥇 1st</div>
                  <div className="podium-team">
                    <div className="podium-team-name">{firstPlace.team_name}</div>
                    <div className="podium-username">{firstPlace.username}</div>
                  </div>
                  <div className="podium-points">{firstPlace.total_points} pts</div>
                  <div className="podium-stats">
                    <span className="stat">🏆 {firstPlace.wins}</span>
                    <span className="stat">🥉 {firstPlace.podiums}</span>
                  </div>
                </div>
              )}

              {/* Third Place */}
              {thirdPlace && (
                <div className="podium-place podium-third">
                  <div className="podium-rank">3rd</div>
                  <div className="podium-team">
                    <div className="podium-team-name">{thirdPlace.team_name}</div>
                    <div className="podium-username">{thirdPlace.username}</div>
                  </div>
                  <div className="podium-points">{thirdPlace.total_points} pts</div>
                  <div className="podium-stats">
                    <span className="stat">🏆 {thirdPlace.wins}</span>
                    <span className="stat">🥉 {thirdPlace.podiums}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Table */}
          {tableEntries.length > 0 && (
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th className="rank-col">Rank</th>
                    <th className="team-col">Team</th>
                    <th className="owner-col">Owner</th>
                    <th className="points-col">Points</th>
                    <th className="wins-col">Wins</th>
                    <th className="podiums-col">Podiums</th>
                  </tr>
                </thead>
                <tbody>
                  {tableEntries.map((entry) => {
                    const isCurrentUser = entry.user_id === parseInt(user?.id || '0');
                    return (
                      <tr
                        key={entry.team_id}
                        ref={isCurrentUser ? userRowRef : null}
                        className={`leaderboard-row ${isCurrentUser ? 'current-user' : ''}`}
                      >
                        <td className="rank-col">
                          <span className="rank-badge">
                            {entry.rank}
                            {entry.is_tied && <span className="tie-indicator">=</span>}
                          </span>
                        </td>
                        <td className="team-col">
                          <div className="team-name">{entry.team_name}</div>
                          {isCurrentUser && <span className="you-badge">You</span>}
                        </td>
                        <td className="owner-col">{entry.username}</td>
                        <td className="points-col">
                          <span className="points-value">{entry.total_points}</span>
                        </td>
                        <td className="wins-col">
                          <span className="stat-value">{entry.wins}</span>
                        </td>
                        <td className="podiums-col">
                          <span className="stat-value">{entry.podiums}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* User Position Summary */}
          {currentUserEntry && (
            <div className="user-position-summary">
              <div className="summary-content">
                <span className="summary-label">Your Position:</span>
                <span className="summary-rank">
                  {currentUserEntry.rank}
                  {currentUserEntry.is_tied && '='}
                </span>
                <span className="summary-points">{currentUserEntry.total_points} pts</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
