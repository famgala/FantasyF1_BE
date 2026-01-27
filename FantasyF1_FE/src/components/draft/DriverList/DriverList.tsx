import React, { useState, useMemo, useEffect } from "react";
import { Driver } from "../../../services/draftService";
import DriverSelectionCard from "../DriverSelectionCard";
import "./DriverList.scss";

/**
 * Sort options for driver list
 */
export type SortOption = "name" | "points" | "price" | "team" | "average";

/**
 * Props for DriverList component
 */
export interface DriverListProps {
  drivers: Driver[];
  draftedDriverIds: number[];
  isMyTurn: boolean;
  myPicksCount: number;
  maxPicks: number;
  onDriverSelect: (driver: Driver) => void;
}

/**
 * DriverList component
 * Provides sorting, filtering, and search functionality for driver selection
 */
const DriverList: React.FC<DriverListProps> = ({
  drivers,
  draftedDriverIds,
  isMyTurn,
  myPicksCount,
  maxPicks,
  onDriverSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("points");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Extract unique teams from drivers
  const teams = useMemo(() => {
    const teamSet = new Set(drivers.map((d) => d.team));
    return Array.from(teamSet).sort();
  }, [drivers]);

  // Filter and sort drivers
  const filteredAndSortedDrivers = useMemo(() => {
    let result = [...drivers];

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(
        (driver) =>
          driver.name.toLowerCase().includes(searchLower) ||
          driver.team.toLowerCase().includes(searchLower) ||
          driver.number.toString().includes(searchLower)
      );
    }

    // Filter by team
    if (selectedTeam !== "all") {
      result = result.filter((driver) => driver.team === selectedTeam);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "points":
          comparison = a.total_points - b.total_points;
          break;
        case "price":
          comparison = a.price - b.price;
          break;
        case "team":
          comparison = a.team.localeCompare(b.team);
          break;
        case "average":
          comparison = a.average_points - b.average_points;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [drivers, searchTerm, selectedTeam, sortBy, sortOrder]);

  // Reset filters when drivers change
  useEffect(() => {
    setSearchTerm("");
    setSelectedTeam("all");
  }, [drivers]);

  // Handle sort change
  const handleSortChange = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if same sort option
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc"); // Default to descending for most meaningful sorts
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedTeam("all");
    setSortBy("points");
    setSortOrder("desc");
  };

  const disablePicking = !isMyTurn || myPicksCount >= maxPicks;

  return (
    <div className="driver-list">
      {/* Header with search and filters */}
      <div className="driver-list__header">
        <h3 className="driver-list__title">
          Available Drivers
          <span className="driver-list__count">
            ({filteredAndSortedDrivers.length})
          </span>
        </h3>
        <div className="driver-list__picks-info">
          <span className="driver-list__picks-count">
            Your Picks: {myPicksCount}/{maxPicks}
          </span>
          {myPicksCount >= maxPicks && (
            <span className="driver-list__picks-complete">
              Draft Complete
            </span>
          )}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="driver-list__controls">
        <div className="driver-list__search">
          <input
            type="text"
            className="driver-list__search-input"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search drivers"
          />
        </div>

        <div className="driver-list__filters">
          <div className="driver-list__filter">
            <label
              htmlFor="team-filter"
              className="driver-list__filter-label"
            >
              Team:
            </label>
            <select
              id="team-filter"
              className="driver-list__filter-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              aria-label="Filter by team"
            >
              <option value="all">All Teams</option>
              {teams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
          </div>

          <div className="driver-list__sort">
            <label htmlFor="sort-by" className="driver-list__sort-label">
              Sort by:
            </label>
            <select
              id="sort-by"
              className="driver-list__sort-select"
              value={sortBy}
              onChange={(e) =>
                handleSortChange(e.target.value as SortOption)
              }
              aria-label="Sort drivers"
            >
              <option value="points">Total Points</option>
              <option value="average">Average Points</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
              <option value="team">Team</option>
            </select>
            <button
              className="driver-list__sort-toggle"
              onClick={() =>
                setSortOrder(sortOrder === "asc" ? "desc" : "asc")
              }
              aria-label={`Sort ${
                sortOrder === "asc" ? "descending" : "ascending"
              }`}
              type="button"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>

          {(searchTerm || selectedTeam !== "all") && (
            <button
              className="driver-list__clear-filters"
              onClick={handleClearFilters}
              type="button"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Status message when not your turn */}
      {!isMyTurn && (
        <div className="driver-list__status driver-list__status--not-turn">
          <span className="driver-list__status-icon">⏳</span>
          <span className="driver-list__status-text">
            Waiting for your turn
          </span>
        </div>
      )}

      {/* Status message when max picks reached */}
      {isMyTurn && myPicksCount >= maxPicks && (
        <div className="driver-list__status driver-list__status--complete">
          <span className="driver-list__status-icon">✓</span>
          <span className="driver-list__status-text">
            You have selected all {maxPicks} drivers
          </span>
        </div>
      )}

      {/* Driver Grid */}
      {filteredAndSortedDrivers.length > 0 ? (
        <div className="driver-list__grid">
          {filteredAndSortedDrivers.map((driver) => {
            const isDrafted = draftedDriverIds.includes(driver.id);
            const isSelected = false; // Will be updated from draft room data

            return (
              <DriverSelectionCard
                key={driver.id}
                driver={driver}
                isDisabled={isDrafted || disablePicking}
                isSelected={isSelected}
                isMyTurn={isMyTurn && !isDrafted && !disablePicking}
                onSelect={onDriverSelect}
              />
            );
          })}
        </div>
      ) : (
        <div className="driver-list__empty">
          <p className="driver-list__empty-text">
            {searchTerm || selectedTeam !== "all"
              ? "No drivers match your filters"
              : "No drivers available"}
          </p>
          {(searchTerm || selectedTeam !== "all") && (
            <button
              className="driver-list__clear-button"
              onClick={handleClearFilters}
              type="button"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverList;
