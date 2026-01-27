import React, { useState, useEffect } from "react";
import { Race } from "../../../services/raceService";
import { RaceCard } from "../RaceCard";
import "./RaceCalendar.scss";

interface RaceCalendarProps {
  races: Race[];
  loading?: boolean;
  error?: string | null;
  onYearChange?: (year: number) => void;
  currentYear?: number;
}

/**
 * RaceCalendar component
 * Displays a calendar of races for a season
 */
const RaceCalendar: React.FC<RaceCalendarProps> = ({
  races,
  loading = false,
  error = null,
  onYearChange,
  currentYear = new Date().getFullYear(),
}) => {
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRaces = races.filter((race) => {
    // Status filter
    if (filterStatus === "upcoming" && race.status !== "upcoming") return false;
    if (filterStatus === "completed" && race.status !== "completed") return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        race.name.toLowerCase().includes(query) ||
        race.country.toLowerCase().includes(query) ||
        race.circuit.toLowerCase().includes(query) ||
        (race.city && race.city.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // Find the next upcoming race
  const nextRace = races.find((race) => {
    const raceDate = new Date(race.race_date);
    const now = new Date();
    return raceDate > now && race.status !== "completed" && race.status !== "cancelled";
  });

  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  if (loading) {
    return (
      <div className="race-calendar race-calendar--loading">
        <div className="race-calendar__skeleton race-calendar__skeleton--header" />
        <div className="race-calendar__skeleton race-calendar__skeleton--filters" />
        <div className="race-calendar__skeleton race-calendar__skeleton--grid" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="race-calendar race-calendar--error">
        <div className="race-calendar__error">
          <h3>Error Loading Races</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="race-calendar">
      <div className="race-calendar__header">
        <h1 className="race-calendar__title">F1 Race Calendar {currentYear}</h1>
        {filteredRaces.length > 0 && (
          <p className="race-calendar__subtitle">
            {filteredRaces.length} race{filteredRaces.length !== 1 ? "s" : ""} available
          </p>
        )}
      </div>

      <div className="race-calendar__controls">
        <div className="race-calendar__filters">
          <div className="race-calendar__filter-group">
            <label className="race-calendar__filter-label">Status:</label>
            <select
              className="race-calendar__filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="all">All Races</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="race-calendar__filter-group">
            <label className="race-calendar__filter-label">Year:</label>
            <select
              className="race-calendar__filter-select"
              value={currentYear}
              onChange={(e) => onYearChange?.(parseInt(e.target.value))}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className="race-calendar__search">
            <input
              type="text"
              className="race-calendar__search-input"
              placeholder="Search races..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {(filterStatus !== "all" || searchQuery) && (
          <button
            className="race-calendar__clear-filters"
            onClick={() => {
              setFilterStatus("all");
              setSearchQuery("");
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {filteredRaces.length === 0 ? (
        <div className="race-calendar__empty">
          <p className="race-calendar__empty-text">
            {searchQuery || filterStatus !== "all"
              ? "No races match your filters. Try adjusting your search or filter criteria."
              : "No races available for this season."}
          </p>
        </div>
      ) : (
        <div className="race-calendar__grid">
          {filteredRaces.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              isNext={nextRace?.id === race.id}
            />
          ))}
        </div>
      )}

      {nextRace && filterStatus !== "completed" && (
        <div className="race-calendar__next-race-banner">
          <span className="race-calendar__next-race-icon">🏁</span>
          <div className="race-calendar__next-race-text">
            Next Race: <strong>{nextRace.name}</strong> on{" "}
            {new Date(nextRace.race_date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RaceCalendar;
