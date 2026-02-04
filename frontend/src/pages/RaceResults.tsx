import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRaceResults } from '../services/raceService';
import type { RaceResultsResponse, RaceResult } from '../types';
import { MobileNav } from '../components/MobileNav';
import { Trophy, ArrowUp, ArrowDown, Minus, Clock, AlertCircle } from 'lucide-react';

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// Position Change Indicator Component
function PositionChange({ grid, final }: { grid: number; final: number }) {
  const change = grid - final;

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
  } else {
    return (
      <span className="position-change same">
        <Minus size={14} />
      </span>
    );
  }
}

// DNF Badge Component
function DnfBadge({ status, reason }: { status: string; reason?: string }) {
  const statusLabels: Record<string, string> = {
    dnf: 'DNF',
    dns: 'DNS',
    dq: 'DQ',
  };

  const label = statusLabels[status] || status.toUpperCase();

  return (
    <span className="dnf-badge" title={reason || label}>
      <AlertCircle size={14} />
      {label}
    </span>
  );
}

// Fastest Lap Indicator Component
function FastestLapIndicator() {
  return (
    <span className="fastest-lap-indicator" title="Fastest Lap">
      <Clock size={14} />
    </span>
  );
}

// Results Table Row Component
interface ResultRowProps {
  result: RaceResult;
}

function ResultRow({ result }: ResultRowProps) {
  const isPodium = result.position <= 3;
  const positionClasses = ['position-gold', 'position-silver', 'position-bronze'];

  return (
    <tr className={`results-row ${isPodium ? 'podium-row' : ''}`}>
      <td className="position-cell">
        <span className={`position-badge ${isPodium ? positionClasses[result.position - 1] : ''}`}>
          {result.position}
        </span>
      </td>
      <td className="driver-cell">
        <div className="driver-info">
          <span className="driver-name">{result.driver_name}</span>
          <span className="driver-code">{result.driver_code}</span>
          {result.fastest_lap && <FastestLapIndicator />}
        </div>
      </td>
      <td className="constructor-cell">{result.constructor_name}</td>
      <td className="grid-cell">
        <div className="grid-position">
          <span className="grid-value">P{result.grid_position}</span>
          <PositionChange grid={result.grid_position} final={result.position} />
        </div>
      </td>
      <td className="laps-cell">
        {result.status === 'finished' ? (
          result.laps
        ) : (
          <DnfBadge status={result.status} reason={result.dnf_reason} />
        )}
      </td>
      <td className="points-cell">
        <span className={`points-value ${result.points > 0 ? 'has-points' : ''}`}>
          {result.points}
        </span>
      </td>
    </tr>
  );
}

// Results Table Component
interface ResultsTableProps {
  results: RaceResult[];
}

