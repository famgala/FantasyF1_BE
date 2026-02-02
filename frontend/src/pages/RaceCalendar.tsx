import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUpcomingRaces, getPastRaces } from '../services/raceService';
import type { Race } from '../types';
import { MobileNav } from '../components/MobileNav';

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
    <>
      <MobileNav />
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

// Race Card Component
interface RaceCardProps {
  race: Race;
  isNextRace?: boolean;
  onClick: (raceId: number) => void;
}

function RaceCard({ race, isNextRace, onClick }: RaceCardProps) {
  return (
    <div
      className={`race-card ${isNextRace ? 'next-race-card' : ''}`}
      onClick={() => onClick(race.id)}
    >
      <div className="race-card-header">
        <span className="race-round">Round {race.round_number}</span>
        <StatusBadge status={race.status} />
      </div>
      
      <h3 className="race-name">{race.name}</h3>
      <p className="race-circuit">{race.circuit_name}</p>
      <p className="race-country">{race.country}</p>
      
      <div className="race-date">
        <div className="date-main">{formatDate(race.race_date)}</div>
        <div className="date-time">{formatTime(race.race_date)}</div>
      </div>
      
      {isNextRace && (
        <div className="countdown-section">
          <p className="countdown-label-main">Time until race:</p>
          <CountdownTimer targetDate={race.race_date} />
        </div>
      )}
      
      {race.winning_constructor && (
        <div className="race-winner">
          <span className="winner-label">Winner:</span>
          <span className="winner-value">{race.winning_constructor}</span>
        </div>
      )}
      
      <div className="race-card-footer">
        <span className="view-details">View Details →</span>
      </div>
    </div>
  );
}

export default function RaceCalendar() {
  const navigate = useNavigate();
  const [upcomingRaces, setUpcomingRaces] = useState<Race[]>([]);
  const [pastRaces, setPastRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both upcoming and past races in parallel
      const [upcoming, past] = await Promise.all([
        getUpcomingRaces(24),
        getPastRaces(24),
      ]);

      setUpcomingRaces(upcoming);
      setPastRaces(past);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load race calendar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  // Get the next upcoming race (first one in the list since they are sorted by date)
  const nextRace = useMemo(() => {
    return upcomingRaces.length > 0 ? upcomingRaces[0] : null;
  }, [upcomingRaces]);

  const handleRaceClick = (raceId: number) => {
    // Navigate to race detail page (US-030)
    navigate(`/races/${raceId}`);
  };

  return (
    <div className="race-calendar-container">
      <div className="page-header">
        <h1>Race Calendar</h1>
        <p>View all Formula 1 races for the season</p>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading race calendar...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Next Race Section */}
          {nextRace && (
            <div className="next-race-section">
              <h2 className="section-title">🏁 Next Race</h2>
              <div className="next-race-card-container">
                <RaceCard
                  race={nextRace}
                  isNextRace={true}
                  onClick={handleRaceClick}
                />
              </div>
            </div>
          )}

          {/* Upcoming Races Section */}
          {upcomingRaces.length > 0 && (
            <div className="upcoming-races-section">
              <h2 className="section-title">
                📅 Upcoming Races ({upcomingRaces.length})
              </h2>
              <div className="races-grid">
                {upcomingRaces.slice(1).map((race) => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    onClick={handleRaceClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Races Section */}
          {pastRaces.length > 0 && (
            <div className="past-races-section">
              <h2 className="section-title">
                ✅ Past Races ({pastRaces.length})
              </h2>
              <div className="races-grid">
                {pastRaces.map((race) => (
                  <RaceCard
                    key={race.id}
                    race={race}
                    onClick={handleRaceClick}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!nextRace && pastRaces.length === 0 && (
            <div className="empty-state">
              <h3>No races available</h3>
              <p>There are no races scheduled at the moment.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
