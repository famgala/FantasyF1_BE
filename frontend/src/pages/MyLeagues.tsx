import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { MyLeague } from '../types';
import { getMyLeagues } from '../services/leagueService';

type SortOption = 'alphabetical' | 'recent' | 'rank';

export default function MyLeagues() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<MyLeague[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('alphabetical');

  useEffect(() => {
    const fetchMyLeagues = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getMyLeagues(sortBy);
        setLeagues(data);
      } catch (err: any) {
        console.error('Error fetching my leagues:', err);
        setError(err.response?.data?.detail || 'Failed to load your leagues');
      } finally {
        setLoading(false);
      }
    };

    fetchMyLeagues();
  }, [sortBy]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOption);
  };

  const handleCreateLeague = () => {
    navigate('/leagues/create');
  };

  const handleJoinLeague = () => {
    navigate('/leagues/join');
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="my-leagues">
        <div className="loading-spinner">Loading your leagues...</div>
      </div>
    );
  }

  return (
    <div className="my-leagues">
      {/* Header */}
      <div className="page-header">
        <h1>My Leagues</h1>
        <div className="header-actions">
          <button className="btn btn-success" onClick={handleCreateLeague}>
            Create League
          </button>
          <button className="btn btn-primary" onClick={handleJoinLeague}>
            Join League
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Empty State */}
      {!loading && leagues.length === 0 && !error && (
        <div className="empty-state-container">
          <div className="empty-state-icon">🏁</div>
          <h2>No Leagues Yet</h2>
          <p>You haven't joined any leagues yet. Create your own league or join an existing one!</p>
          <div className="empty-state-actions">
            <button className="btn btn-success" onClick={handleCreateLeague}>
              Create League
            </button>
            <button className="btn btn-primary" onClick={handleJoinLeague}>
              Join League
            </button>
          </div>
        </div>
      )}

      {/* Leagues List */}
      {leagues.length > 0 && (
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
              <option value="recent">Most Recent</option>
              <option value="rank">Highest Rank</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="results-info">
            Showing {leagues.length} league{leagues.length !== 1 ? 's' : ''}
          </div>

          {/* League Cards Grid */}
          <div className="league-cards-grid">
            {leagues.map((league) => (
              <Link
                key={league.id}
                to={`/leagues/${league.id}`}
                className="league-card-link"
              >
                <div className="league-card my-league-card">
                  {/* Rank Badge */}
                  <div className="rank-badge">
                    <span className="rank-text">{getRankBadge(league.my_team_rank)}</span>
                    <span className="rank-label">Rank</span>
                  </div>

                  {/* League Info */}
                  <div className="league-card-header">
                    <h3 className="league-name">{league.name}</h3>
                    <span className={`privacy-badge ${league.privacy}`}>
                      {league.privacy}
                    </span>
                  </div>

                  <p className="league-description">
                    {league.description || 'No description'}
                  </p>

                  {/* Team Info */}
                  <div className="my-team-info">
                    <div className="team-row">
                      <span className="team-label">Your Team:</span>
                      <span className="team-name">{league.my_team_name}</span>
                    </div>
                    <div className="team-row">
                      <span className="team-label">Points:</span>
                      <span className="team-points">{league.my_team_points} pts</span>
                    </div>
                  </div>

                  {/* League Stats */}
                  <div className="league-card-stats">
                    <div className="stat">
                      <span className="stat-label">Teams</span>
                      <span className="stat-value">
                        {league.team_count} / {league.max_teams}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Draft</span>
                      <span className="stat-value">{league.draft_method}</span>
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
