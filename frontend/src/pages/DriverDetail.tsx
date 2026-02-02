import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDriver, getDriverPerformance } from '../services/driverService';
import type { Driver, DriverPerformance, DriverRacePerformance } from '../types';
import { MobileNav } from '../components/MobileNav';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Extended driver type to include status from backend
interface DriverWithStatus extends Driver {
  status?: 'active' | 'injured' | 'retired';
}

type TabType = 'overview' | 'performance';

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverWithStatus | null>(null);
  const [performance, setPerformance] = useState<DriverPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [performanceError, setPerformanceError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (!id) {
      setError('Driver ID is required');
      setLoading(false);
      return;
    }

    const fetchDriver = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDriver(id);
        setDriver(data as DriverWithStatus);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load driver details');
        setDriver(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'performance' && id && !performance) {
      const fetchPerformance = async () => {
        try {
          setPerformanceLoading(true);
          setPerformanceError(null);
          const data = await getDriverPerformance(id);
          setPerformance(data);
        } catch (err: any) {
          setPerformanceError(err.response?.data?.detail || 'Failed to load performance data');
          setPerformance(null);
        } finally {
          setPerformanceLoading(false);
        }
      };

      fetchPerformance();
    }
  }, [activeTab, id, performance]);

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'injured':
        return 'status-badge status-injured';
      case 'retired':
        return 'status-badge status-retired';
      default:
        return 'status-badge status-active';
    }
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'injured':
        return 'Injured';
      case 'retired':
        return 'Retired';
      default:
        return 'Active';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <>
        <MobileNav />
        <div className="driver-detail-container">
          <div className="loading-container">
            <LoadingSpinner size="lg" />
            <p>Loading driver details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <div className="driver-detail-container">
        <ErrorDisplay message={error} />
        <button className="btn btn-secondary" onClick={() => navigate('/drivers')}>
          Back to Drivers
        </button>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="driver-detail-container">
        <div className="empty-state">
          <h3>Driver not found</h3>
          <p>The driver you are looking for does not exist.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/drivers')}>
          Back to Drivers
        </button>
      </div>
    );
  }

  return (
    <div className="driver-detail-container">
      <MobileNav />

      {/* Header Section */}
      <div className="driver-detail-header">
        <div className="header-top">
          <Link to="/drivers" className="back-link">
            ← Back to Drivers
          </Link>
        </div>

        <div className="driver-header-content">
          <div className="driver-number-section">
            <div className="driver-number-large">#{driver.number}</div>
            <div className="driver-code-badge">{driver.code}</div>
          </div>

          <div className="driver-title-section">
            <h1 className="driver-name-large">{driver.name}</h1>
            <div className="driver-meta">
              <span className={getStatusBadgeClass(driver.status)}>
                {getStatusDisplay(driver.status)}
              </span>
              <span className="driver-country">{driver.country}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
      </div>

      {/* Tab Content */}
      <div className="driver-detail-content">
        {activeTab === 'overview' ? (
          <OverviewTab driver={driver} />
        ) : (
          <PerformanceTab
            performance={performance}
            loading={performanceLoading}
            error={performanceError}
            formatDate={formatDate}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className="driver-actions">
        <button className="btn btn-secondary" onClick={() => navigate('/drivers')}>
          Back to Drivers
        </button>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ driver }: { driver: DriverWithStatus }) {
  return (
    <>
      {/* Team Section */}
      <div className="detail-card team-card">
        <h3>Constructor Team</h3>
        <div className="team-info">
          <div className="team-name">{driver.team}</div>
          <Link to={`/constructors/${encodeURIComponent(driver.team)}`} className="view-team-link">
            View Team Details →
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Price</div>
          <div className="stat-value price-value">${driver.price.toFixed(1)}M</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Points</div>
          <div className="stat-value">{driver.total_points.toFixed(1)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Points / Race</div>
          <div className="stat-value">{driver.average_points.toFixed(1)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Driver Number</div>
          <div className="stat-value">#{driver.number}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Country</div>
          <div className="stat-value">{driver.country}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Code</div>
          <div className="stat-value">{driver.code}</div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="detail-card performance-card">
        <h3>Performance Summary</h3>
        <div className="performance-stats">
          <div className="performance-item">
            <span className="performance-label">Total Points Earned:</span>
            <span className="performance-value">{driver.total_points.toFixed(1)}</span>
          </div>
          <div className="performance-item">
            <span className="performance-label">Average Points per Race:</span>
            <span className="performance-value">{driver.average_points.toFixed(1)}</span>
          </div>
          <div className="performance-item">
            <span className="performance-label">Value Rating:</span>
            <span
              className={`performance-value ${getValueRatingClass(driver.price, driver.average_points)}`}
            >
              {getValueRating(driver.price, driver.average_points)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// Performance Tab Component
function PerformanceTab({
  performance,
  loading,
  error,
  formatDate,
}: {
  performance: DriverPerformance | null;
  loading: boolean;
  error: string | null;
  formatDate: (date: string) => string;
}) {
  if (loading) {
    return (
      <div className="loading-container">
        <LoadingSpinner size="lg" />
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

  if (!performance) {
    return (
      <div className="empty-state">
        <h3>No Performance Data</h3>
        <p>No race results available for this driver yet.</p>
      </div>
    );
  }

  const { stats, race_results } = performance;

  return (
    <div className="performance-section">
      {/* Statistics Summary */}
      <div className="detail-card stats-summary-card">
        <h3>Season Statistics</h3>
        <div className="performance-stats-grid">
          <div className="stat-item">
            <div className="stat-item-value">{stats.total_points}</div>
            <div className="stat-item-label">Total Points</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-value">{stats.avg_points_per_race}</div>
            <div className="stat-item-label">Avg Points/Race</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-value">{stats.races_finished}</div>
            <div className="stat-item-label">Races Finished</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-value">{stats.races_count}</div>
            <div className="stat-item-label">Races Entered</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-value">{stats.best_finish ? `P${stats.best_finish}` : '-'}</div>
            <div className="stat-item-label">Best Finish</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-value">{stats.worst_finish ? `P${stats.worst_finish}` : '-'}</div>
            <div className="stat-item-label">Worst Finish</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-value">{stats.podium_count}</div>
            <div className="stat-item-label">Podiums</div>
          </div>
          <div className="stat-item">
            <div className="stat-item-value">{stats.dnf_count}</div>
            <div className="stat-item-label">DNFs</div>
          </div>
        </div>
      </div>

      {/* Points Chart */}
      {race_results.length > 0 && (
        <div className="detail-card chart-card">
          <h3>Points Per Race</h3>
          <PointsChart raceResults={race_results} />
        </div>
      )}

      {/* Race Results Table */}
      <div className="detail-card results-table-card">
        <h3>Race Results</h3>
        {race_results.length > 0 ? (
          <div className="table-container">
            <table className="performance-table">
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Race</th>
                  <th>Date</th>
                  <th>Grid</th>
                  <th>Position</th>
                  <th>Points</th>
                  <th>Fastest Lap</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {race_results.map((result) => (
                  <tr key={result.race_id}>
                    <td>{result.round_number}</td>
                    <td>{result.race_name}</td>
                    <td>{formatDate(result.race_date)}</td>
                    <td>{result.grid_position || '-'}</td>
                    <td className={getPositionClass(result.position, result.dnf)}>
                      {result.dnf ? 'DNF' : `P${result.position}`}
                    </td>
                    <td>{result.points_earned}</td>
                    <td>{result.fastest_lap ? '✓' : '-'}</td>
                    <td>{result.dnf ? result.dnf_reason || 'DNF' : 'Finished'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="no-data-message">No race results available.</p>
        )}
      </div>
    </div>
  );
}

// Points Chart Component (SVG)
function PointsChart({ raceResults }: { raceResults: DriverRacePerformance[] }) {
  const maxPoints = Math.max(...raceResults.map((r) => r.points_earned), 25); // Scale to at least 25
  const chartWidth = 600;
  const chartHeight = 200;
  const barWidth = Math.max(20, (chartWidth - 80) / raceResults.length - 4);
  const maxBarHeight = chartHeight - 60;

  return (
    <div className="chart-container">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="points-chart">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent) => (
          <line
            key={percent}
            x1="50"
            y1={chartHeight - 30 - (percent / 100) * maxBarHeight}
            x2={chartWidth - 30}
            y2={chartHeight - 30 - (percent / 100) * maxBarHeight}
            stroke="#e0e0e0"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}

        {/* Y-axis labels */}
        {[0, Math.round(maxPoints / 4), Math.round(maxPoints / 2), Math.round((maxPoints * 3) / 4), maxPoints].map((value, index) => (
          <text
            key={index}
            x="40"
            y={chartHeight - 30 - (index / 4) * maxBarHeight + 4}
            textAnchor="end"
            fontSize="10"
            fill="#666"
          >
            {value}
          </text>
        ))}

        {/* Bars */}
        {raceResults.map((result, index) => {
          const x = 50 + index * (barWidth + 4);
          const barHeight = (result.points_earned / maxPoints) * maxBarHeight;
          const y = chartHeight - 30 - barHeight;

          return (
            <g key={result.race_id}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={result.dnf ? '#ef4444' : result.points_earned > 0 ? '#3b82f6' : '#9ca3af'}
                rx="2"
              />
              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="9"
                fill="#333"
              >
                {result.points_earned}
              </text>
              {/* X-axis label (round number) */}
              <text
                x={x + barWidth / 2}
                y={chartHeight - 15}
                textAnchor="middle"
                fontSize="9"
                fill="#666"
              >
                R{result.round_number}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line
          x1="50"
          y1={chartHeight - 30}
          x2={chartWidth - 30}
          y2={chartHeight - 30}
          stroke="#ccc"
          strokeWidth="1"
        />
        <line x1="50" y1="20" x2="50" y2={chartHeight - 30} stroke="#ccc" strokeWidth="1" />
      </svg>
    </div>
  );
}

// Helper functions
function getPositionClass(position: number, dnf: boolean): string {
  if (dnf) return 'position-dnf';
  if (position === 1) return 'position-first';
  if (position === 2) return 'position-second';
  if (position === 3) return 'position-third';
  return '';
}

function getValueRating(price: number, avgPoints: number): string {
  if (price === 0) return 'N/A';
  const ratio = avgPoints / price;
  if (ratio >= 5) return 'Excellent';
  if (ratio >= 3) return 'Good';
  if (ratio >= 1.5) return 'Fair';
  return 'Poor';
}

function getValueRatingClass(price: number, avgPoints: number): string {
  if (price === 0) return '';
  const ratio = avgPoints / price;
  if (ratio >= 5) return 'rating-excellent';
  if (ratio >= 3) return 'rating-good';
  if (ratio >= 1.5) return 'rating-fair';
  return 'rating-poor';
}
