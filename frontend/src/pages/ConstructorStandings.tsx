import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getConstructorStandings } from '../services/constructorService';
import type { Constructor } from '../types';
import { MobileNav } from '../components/MobileNav';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { PageLoader } from '../components/PageLoader';
import { ArrowUp, ArrowDown, Trophy, Minus } from 'lucide-react';

// Extended constructor type for standings with position change
interface ConstructorStanding extends Constructor {
  position: number;
  position_change: number; // Positive = gained positions, Negative = lost positions
}

export default function ConstructorStandings() {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<ConstructorStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seasonYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchStandings();
  }, []);

  const fetchStandings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConstructorStandings();
      // Add position and mock position_change (backend may not provide this yet)
      const standingsWithPosition = data.map((constructor, index) => ({
        ...constructor,
        position: index + 1,
        position_change: 0, // Default to no change; backend can enhance later
      }));
      setStandings(standingsWithPosition);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Failed to load constructor standings');
    } finally {
      setLoading(false);
    }
  };

  const handleConstructorClick = (constructorId: string) => {
    navigate(`/constructors/${constructorId}`);
  };

  const getPositionBadgeClass = (position: number) => {
    switch (position) {
      case 1:
        return 'position-gold';
      case 2:
        return 'position-silver';
      case 3:
        return 'position-bronze';
      default:
        return 'position-default';
    }
  };

  const getPositionChangeDisplay = (change: number) => {
    if (change > 0) {
      return (
        <span className="position-change gained">
          <ArrowUp size={14} />
          {change}
        </span>
      );
    } else if (change < 0) {
      return (
        <span className="position-change lost">
          <ArrowDown size={14} />
          {Math.abs(change)}
        </span>
      );
    }
    return (
      <span className="position-change same">
        <Minus size={14} />
      </span>
    );
  };

  const getNationalityFlag = (nationality: string) => {
    const flags: { [key: string]: string } = {
      'British': '🇬🇧',
      'German': '🇩🇪',
      'Italian': '🇮🇹',
      'Austrian': '🇦🇹',
      'French': '🇫🇷',
      'American': '🇺🇸',
      'Swiss': '🇨🇭',
      'Dutch': '🇳🇱',
      'Australian': '🇦🇺',
      'Spanish': '🇪🇸',
      'Mexican': '🇲🇽',
      'Canadian': '🇨🇦',
      'Japanese': '🇯🇵',
      'Chinese': '🇨🇳',
      'Thai': '🇹🇭',
      'Finnish': '🇫🇮',
      'Danish': '🇩🇰',
      'Swedish': '🇸🇪',
      'Brazilian': '🇧🇷',
      'Argentine': '🇦🇷',
      'New Zealander': '🇳🇿',
      'Monegasque': '🇲🇨',
      'Belgian': '🇧🇪',
    };
    return flags[nationality] || '🏁';
  };

  // Get podium entries (top 3)
  const podiumEntries = standings.slice(0, 3);
  const firstPlace = podiumEntries[0];
  const secondPlace = podiumEntries[1];
  const thirdPlace = podiumEntries[2];

  // Get remaining entries for the table
  const tableEntries = standings.slice(3);

  if (loading) {
    return (
      <>
        <MobileNav />
        <PageLoader message="Loading championship standings..." />
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileNav />
        <div className="constructor-standings-page">
          <div className="container">
            <ErrorDisplay message={error} onRetry={fetchStandings} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileNav />
      <div className="constructor-standings-page">
        <div className="container">
          {/* Header */}
          <div className="page-header">
            <div className="header-content">
              <h1>
                <Trophy size={32} className="header-icon" />
                Constructor Championship
              </h1>
              <p className="page-subtitle">
                {seasonYear} F1 Season Standings
              </p>
            </div>
            <div className="header-actions">
              <Link to="/constructors" className="btn btn-secondary">
                ← Back to Teams
              </Link>
            </div>
          </div>

          {/* Empty State */}
          {standings.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🏎️</div>
              <h3>No Standings Available</h3>
              <p>Constructor standings are not available at this time.</p>
              <Link to="/constructors" className="btn btn-primary">
                View All Teams
              </Link>
            </div>
          ) : (
            <>
              {/* Podium Display */}
              {podiumEntries.length > 0 && (
                <div className="podium-display constructors-podium">
                  {/* Second Place */}
                  {secondPlace && (
                    <div className="podium-place podium-second">
                      <div className="podium-rank">2nd</div>
                      <div className="podium-flag">{getNationalityFlag(secondPlace.nationality)}</div>
                      <div className="podium-team">
                        <div className="podium-team-name">{secondPlace.name}</div>
                        <div className="podium-team-code">{secondPlace.code}</div>
                      </div>
                      <div className="podium-points">{secondPlace.points.toLocaleString()} pts</div>
                      <div className="podium-stats">
                        <span className="stat">🏆 {secondPlace.wins} wins</span>
                        <span className="stat">🏅 {secondPlace.championships} titles</span>
                      </div>
                      {getPositionChangeDisplay(secondPlace.position_change)}
                    </div>
                  )}

                  {/* First Place */}
                  {firstPlace && (
                    <div className="podium-place podium-first">
                      <div className="podium-rank">🥇 1st</div>
                      <div className="podium-flag">{getNationalityFlag(firstPlace.nationality)}</div>
                      <div className="podium-team">
                        <div className="podium-team-name">{firstPlace.name}</div>
                        <div className="podium-team-code">{firstPlace.code}</div>
                      </div>
                      <div className="podium-points">{firstPlace.points.toLocaleString()} pts</div>
                      <div className="podium-stats">
                        <span className="stat">🏆 {firstPlace.wins} wins</span>
                        <span className="stat">🏅 {firstPlace.championships} titles</span>
                      </div>
                      {getPositionChangeDisplay(firstPlace.position_change)}
                    </div>
                  )}

                  {/* Third Place */}
                  {thirdPlace && (
                    <div className="podium-place podium-third">
                      <div className="podium-rank">3rd</div>
                      <div className="podium-flag">{getNationalityFlag(thirdPlace.nationality)}</div>
                      <div className="podium-team">
                        <div className="podium-team-name">{thirdPlace.name}</div>
                        <div className="podium-team-code">{thirdPlace.code}</div>
                      </div>
                      <div className="podium-points">{thirdPlace.points.toLocaleString()} pts</div>
                      <div className="podium-stats">
                        <span className="stat">🏆 {thirdPlace.wins} wins</span>
                        <span className="stat">🏅 {thirdPlace.championships} titles</span>
                      </div>
                      {getPositionChangeDisplay(thirdPlace.position_change)}
                    </div>
                  )}
                </div>
              )}

              {/* Standings Table */}
              {tableEntries.length > 0 && (
                <div className="standings-table-container">
                  <table className="standings-table">
                    <thead>
                      <tr>
                        <th className="position-col">Pos</th>
                        <th className="change-col">+/-</th>
                        <th className="team-col">Team</th>
                        <th className="points-col">Points</th>
                        <th className="wins-col">Wins</th>
                        <th className="engine-col">Engine</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableEntries.map((constructor) => (
                        <tr
                          key={constructor.id}
                          className="standings-row"
                          onClick={() => handleConstructorClick(constructor.id)}
                        >
                          <td className="position-col">
                            <span className={`position-badge ${getPositionBadgeClass(constructor.position)}`}>
                              {constructor.position}
                            </span>
                          </td>
                          <td className="change-col">
                            {getPositionChangeDisplay(constructor.position_change)}
                          </td>
                          <td className="team-col">
                            <div className="team-info">
                              <span className="team-flag">{getNationalityFlag(constructor.nationality)}</span>
                              <div className="team-details">
                                <span className="team-name">{constructor.name}</span>
                                <span className="team-code">{constructor.code}</span>
                              </div>
                            </div>
                          </td>
                          <td className="points-col">
                            <span className="points-value">{constructor.points.toLocaleString()}</span>
                          </td>
                          <td className="wins-col">
                            <span className="stat-value">{constructor.wins}</span>
                          </td>
                          <td className="engine-col">
                            <span className="engine-value">{constructor.engine}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Legend */}
              <div className="standings-legend">
                <div className="legend-item">
                  <span className="legend-icon position-gold">1</span>
                  <span>Leader</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon position-silver">2</span>
                  <span>2nd Place</span>
                </div>
                <div className="legend-item">
                  <span className="legend-icon position-bronze">3</span>
                  <span>3rd Place</span>
                </div>
                <div className="legend-item">
                  <ArrowUp size={16} className="legend-icon gained" />
                  <span>Gained positions</span>
                </div>
                <div className="legend-item">
                  <ArrowDown size={16} className="legend-icon lost" />
                  <span>Lost positions</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
