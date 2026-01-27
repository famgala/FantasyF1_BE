import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import driverService, { Driver, DriverStats } from "../../services/driverService";
import "./DriverProfilePage.scss";

const DriverProfilePage: React.FC = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(
    new Date().getFullYear()
  );

  useEffect(() => {
    const loadDriverData = async () => {
      if (!driverId) return;

      try {
        setLoading(true);
        setError(null);

        // Load driver details
        const driverData = await driverService.getDriverById(parseInt(driverId));
        setDriver(driverData);

        // Load driver stats for selected season
        const statsData = await driverService.getDriverStats(
          parseInt(driverId),
          selectedSeason
        );
        setStats(statsData);
      } catch (err) {
        setError("Failed to load driver data. Please try again later.");
        console.error("Error loading driver data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDriverData();
  }, [driverId, selectedSeason]);

  const handleSeasonChange = (season: number) => {
    setSelectedSeason(season);
  };

  const getDriverStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <span className="badge badge-success">Active</span>;
      case "reserve":
        return <span className="badge badge-warning">Reserve</span>;
      case "retired":
        return <span className="badge badge-secondary">Retired</span>;
      default:
        return null;
    }
  };

  const getSeasons = () => {
    const currentYear = new Date().getFullYear();
    const seasons: number[] = [];
    for (let year = currentYear; year >= currentYear - 5; year--) {
      seasons.push(year);
    }
    return seasons;
  };

  if (loading) {
    return (
      <div className="driver-profile-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading driver profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="driver-profile-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
          <button className="back-button" onClick={() => navigate("/drivers")}>
            Back to Drivers
          </button>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="driver-profile-page">
        <div className="error-container">
          <p className="error-message">Driver not found.</p>
          <button className="back-button" onClick={() => navigate("/drivers")}>
            Back to Drivers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-profile-page">
      <div className="page-header">
        <button className="back-button" onClick={() => navigate("/drivers")}>
          ← Back to Drivers
        </button>
        <h1>
          #{driver.number} {driver.first_name} {driver.last_name}
        </h1>
        {getDriverStatusBadge(driver.status)}
      </div>

      <div className="profile-content">
        <div className="driver-info-card">
          <div className="driver-header">
            <div className="driver-avatar">
              <span className="driver-number">{driver.number}</span>
            </div>
            <div className="driver-details">
              <h2 className="driver-name">
                {driver.first_name} {driver.last_name}
              </h2>
              <div className="driver-meta">
                {driver.team && <span className="driver-team">{driver.team}</span>}
                {driver.country && (
                  <span className="driver-country">{driver.country}</span>
                )}
              </div>
            </div>
          </div>

          <div className="career-stats">
            <h3>Career Statistics</h3>
            <div className="stats-grid">
              {driver.championships !== undefined && (
                <div className="stat-item">
                  <span className="stat-value">{driver.championships}</span>
                  <span className="stat-label">Championships</span>
                </div>
              )}
              {driver.wins !== undefined && (
                <div className="stat-item">
                  <span className="stat-value">{driver.wins}</span>
                  <span className="stat-label">Wins</span>
                </div>
              )}
              {driver.podiums !== undefined && (
                <div className="stat-item">
                  <span className="stat-value">{driver.podiums}</span>
                  <span className="stat-label">Podiums</span>
                </div>
              )}
              {driver.total_points !== undefined && (
                <div className="stat-item">
                  <span className="stat-value">{driver.total_points}</span>
                  <span className="stat-label">Total Points</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="season-stats-card">
          <div className="season-selector">
            <h3>Season {selectedSeason} Statistics</h3>
            <div className="season-buttons">
              {getSeasons().map((season) => (
                <button
                  key={season}
                  className={`season-button ${
                    selectedSeason === season ? "active" : ""
                  }`}
                  onClick={() => handleSeasonChange(season)}
                >
                  {season}
                </button>
              ))}
            </div>
          </div>

          {stats ? (
            <div className="season-stats">
              <div className="stats-grid">
                <div className="stat-item stat-primary">
                  <span className="stat-value">{stats.total_points}</span>
                  <span className="stat-label">Total Points</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.average_points.toFixed(2)}</span>
                  <span className="stat-label">Average Points</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.races_completed}</span>
                  <span className="stat-label">Races Completed</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.best_finish}</span>
                  <span className="stat-label">Best Finish</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.wins}</span>
                  <span className="stat-label">Wins</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.podiums}</span>
                  <span className="stat-label">Podiums</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.dnfs}</span>
                  <span className="stat-label">DNFs</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-stats">
              <p>No statistics available for the {selectedSeason} season.</p>
            </div>
          )}
        </div>
      </div>

      {driver.price && (
        <div className="fantasy-info-card">
          <h3>Fantasy Information</h3>
          <div className="fantasy-stats">
            <div className="stat-item">
              <span className="stat-value">${driver.price}M</span>
              <span className="stat-label">Current Price</span>
            </div>
            {driver.average_points && (
              <div className="stat-item">
                <span className="stat-value">
                  ${driver.average_points.toFixed(2)}M
                </span>
                <span className="stat-label">Value per Point</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfilePage;
