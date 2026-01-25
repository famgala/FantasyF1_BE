import React, { useState } from "react";
import { Driver } from "../../../services/draftService";
import "./DriverSelectionCard.scss";

/**
 * Props for DriverSelectionCard component
 */
export interface DriverSelectionCardProps {
  driver: Driver;
  isDisabled?: boolean;
  isSelected?: boolean;
  isMyTurn?: boolean;
  onSelect: (driver: Driver) => void;
}

/**
 * DriverSelectionCard component
 * Displays driver card with stats and selection functionality
 */
const DriverSelectionCard: React.FC<DriverSelectionCardProps> = ({
  driver,
  isDisabled = false,
  isSelected = false,
  isMyTurn = false,
  onSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = () => {
    if (!isDisabled && isMyTurn) {
      onSelect(driver);
    } else if (!isDisabled) {
      setIsExpanded(!isExpanded);
    }
  };

  const renderCard = () => {
    return (
      <div
        className={`driver-selection-card ${
          isDisabled ? "driver-selection-card--disabled" : ""
        } ${isSelected ? "driver-selection-card--selected" : ""} ${
          isMyTurn && !isDisabled ? "driver-selection-card--selectable" : ""
        } ${isExpanded ? "driver-selection-card--expanded" : ""}`}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleCardClick();
          }
        }}
        aria-label={`Select ${driver.name} (${driver.team})`}
      >
        <div className="driver-selection-card__header">
          <div className="driver-selection-card__number">{driver.number}</div>
          <div className="driver-selection-card__info">
            <div className="driver-selection-card__name">{driver.name}</div>
            <div className="driver-selection-card__team">{driver.team}</div>
          </div>
          {isMyTurn && !isDisabled && !isSelected && (
            <div className="driver-selection-card__action">
              <button
                className="driver-selection-card__select-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(driver);
                }}
                aria-label={`Select ${driver.name}`}
              >
                Select
              </button>
            </div>
          )}
          {isSelected && (
            <div className="driver-selection-card__status-badge">
              Selected
            </div>
          )}
        </div>

        <div className="driver-selection-card__stats">
          <div className="driver-selection-card__stat">
            <span className="driver-selection-card__stat-label">Price:</span>
            <span className="driver-selection-card__stat-value">
              ${driver.price}M
            </span>
          </div>
          <div className="driver-selection-card__stat">
            <span className="driver-selection-card__stat-label">Total Pts:</span>
            <span className="driver-selection-card__stat-value">
              {driver.total_points}
            </span>
          </div>
          <div className="driver-selection-card__stat">
            <span className="driver-selection-card__stat-label">Avg Pts:</span>
            <span className="driver-selection-card__stat-value">
              {driver.average_points.toFixed(1)}
            </span>
          </div>
        </div>

        {isExpanded && !isDisabled && (
          <div className="driver-selection-card__details">
            <div className="driver-selection-card__country">
              <span className="driver-selection-card__detail-label">
                Country:
              </span>
              <span className="driver-selection-card__detail-value">
                {driver.country}
              </span>
            </div>
            <div className="driver-selection-card__team-code">
              <span className="driver-selection-card__detail-label">
                Team Code:
              </span>
              <span className="driver-selection-card__detail-value">
                {driver.team_code}
              </span>
            </div>
            {driver.recent_results.length > 0 && (
              <div className="driver-selection-card__recent-results">
                <h4 className="driver-selection-card__section-title">
                  Recent Results
                </h4>
                <table className="driver-selection-card__results-table">
                  <thead>
                    <tr>
                      <th>Race</th>
                      <th>Position</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {driver.recent_results.map((result) => (
                      <tr key={result.race_id}>
                        <td>{result.race_name}</td>
                        <td>{result.position > 0 ? result.position : "DNF"}</td>
                        <td>{result.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!isDisabled && !isSelected && (
          <div className="driver-selection-card__expand-hint">
            {isExpanded ? "Click to collapse" : "Click to expand details"}
          </div>
        )}
      </div>
    );
  };

  return renderCard();
};

export default DriverSelectionCard;
