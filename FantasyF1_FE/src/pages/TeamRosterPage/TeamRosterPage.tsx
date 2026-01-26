import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getTeamRoster, DriverPick, RaceRoster, TeamRosterData } from "../../services/leagueService";

import "./TeamRosterPage.scss";

/**
 * TeamRosterPage Component
 *
 * View a constructor's drafted drivers for each race.
 * Features:
 * - Team name and owner information
 * - Season total points display
 * - Per-race breakdown with drafted drivers
 * - Points earned per driver per race
 * - Draft order indicators (1st pick, 2nd pick)
 * - Links to driver profiles
 * - Status indicators for races (completed, current, upcoming)
 */

type SortField = "date" | "points" | "race_name";
type SortOrder = "asc" | "desc";

/**
 * Main Team Roster Page Component
 */
const TeamRosterPage: React.FC = () => {
  const { leagueId, teamId } = useParams<{
    leagueId: string;
    teamId: string;
  }>();
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data
  const [teamData, setTeamData] = useState<TeamRosterData | null>(null);
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Modal states
  const [selectedDriver, setSelectedDriver] = useState<DriverPick | null>(null);
  const [selectedRace, setSelectedRace] = useState<RaceRoster | null>(null);

  /**
   * Fetch team roster data on mount
   */
  useEffect(() => {
    fetchTeamRoster();
  }, [leagueId, teamId]);

  /**
   * Fetch team roster data from API
   */
  const fetchTeamRoster = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call real API
      const response = await getTeamRoster(leagueId!, teamId!);
      setTeamData(response);
    } catch (err) {
      setError("Failed to load team roster. Please try again.");
      toast.error("Failed to load team roster");
      console.error("Error fetching team roster:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sort races based on selected field and order
   */
  const getSortedRaces = () => {
    if (!teamData) return [];

    return [...teamData.races].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.race_date).getTime() - new Date(b.race_date).getTime();
          break;
        case "points":
          comparison = a.total_points - b.total_points;
          break;
        case "race_name":
          comparison = a.race_name.localeCompare(b.race_name);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  };

  /**
   * Handle sort field change
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /**
   * Get race status badge class
   */
  const getRaceStatusClass = (status: string): string => {
    switch (status) {
      case "upcoming":
        return "status-badge--upcoming";
      case "upcoming_draft":
        return "status-badge--upcoming-draft";
      case "drafting":
        return "status-badge--drafting";
      case "completed":
        return "status-badge--completed";
      default:
        return "";
    }
  };

  /**
   * Get pick order badge class
   */
  const getPickOrderClass = (order: 1 | 2): string => {
    return order === 1 ? "pick-badge--first" : "pick-badge--second";
  };

  /**
   * Get driver status badge class
   */
  const getDriverStatusClass = (status: string): string => {
    switch (status) {
      case "active":
        return "driver-status--active";
      case "dnf":
        return "driver-status--dnf";
      case "dsq":
        return "driver-status--dsq";
      case "dns":
        return "driver-status--dns";
      case "placeholder":
        return "driver-status--placeholder";
      case "pending":
        return "driver-status--pending";
      default:
        return "";
    }
  };

  /**
   * Get driver status text
   */
  const getDriverStatusText = (status: string): string => {
    switch (status) {
      case "active":
        return "";
      case "dnf":
        return "DNF";
      case "dsq":
        return "DSQ";
      case "dns":
        return "DNS";
      case "placeholder":
        return "TBD";
      case "pending":
        return "Drafting";
      default:
        return status;
    }
  };

  /**
   * Open driver detail modal
   */
  const openDriverModal = (driver: DriverPick, race: RaceRoster) => {
    setSelectedDriver(driver);
    setSelectedRace(race);
  };

  /**
   * Close modal
   */
  const closeModal = () => {
    setSelectedDriver(null);
    setSelectedRace(null);
  };

  /**
   * Navigate to driver profile
   */
  const navigateToDriverProfile = (driverId: string) => {
    navigate(`/drivers/${driverId}`);
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="team-roster-page team-roster-page--loading">
        <div className="skeleton skeleton--header" />
        <div className="skeleton skeleton--stats" />
        <div className="skeleton skeleton--table" />
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="team-roster-page team-roster-page--error">
        <div className="error-container">
          <h2>Unable to Load Team Roster</h2>
          <p>{error}</p>
          <button className="btn btn--primary" onClick={fetchTeamRoster}>
            Try Again
          </button>
          <button
            className="btn btn--outline"
            onClick={() => navigate(`/dashboard/league/${leagueId}`)}
          >
            Back to League
          </button>
        </div>
      </div>
    );
  }

  const sortedRaces = getSortedRaces();

  return (
    <div className="team-roster-page">
      {/* Header Section */}
      <div className="roster-header">
        <div className="roster-header__content">
          <button
            className="back-button"
            onClick={() => navigate(`/dashboard/league/${leagueId}`)}
            aria-label="Back to league dashboard"
          >
            ←
          </button>
          <div>
            <h1 className="roster-header__title">{teamData?.team_name}</h1>
            <p className="roster-header__subtitle">
              Owned by: {teamData?.owner_username}
            </p>
          </div>
        </div>

        <div className="roster-header__stats">
          <div className="stat-card">
            <div className="stat-card__label">Total Points</div>
            <div className="stat-card__value">{teamData?.season_total_points}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card__label">League Rank</div>
            <div className="stat-card__value">
              {teamData?.rank_in_league ? `#${teamData.rank_in_league}` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="roster-intro">
        <p className="roster-intro__text">
          View {teamData?.team_name}'s complete season roster breakdown.
          See which drivers were drafted for each race and the points earned
          using inverted position scoring.
        </p>
      </div>

      {/* Legend */}
      <div className="roster-legend">
        <div className="legend-item">
          <span className="legend-badge legend-badge--first">1st</span>
          <span className="legend-text">First Pick</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge legend-badge--second">2nd</span>
          <span className="legend-text">Second Pick</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge legend-badge--points">Pts</span>
          <span className="legend-text">Points Earned</span>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="roster-controls">
        <div className="sort-controls">
          <span className="sort-controls__label">Sort by:</span>
          <button
            className={`sort-button ${
              sortField === "date" ? "sort-button--active" : ""
            }`}
            onClick={() => handleSort("date")}
          >
            Date
            {sortField === "date" && (
              <span className="sort-indicator">
                {sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
          <button
            className={`sort-button ${
              sortField === "points" ? "sort-button--active" : ""
            }`}
            onClick={() => handleSort("points")}
          >
            Points
            {sortField === "points" && (
              <span className="sort-indicator">
                {sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
          <button
            className={`sort-button ${
              sortField === "race_name" ? "sort-button--active" : ""
            }`}
            onClick={() => handleSort("race_name")}
          >
            Race Name
            {sortField === "race_name" && (
              <span className="sort-indicator">
                {sortOrder === "asc" ? "↑" : "↓"}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Races List */}
      <div className="roster-list">
        {sortedRaces.length === 0 ? (
          <div className="empty-state">
            <h3 className="empty-state__title">No Race Data Available</h3>
            <p className="empty-state__description">
              Race roster information will appear here once available.
            </p>
          </div>
        ) : (
          sortedRaces.map((race) => (
            <div key={race.race_id} className="race-card">
              {/* Race Header */}
              <div className="race-card__header">
                <div className="race-card__info">
                  <div className="race-card__name">
                    Round {race.round_number}: {race.race_name}
                  </div>
                  <div className="race-card__details">
                    <span className="race-card__circuit">{race.circuit_name}</span>
                    <span className="race-card__date">{formatDate(race.race_date)}</span>
                  </div>
                </div>
                <div className="race-card__meta">
                  <span
                    className={`status-badge ${getRaceStatusClass(race.status)}`}
                  >
                    {race.status === "upcoming"
                      ? "Upcoming"
                      : race.status === "upcoming_draft"
                      ? "Draft Opens Soon"
                      : race.status === "drafting"
                      ? "Drafting Now"
                      : "Completed"}
                  </span>
                  {race.status === "completed" && (
                    <div className="race-card__points">
                      <span className="race-card__points-label">Race Points:</span>
                      <span className="race-card__points-value">{race.total_points}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Drivers List */}
              <div className="race-card__drivers">
                {race.drivers.length === 0 ? (
                  <div className="empty-drivers">
                    {race.status === "upcoming" ? (
                      <p className="empty-drivers__text">Race upcoming - not yet drafted</p>
                    ) : race.status === "upcoming_draft" ? (
                      <p className="empty-drivers__text">
                        Draft window opening soon - awaiting driver selections
                      </p>
                    ) : race.status === "drafting" ? (
                      <p className="empty-drivers__text">Draft in progress - awaiting picks</p>
                    ) : (
                      <p className="empty-drivers__text">No draft data available</p>
                    )}
                  </div>
                ) : (
                  race.drivers.map((driver) => (
                    <div
                      key={driver.driver_id}
                      className={`driver-row ${getDriverStatusClass(driver.status)}`}
                      onClick={() => openDriverModal(driver, race)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openDriverModal(driver, race);
                        }
                      }}
                    >
                      {/* Pick Order Badge */}
                      <div className="driver-row__badge">
                        <span
                          className={`pick-badge ${getPickOrderClass(driver.pick_order)}`}
                        >
                          {driver.pick_order}st
                        </span>
                      </div>

                      {/* Driver Info */}
                      <div className="driver-row__info">
                        <div className="driver-row__name">{driver.driver_name}</div>
                        <div className="driver-row__details">
                          <span className="driver-row__number">
                            #{driver.driver_number}
                          </span>
                          <span className="driver-row__team">{driver.team}</span>
                          <span className={`driver-status ${getDriverStatusClass(driver.status)}`}>
                            {getDriverStatusText(driver.status)}
                          </span>
                        </div>
                      </div>

                      {/* Performance Stats */}
                      <div className="driver-row__performance">
                        {driver.status === "active" ? (
                          <>
                            <div className="driver-row__finish">
                              <span className="driver-row__finish-label">Finish:</span>
                              <span className="driver-row__finish-value">
                                {driver.finish_position === 1
                                  ? "1st"
                                  : driver.finish_position === 2
                                  ? "2nd"
                                  : driver.finish_position === 3
                                  ? "3rd"
                                  : `${driver.finish_position}th`}
                              </span>
                            </div>
                            <div className="driver-row__points">
                              <span className="driver-row__points-label">Points:</span>
                              <span className="driver-row__points-value">
                                {driver.points_earned}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="driver-row__status">
                            {getDriverStatusText(driver.status)}
                          </div>
                        )}
                      </div>

                      {/* Link Indicator */}
                      <div className="driver-row__link">
                        <span className="arrow-icon">→</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Driver Detail Modal */}
      {selectedDriver && selectedRace && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal__header">
              <h3 className="modal__title">Driver Details</h3>
              <button
                className="modal__close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className="modal__body">
              <div className="driver-detail">
                <div className="driver-detail__header">
                  <h4 className="driver-detail__name">{selectedDriver.driver_name}</h4>
                  <span className="driver-detail__number">
                    #{selectedDriver.driver_number}
                  </span>
                </div>

                <div className="driver-detail__row">
                  <span className="driver-detail__label">Team:</span>
                  <span className="driver-detail__value">{selectedDriver.team}</span>
                </div>

                <div className="driver-detail__row">
                  <span className="driver-detail__label">Race:</span>
                  <span className="driver-detail__value">{selectedRace.race_name}</span>
                </div>

                <div className="driver-detail__row">
                  <span className="driver-detail__label">Pick Order:</span>
                  <span className="driver-detail__value">
                    {selectedDriver.pick_order === 1 ? "First Pick" : "Second Pick"}
                  </span>
                </div>

                {selectedDriver.status === "active" ? (
                  <>
                    <div className="driver-detail__row">
                      <span className="driver-detail__label">Finishing Position:</span>
                      <span className="driver-detail__value">
                        {selectedDriver.finish_position === 1
                          ? "1st"
                          : selectedDriver.finish_position === 2
                          ? "2nd"
                          : selectedDriver.finish_position === 3
                          ? "3rd"
                          : `${selectedDriver.finish_position}th`}
                      </span>
                    </div>

                    <div className="driver-detail__row driver-detail__row--highlight">
                      <span className="driver-detail__label">Points Earned:</span>
                      <span className="driver-detail__value driver-detail__value--points">
                        {selectedDriver.points_earned}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="driver-detail__row">
                    <span className="driver-detail__label">Status:</span>
                    <span className={`driver-detail__value ${getDriverStatusClass(selectedDriver.status)}`}>
                      {getDriverStatusText(selectedDriver.status)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal__footer">
              <button className="btn btn--outline" onClick={closeModal}>
                Close
              </button>
              <button
                className="btn btn--primary"
                onClick={() => navigateToDriverProfile(selectedDriver.driver_id)}
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamRosterPage;
