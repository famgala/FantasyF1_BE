import React from "react";
import "./DriverCard.scss";

export interface Driver {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  number: number;
  team?: string;
  country?: string;
  status: "active" | "reserve" | "retired";
  total_points?: number;
  average_points?: number;
  price?: number;
  championships?: number;
  wins?: number;
  podiums?: number;
}

interface DriverCardProps {
  driver: Driver;
  onClick: (driver: Driver) => void;
}

const DriverCard: React.FC<DriverCardProps> = ({ driver, onClick }) => {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "status-active";
      case "reserve":
        return "status-reserve";
      case "retired":
        return "status-retired";
      default:
        return "";
    }
  };

  const formatPoints = (points?: number) => {
    return points !== undefined ? points.toFixed(1) : "-";
  };

  const formatAverage = (average?: number) => {
    return average !== undefined ? average.toFixed(2) : "-";
  };

  return (
    <div
      className="driver-card"
      onClick={() => onClick(driver)}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick(driver);
        }
      }}
      aria-label={`View ${driver.full_name}'s profile`}
    >
      <div className="driver-card-header">
        <div className="driver-number">{driver.number}</div>
        <div className={`driver-status-badge ${getStatusBadgeClass(driver.status)}`}>
          {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
        </div>
      </div>

      <div className="driver-card-body">
        <h3 className="driver-name">{driver.full_name}</h3>

        {driver.team && (
          <div className="driver-team">
            <span className="team-label">Team:</span>
            <span className="team-value">{driver.team}</span>
          </div>
        )}

        {driver.country && (
          <div className="driver-country">
            <span className="flag-icon" role="img" aria-label={driver.country}>
              🏁
            </span>
            <span className="country-value">{driver.country}</span>
          </div>
        )}
      </div>

      <div className="driver-card-stats">
        <div className="stat-item">
          <span className="stat-label">Total Points</span>
          <span className="stat-value">{formatPoints(driver.total_points)}</span>
        </div>

        <div className="stat-item">
          <span className="stat-label">Average Pts</span>
          <span className="stat-value">{formatAverage(driver.average_points)}</span>
        </div>

        {driver.price !== undefined && (
          <div className="stat-item">
            <span className="stat-label">Price</span>
            <span className="stat-value">{driver.price.toFixed(1)}M</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverCard;
