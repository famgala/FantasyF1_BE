import React, { useState, useEffect } from "react";
import { getDraftHistory, ConstructorPick, Driver } from "../../../services/draftService";
import "./DraftHistory.scss";

interface DraftHistoryProps {
  leagueId: number;
  raceId: number;
}

interface DriverStats {
  [driverId: number]: {
    driver: Driver;
    pickCount: number;
  };
}

interface DraftSummary {
  totalPicks: number;
  totalConstructors: number;
  mostPickedDriver: {
    driver: Driver;
    count: number;
  } | null;
  averagePickValue: number;
  quickestPick: ConstructorPick | null;
  slowestPick: ConstructorPick | null;
}

const DraftHistory: React.FC<DraftHistoryProps> = ({ leagueId, raceId }) => {
  const [picks, setPicks] = useState<ConstructorPick[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const historyData = await getDraftHistory(leagueId, raceId);
        setPicks(historyData);
      } catch (err) {
        setError("Failed to load draft history. Please try again.");
        console.error("Error fetching draft history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [leagueId, raceId]);

  // Calculate summary statistics
  const calculateSummary = (): DraftSummary => {
    if (picks.length === 0) {
      return {
        totalPicks: 0,
        totalConstructors: 0,
        mostPickedDriver: null,
        averagePickValue: 0,
        quickestPick: null,
        slowestPick: null,
      };
    }

    // Count picks by driver
    const driverStats: DriverStats = {};
    picks.forEach((pick) => {
      if (!driverStats[pick.driver.id]) {
        driverStats[pick.driver.id] = {
          driver: pick.driver,
          pickCount: 0,
        };
      }
      driverStats[pick.driver.id].pickCount++;
    });

    // Find most picked driver
    let mostPickedDriver: {
      driver: Driver;
      count: number;
    } | null = null;
    Object.values(driverStats).forEach((stat) => {
      if (!mostPickedDriver || stat.pickCount > mostPickedDriver.count) {
        mostPickedDriver = {
          driver: stat.driver,
          count: stat.pickCount,
        };
      }
    });

    // Calculate average pick value (price)
    const totalValue = picks.reduce(
      (sum, pick) => sum + pick.driver.price,
      0
    );
    const averagePickValue = totalValue / picks.length;

    // Find quickest and slowest picks
    const sortedByTime = [...picks].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const quickestPick = sortedByTime[0] || null;
    const slowestPick = sortedByTime[sortedByTime.length - 1] || null;

    // Count unique constructors
    const uniqueConstructors = new Set(picks.map((p) => p.constructor_id));

    return {
      totalPicks: picks.length,
      totalConstructors: uniqueConstructors.size,
      mostPickedDriver,
      averagePickValue,
      quickestPick,
      slowestPick,
    };
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPickTimeDiff = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m ago`;
    }
    return `${diffMins}m ago`;
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="draft-history draft-history--loading">
        <div className="draft-history__skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-summary"></div>
          <div className="skeleton-picks"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="draft-history draft-history--error">
        <div className="draft-history__error">
          <svg
            className="error-icon"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <div className="draft-history draft-history--empty">
        <div className="draft-history__empty">
          <svg
            className="empty-icon"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
          <h3>No Draft History</h3>
          <p>
            The draft for this race has not been completed yet. Check back after
            the draft closes.
          </p>
        </div>
      </div>
    );
  }

  // Group picks by pick number (1 or 2)
  const picksByRound = picks.reduce((acc, pick) => {
    if (!acc[pick.pick_number]) {
      acc[pick.pick_number] = [];
    }
    acc[pick.pick_number].push(pick);
    return acc;
  }, {} as Record<number, ConstructorPick[]>);

  return (
    <div className="draft-history">
      <div className="draft-history__header">
        <h2 className="draft-history__title">Draft History & Recap</h2>
        <span className="draft-history__pick-count">{summary.totalPicks} Total Picks</span>
      </div>

      {/* Summary Statistics */}
      <div className="draft-history__summary">
        <div className="summary-card summary-card--constructors">
          <div className="summary-card__icon">
            <svg
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div className="summary-card__content">
            <div className="summary-card__value">
              {summary.totalConstructors}
            </div>
            <div className="summary-card__label">Constructors</div>
          </div>
        </div>

        {summary.mostPickedDriver && (
          <div className="summary-card summary-card--driver">
            <div className="summary-card__icon">
              <svg
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="summary-card__content">
              <div className="summary-card__value">
                {summary.mostPickedDriver.driver.name}
              </div>
              <div className="summary-card__label">
                Most Picked ({summary.mostPickedDriver.count}x)
              </div>
            </div>
          </div>
        )}

        <div className="summary-card summary-card--value">
          <div className="summary-card__icon">
            <svg
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="summary-card__content">
            <div className="summary-card__value">
              ${summary.averagePickValue.toFixed(1)}M
            </div>
            <div className="summary-card__label">Avg Pick Value</div>
          </div>
        </div>
      </div>

      {/* Speed Records */}
      {(summary.quickestPick || summary.slowestPick) && (
        <div className="draft-history__speed-records">
          {summary.quickestPick && (
            <div className="speed-record speed-record--quickest">
              <div className="speed-record__label">Quickest Pick</div>
              <div className="speed-record__constructor">
                {summary.quickestPick.constructor_name}
              </div>
              <div className="speed-record__driver">
                {summary.quickestPick.driver.name}
              </div>
              <div className="speed-record__time">
                {getPickTimeDiff(summary.quickestPick.timestamp)}
              </div>
            </div>
          )}
          {summary.slowestPick && (
            <div className="speed-record speed-record--slowest">
              <div className="speed-record__label">Slowest Pick</div>
              <div className="speed-record__constructor">
                {summary.slowestPick.constructor_name}
              </div>
              <div className="speed-record__driver">
                {summary.slowestPick.driver.name}
              </div>
              <div className="speed-record__time">
                {formatTimestamp(summary.slowestPick.timestamp)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Draft Picks by Round */}
      <div className="draft-history__picks">
        {[1, 2].map((round) => {
          const roundPicks = picksByRound[round];
          if (!roundPicks || roundPicks.length === 0) return null;

          return (
            <div key={round} className="draft-round">
              <h3 className="draft-round__title">
                Round {round} - {roundPicks.length} Picks
              </h3>
              <div className="draft-round__picks-list">
                {roundPicks.map((pick, index) => (
                  <div key={`${round}-${index}`} className="draft-pick-card">
                    <div className="draft-pick-card__order">{index + 1}</div>
                    <div className="draft-pick-card__constructor">
                      <div className="constructor-name">
                        {pick.constructor_name}
                      </div>
                      <div className="constructor-username">
                        @{pick.username}
                      </div>
                    </div>
                    <div className="draft-pick-card__driver">
                      <div className="driver-info">
                        <div className="driver-avatar">
                          <span className="driver-number">
                            {pick.driver.number}
                          </span>
                        </div>
                        <div className="driver-details">
                          <div className="driver-name">{pick.driver.name}</div>
                          <div className="driver-team">{pick.driver.team}</div>
                        </div>
                      </div>
                      <div className="driver-price">
                        ${pick.driver.price}M
                      </div>
                    </div>
                    <div className="draft-pick-card__timestamp">
                      {formatTimestamp(pick.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DraftHistory;
