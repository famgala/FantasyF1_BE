import React, { useState, useEffect } from "react";
import "./DraftTimer.scss";

/**
 * Props for DraftTimer component
 */
export interface DraftTimerProps {
  status: "UPCOMING" | "OPEN" | "CLOSED" | "COMPLETE";
  opensAt: string | null;
  closesAt: string | null;
  onCountdownComplete?: () => void;
}

/**
 * Format time remaining as HH:MM:SS
 */
const formatTimeRemaining = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

/**
 * Format datetime to user's local timezone
 */
const formatLocalDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

/**
 * Calculate time remaining to a target date
 */
const getTimeRemaining = (
  targetDate: string | null
): number | null => {
  if (!targetDate) return null;
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const remaining = target - now;
  return remaining > 0 ? remaining : 0;
};

/**
 * DraftTimer component
 * Displays countdown timer for draft window open/close
 */
const DraftTimer: React.FC<DraftTimerProps> = ({
  status,
  opensAt,
  closesAt,
  onCountdownComplete,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [targetLabel, setTargetLabel] = useState<string>("");

  useEffect(() => {
    // Determine target time and label based on status
    let target: string | null;
    let label: string;

    switch (status) {
      case "UPCOMING":
        target = opensAt;
        label = "Draft opens in";
        break;
      case "OPEN":
        target = closesAt;
        label = "Draft closes in";
        break;
      case "CLOSED":
      case "COMPLETE":
        target = null;
        label = "";
        break;
      default:
        target = null;
        label = "";
    }

    setTargetLabel(label);

    if (target) {
      // Calculate initial time
      const initialTime = getTimeRemaining(target);
      setTimeRemaining(initialTime);

      // Set up interval to update timer every second
      const interval = setInterval(() => {
        const remaining = getTimeRemaining(target);
        setTimeRemaining(remaining);

        // Trigger callback when countdown completes
        if (remaining === 0 && onCountdownComplete) {
          onCountdownComplete();
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeRemaining(null);
    }
  }, [status, opensAt, closesAt, onCountdownComplete]);

  // Render based on status
  const renderContent = () => {
    switch (status) {
      case "UPCOMING":
        return (
          <div className="draft-timer draft-timer--upcoming">
            <div className="draft-timer__status">Draft Not Started</div>
            {timeRemaining !== null && (
              <>
                <div className="draft-timer__label">{targetLabel}</div>
                <div className="draft-timer__time">{formatTimeRemaining(timeRemaining)}</div>
                <div className="draft-timer__info">
                  Draft opens Monday 8AM EST
                </div>
              </>
            )}
          </div>
        );

      case "OPEN":
        return (
          <div className="draft-timer draft-timer--open">
            <div className="draft-timer__status">Draft In Progress</div>
            {timeRemaining !== null ? (
              <>
                <div className="draft-timer__label">{targetLabel}</div>
                <div className="draft-timer__time draft-timer__time--urgent">
                  {formatTimeRemaining(timeRemaining)}
                </div>
                <div className="draft-timer__info">
                  Closes at qualifying start
                </div>
              </>
            ) : (
              <div className="draft-timer__time draft-timer__time--urgent">
                Draft Active
              </div>
            )}
          </div>
        );

      case "CLOSED":
        return (
          <div className="draft-timer draft-timer--closed">
            <div className="draft-timer__status">Draft Closed</div>
            <div className="draft-timer__info">
              Draft window has ended. Picks are final.
            </div>
          </div>
        );

      case "COMPLETE":
        return (
          <div className="draft-timer draft-timer--complete">
            <div className="draft-timer__status">Draft Complete</div>
            <div className="draft-timer__info">
              All picks have been made for this race.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="draft-timer-container">{renderContent()}</div>;
};

export default DraftTimer;
