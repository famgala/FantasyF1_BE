import React, { useState } from "react";
import { ScoringData, DriverScoring } from "../../services/scoringService";
import ScoringRules from "./ScoringRules";
import "./ScoringView.scss";

interface ScoringViewProps {
  scoringData: ScoringData;
  onDriverClick?: (driverId: number) => void;
}

/**
 * ScoringView Component
 * 
 * Displays comprehensive scoring information for a constructor/team
 * Shows per-race breakdown with drafted drivers, positions, and points
 */
export const ScoringView: React.FC<ScoringViewProps> = ({
  scoringData,
  onDriverClick,
}) => {
  const { constructor_name, username, season_total_points, race_scores } = scoringData;

  const [showRules, setShowRules] = useState(false);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDriverRow = (driver: DriverScoring, index: number) => {
    const positionText = driver.is_dnf
      ? "DNF"
      : driver.finishing_position === 0
      ? "N/A"
      : `P${driver.finishing_position}`;

    const positionClass = driver.is_dnf
      ? "position-dnf"
      : driver.finishing_position <= 3
      ? "position-podium"
      : "position-normal";

    return (
      <tr key={`${driver.driver_id}-${index}`} className="driver-row">
        <td className="driver-name" onClick={() => onDriverClick?.(driver.driver_id)}>
          <span className="driver-number">#{driver.driver_number}</span>
          <span className="driver-names">{driver.driver_name}</span>
        </td>
        <td className="driver-team">{driver.team}</td>
        <td className={`driver-position ${positionClass}`}>{positionText}</td>
        <td className="driver-points">{driver.points_earned} pts</td>
      </tr>
    );
  };

  const getRaceCard = (race: ScoringData["race_scores"][0], index: number) => {
    return (
      <div key={race.race_id} className="race-score-card">
        <div className="race-header">
          <div className="race-info">
            <h3 className="race-name">{race.race_name}</h3>
            <span className="race-round">Round {race.round_number}</span>
          </div>
          <div className="race-date">{formatDate(race.race_date)}</div>
          <div className="race-total-points">{race.total_points} pts</div>
        </div>

        <div className="race-drivers-table">
          <table>
            <thead>
              <tr>
                <th>Driver</th>
                <th>Team</th>
                <th>Position</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {race.drivers.map((driver, driverIndex) =>
                getDriverRow(driver, driverIndex)
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (race_scores.length === 0) {
    return (
      <div className="scoring-view">
        <div className="scoring-empty">
          <div className="empty-icon">📊</div>
          <h3>No Scoring Data Available</h3>
          <p>
            Scoring data will appear here after races are completed and results are
            finalized.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scoring-view">
      <div className="scoring-header">
        <div className="team-info">
          <h2 className="team-name">{constructor_name}</h2>
          <p className="team-owner">Owned by {username}</p>
        </div>
        <div className="season-total">
          <span className="total-label">Season Total</span>
          <span className="total-points">{season_total_points} pts</span>
        </div>
      </div>

      <div className="scoring-controls">
        <button className="toggle-rules-btn" onClick={() => setShowRules(!showRules)}>
          {showRules ? "Hide Rules" : "View Scoring Rules"}
        </button>
      </div>

      {showRules && <ScoringRules />}

      <div className="scoring-legend">
        <div className="legend-item">
          <span className="legend-indicator podium"></span>
          <span className="legend-label">Podium Finish (1-3)</span>
        </div>
        <div className="legend-item">
          <span className="legend-indicator dnf"></span>
          <span className="legend-label">Did Not Finish (DNF)</span>
        </div>
      </div>

      <div className="race-scores-list">
        {race_scores.map((race, index) => getRaceCard(race, index))}
      </div>
    </div>
  );
};