function ResultsTable({ results }: ResultsTableProps) {
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <p>No results available for this race.</p>
      </div>
    );
  }

  return (
    <div className="results-table-container">
      <table className="results-table">
        <thead>
          <tr>
            <th className="position-header">Pos</th>
            <th className="driver-header">Driver</th>
            <th className="constructor-header">Team</th>
            <th className="grid-header">Grid</th>
            <th className="laps-header">Laps</th>
            <th className="points-header">Pts</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <ResultRow key={result.id} result={result} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Mobile Results Card Component
interface MobileResultCardProps {
  result: RaceResult;
}

function MobileResultCard({ result }: MobileResultCardProps) {
  const isPodium = result.position <= 3;
  const positionClasses = ['position-gold', 'position-silver', 'position-bronze'];

  return (
    <div className={`mobile-result-card ${isPodium ? 'podium-card' : ''}`}>
      <div className="mobile-card-header">
        <span className={`position-badge ${isPodium ? positionClasses[result.position - 1] : ''}`}>
          {result.position}
        </span>
        <span className="mobile-points">
          {result.points > 0 ? `+${result.points} pts` : '0 pts'}
        </span>
      </div>
      <div className="mobile-card-body">
        <div className="mobile-driver-row">
          <span className="mobile-driver-name">{result.driver_name}</span>
          {result.fastest_lap && <FastestLapIndicator />}
        </div>
        <div className="mobile-constructor">{result.constructor_name}</div>
        <div className="mobile-stats-row">
          <div className="mobile-stat">
            <span className="mobile-stat-label">Grid:</span>
            <span className="mobile-stat-value">P{result.grid_position}</span>
            <PositionChange grid={result.grid_position} final={result.position} />
          </div>
          <div className="mobile-stat">
            <span className="mobile-stat-label">Laps:</span>
            {result.status === 'finished' ? (
              <span className="mobile-stat-value">{result.laps}</span>
            ) : (
              <DnfBadge status={result.status} reason={result.dnf_reason} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Results List Component
interface MobileResultsListProps {
  results: RaceResult[];
}

function MobileResultsList({ results }: MobileResultsListProps) {
  if (results.length === 0) {
    return (
      <div className="empty-state">
        <p>No results available for this race.</p>
      </div>
    );
  }

  return (
    <div className="mobile-results-list">
      {results.map((result) => (
        <MobileResultCard key={result.id} result={result} />
      ))}
    </div>
  );
}

export default function RaceResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<RaceResultsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchResults = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getRaceResults(parseInt(id));
      setResults(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load race results');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleBack = () => {
    navigate(`/races/${id}`);
  };

  if (loading) {
    return (
      <div className="race-results-container">
        <MobileNav />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading race results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="race-results-container">
        <MobileNav />
        <div className="page-header">
          <button className="btn btn-secondary btn-back" onClick={handleBack}>
            ← Back to Race
          </button>
        </div>
        <div className="alert alert-error">
          {error || 'Race results not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="race-results-container">
      <MobileNav />

      <div className="page-header">
        <button className="btn btn-secondary btn-back" onClick={handleBack}>
          ← Back to Race
        </button>
        <div className="header-content">
          <h1>{results.race_name}</h1>
          <p className="header-subtitle">
            {results.circuit_name} • Round {results.round_number}
          </p>
        </div>
      </div>

      <div className="race-results-content">
        {/* Race Info Banner */}
        <div className="race-info-banner">
          <div className="info-item">
            <span className="info-label">Date:</span>
            <span className="info-value">{formatDate(results.race_date)}</span>
          </div>
          {results.winning_constructor_name && (
            <div className="info-item winner-item">
              <Trophy size={18} className="trophy-icon" />
              <span className="info-label">Winner:</span>
              <span className="info-value">{results.winning_constructor_name}</span>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="results-legend">
          <div className="legend-item">
            <ArrowUp size={14} className="legend-icon gained" />
            <span>Positions gained</span>
          </div>
          <div className="legend-item">
            <ArrowDown size={14} className="legend-icon lost" />
            <span>Positions lost</span>
          </div>
          <div className="legend-item">
            <Clock size={14} className="legend-icon fastest" />
            <span>Fastest lap</span>
          </div>
          <div className="legend-item">
            <AlertCircle size={14} className="legend-icon dnf" />
            <span>DNF/DNS/DQ</span>
          </div>
        </div>

        {/* Results Display - Table for desktop, Cards for mobile */}
        {isMobile ? (
          <MobileResultsList results={results.results} />
        ) : (
          <ResultsTable results={results.results} />
        )}

        {/* Summary Stats */}
        {results.results.length > 0 && (
          <div className="results-summary">
            <div className="summary-card">
              <span className="summary-label">Total Finishers</span>
              <span className="summary-value">
                {results.results.filter((r) => r.status === 'finished').length}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">DNFs</span>
              <span className="summary-value dnf-count">
                {results.results.filter((r) => r.status === 'dnf').length}
              </span>
            </div>
            <div className="summary-card">
              <span className="summary-label">Fastest Lap</span>
              <span className="summary-value">
                {results.results.find((r) => r.fastest_lap)?.driver_code || 'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
