import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { MyTeam } from '../types';
import { getMyTeams } from '../services/teamService';
import { MobileNav } from '../components/MobileNav';

type SortOption = 'alphabetical' | 'points' | 'league';

export default function MyTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');

  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getMyTeams(sortBy);
        setTeams(data);
      } catch (err: any) {
        console.error('Error fetching my teams:', err);
        setError(err.response?.data?.detail || 'Failed to load your teams');
      } finally {
        setLoading(false);
      }
    };

    fetchMyTeams();
  }, [sortBy]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  };

  const handleJoinLeague = () => {
    navigate('/leagues/join');
  };

  const getPointsColor = (points: number) => {
    if (points >= 100) return 'high';
    if (points >= 50) return 'medium';
    return 'low';
  };

  if (loading) {
    return (
    <>
      <MobileNav />
      <div className="my-teams">
        <div className="loading-spinner">Loading your teams...</div>
      </div>
    );
  }

  return (
    <div className="my-teams">
      {/* Header */}
      <div className="page-header">
        <h1>My Teams</h1>
      </div>

      {/* Error Message */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Empty State */}
      {!loading && teams.length === 0 && !error && (
        <div className="empty-state-container">
          <div className="empty-state-icon">🏎️</div>
          <h2>No Teams Yet</h2>
          <p>You haven't created any teams yet. Join a league to create your first team!</p>
          <div className="empty-state-actions">
            <button className="btn btn-primary" onClick={handleJoinLeague}>
              Join a League
            </button>
          </div>
        </div>
      )}

      {/* Teams List */}
      {teams.length > 0 && (
        <>
          {/* Sort Controls */}
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              className="form-control sort-select"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="points">Total Points</option>
              <option value="league">League Name</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="results-info">
            Showing {teams.length} team{teams.length !== 1 ? 's' : ''}
          </div>

          {/* Team Cards Grid */}
          <div className="team-cards-grid">
            {teams.map((team) => (
              <Link
                key={team.id}
                to={`/teams/${team.id}`}
                className="team-card-link"
              >
                <div className="team-card my-team-card">
                  {/* Team Info */}
                  <div className="team-card-header">
                    <h3 className="team-name">{team.name}</h3>
                    {!team.is_active && (
                      <span className="status-badge inactive">Inactive</span>
                    )}
                  </div>

                  {/* League Info */}
                  <div className="team-league-info">
                    <span className="league-label">League:</span>
                    <span className="league-name">{team.league_name}</span>
                  </div>

                  {/* Team Stats */}
                  <div className="team-card-stats">
                    <div className="stat">
                      <span className="stat-label">Total Points</span>
                      <span className={`stat-value points-${getPointsColor(team.total_points)}`}>
                        {team.total_points} pts
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Budget Remaining</span>
                      <span className="stat-value budget">
                        ${team.budget_remaining.toFixed(1)}M
                      </span>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <div className="card-footer">
                    <span className="view-details">View Details →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}