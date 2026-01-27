import React from "react";
import { Link } from "react-router-dom";
import { Race } from "../../../services/raceService";
import "./RaceCard.scss";

interface RaceCardProps {
  race: Race;
  isNext?: boolean;
}

/**
 * RaceCard component
 * Displays a single race in the calendar
 */
const RaceCard: React.FC<RaceCardProps> = ({ race, isNext = false }) => {
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusBadge = () => {
    switch (race.status) {
      case "upcoming":
        return <span className="race-card__status race-card__status--upcoming">Upcoming</span>;
      case "completed":
        return <span className="race-card__status race-card__status--completed">Completed</span>;
      case "cancelled":
        return <span className="race-card__status race-card__status--cancelled">Cancelled</span>;
      case "in_progress":
        return <span className="race-card__status race-card__status--in-progress">In Progress</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`race-card ${isNext ? "race-card--next" : ""}`}>
      {isNext && <div className="race-card__next-badge">Next Race</div>}
      
      <Link to={`/races/${race.id}`} className="race-card__link">
        <div className="race-card__header">
          <span className="race-card__round">Round {race.round}</span>
          {getStatusBadge()}
        </div>

        <h3 className="race-card__name">{race.name}</h3>

        <div className="race-card__info">
          <div className="race-card__info-item">
            <span className="race-card__info-label">Circuit:</span>
            <span className="race-card__info-value">{race.circuit}</span>
          </div>
          <div className="race-card__info-item">
            <span className="race-card__info-label">Country:</span>
            <span className="race-card__info-value">{race.country}</span>
          </div>
          {race.city && (
            <div className="race-card__info-item">
              <span className="race-card__info-label">City:</span>
              <span className="race-card__info-value">{race.city}</span>
            </div>
          )}
        </div>

        <div className="race-card__dates">
          <div className="race-card__date">
            <span className="race-card__date-icon">🏁</span>
            <span className="race-card__date-text">
              {formatDateTime(race.race_date)}
            </span>
          </div>
          <div className="race-card__date">
            <span className="race-card__date-icon">⏱️</span>
            <span className="race-card__date-text">
              Qualifying: {formatDate(race.qualifying_date)}
            </span>
          </div>
        </div>

        {race.status === "completed" && (
          <div className="race-card__action">
            View Results →
          </div>
        )}
      </Link>
    </div>
  );
};

export default RaceCard;
