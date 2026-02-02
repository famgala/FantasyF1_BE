import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getRaceById } from '../services/raceService';
import { getMyTeams } from '../services/teamService';
import { getTeamPicks } from '../services/teamService';
import type { Race, TeamPick } from '../types';

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

// Helper function to format time
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Countdown Timer Component
function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="countdown-timer">
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.days}</span>
        <span className="countdown-label">Days</span>
      </div>
      <div className="countdown-separator">:</div>
      <div className="countdown-item">
        <span className="countdown-value">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="countdown-label">Hours</span>
      </div>
      <div className="countdown-separator">:</div>
      <div className="countdown-item">
        <span className="countdown-value">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="countdown-label">Mins</span>
      </div>
      <div className="countdown-separator">:</div>
      <div className="countdown-item">
        <span className="countdown-value">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="countdown-label">Secs</span>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: 'upcoming' | 'ongoing' | 'completed' }) {
  const statusConfig = {
    upcoming: { className: 'status-upcoming', label: 'Upcoming' },
    ongoing: { className: 'status-ongoing', label: 'Ongoing' },
    completed: { className: 'status-completed', label: 'Completed' },
  };

  const config = statusConfig[status];

  return <span className={`race-status-badge ${config.className}`}>{config.label}</span>;
}

// Session Time Card Component
interface SessionTimeCardProps {
  label: string;
  date?: string;
  icon: string;
}

function SessionTimeCard({ label, date, icon }: SessionTimeCardProps) {
  if (!date) return null;

  return (
    <div className="session-time-card">
      <div className="session-icon">{icon}</div>
      <div className="session-info">
        <div className="session-label">{label}</div>
        <div className="session-date">{formatDate(date)}</div>
        <div className="session-time">{formatTime(date)}</div>
      </div>
    </div>
  );
}

// User Picks Section Component
interface UserPicksSectionProps {
  picks: TeamPick[];
}

function UserPicksSection({ picks }: UserPicksSectionProps) {
  if (picks.length === 0) {
    return (
      <div className="user-picks-section">
        <h3 className="section-title">Your Picks</h3>
        <div className="empty-state">
          <p>You haven't made any picks for this race yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-picks-section">
      <h3 className="section-title">Your Picks</h3>
      <div className="picks-grid">
        {picks.map((pick) => (
          <div key={pick.id} className="pick-card">
            <div className="pick-header">
              <span className="pick-team">{pick.driver_team}</span>
              <span className="pick-number">#{pick.driver_number}</span>
            </div>
            <div className="pick-name">{pick.driver_name}</div>
            <div className="pick-stats">
              <div className="pick-stat">
                <span className="stat-label">Price:</span>
                <span className="stat-value">${pick.driver_price.toFixed(1)}M</span>
              </div>
              <div className="pick-stat">
                <span className="stat-label">Points:</span>
                <span className="stat-value">{pick.points_earned}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [race, setRace] = useState<Race | null>(null);
  const [userPicks, setUserPicks] = useState<TeamPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingPicks, setLoadingPicks] = useState(false);

  const fetchRace = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const raceData = await getRaceById(parseInt(id));
      setRace(raceData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load race details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchUserPicks = useCallback(async () => {
    if (!id || !race) return;

    try {
      setLoadingPicks(true);
      const teams = await getMyTeams();
      
      // Fetch picks for each team and filter for this race
      const allPicks: TeamPick[] = [];
      for (const team of teams) {
        const teamPicks = await getTeamPicks(team.id);
        const racePicks = teamPicks.filter(pick => String(pick.race_id) === id);
        allPicks.push(...racePicks);
      }
      
      setUserPicks(allPicks);
    } catch (err: any) {
      // Don't show error for picks, just log it
      console.error('Failed to load user picks:', err);
    } finally {
      setLoadingPicks(false);
    }
  }, [id, race]);

  useEffect(() => {
    fetchRace();
  }, [fetchRace]);

  useEffect(() => {
    if (race) {
      fetchUserPicks();
    }
  }, [race, fetchUserPicks]);

  const handleBack = () => {
    navigate('/races');
  };

  if (loading) {
    return (
      <div className="race-detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading race details...</p>
        </div>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="race-detail-container">
        <div className="alert alert-error">
          {error || 'Race not found'}
        </div>
        <button className="btn btn-secondary" onClick={handleBack}>
          Back to Race Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="race-detail-container">
      <div className="page-header">
        <button className="btn btn-secondary btn-back" onClick={handleBack}>
          Back to Race Calendar
        </button>
        <div className="header-content">
          <h1>{race.name}</h1>
          <p className="header-subtitle">{race.circuit_name} {race.country}</p>
        </div>
      </div>

      <div className="race-detail-content">
        {/* Race Info Card */}
        <div className="race-info-card">
          <div className="race-info-header">
            <div className="race-round-badge">Round {race.round_number}</div>
            <StatusBadge status={race.status} />
          </div>

          <div className="race-date-section">
            <div className="race-date-main">
              <span className="date-icon"></span>
              <div className="date-info">
                <div className="date-label">Race Date</div>
                <div className="date-value">{formatDate(race.race_date)}</div>
                <div className="time-value">{formatTime(race.race_date)}</div>
              </div>
            </div>
          </div>

          {/* Countdown for upcoming races */}
          {race.status === 'upcoming' && (
            <div className="countdown-section">
              <p className="countdown-label-main">Time until race:</p>
              <CountdownTimer targetDate={race.race_date} />
            </div>
          )}

          {/* Winning Constructor for completed races */}
          {race.status === 'completed' && race.winning_constructor && (
            <div className="winning-constructor-section">
              <div className="winner-icon"></div>
              <div className="winner-info">
                <div className="winner-label">Winning Constructor</div>
                <div className="winner-value">{race.winning_constructor}</div>
              </div>
            </div>
          )}
        </div>

        {/* Session Times */}
        <div className="session-times-section">
          <h2 className="section-title">Session Schedule</h2>
          <div className="session-times-grid">
            <SessionTimeCard label="Practice 1" date={race.fp1_date} icon="" />
            <SessionTimeCard label="Practice 2" date={race.fp2_date} icon="" />
            <SessionTimeCard label="Practice 3" date={race.fp3_date} icon="" />
            <SessionTimeCard label="Qualifying" date={race.qualifying_date} icon="" />
            <SessionTimeCard label="Race" date={race.race_date} icon="" />
          </div>
        </div>

        {/* User's Picks */}
        {!loadingPicks && <UserPicksSection picks={userPicks} />}

        {/* Race Results Link */}
        {race.status === 'completed' && (
          <div className="race-results-link-section">
            <h2 className="section-title">Race Results</h2>
            <div className="results-link-card">
              <p>View detailed race results and finishing positions.</p>
              <Link to={`/races/${id}/results`} className="btn btn-primary">
                View Results
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
