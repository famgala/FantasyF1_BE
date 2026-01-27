import React from "react";
import "./DriverFilter.scss";

export interface DriverFilterOptions {
  status: "all" | "active" | "reserve" | "retired";
  team?: string;
  sortBy: "name" | "points" | "average" | "price";
  sortOrder: "asc" | "desc";
}

interface DriverFilterProps {
  filterOptions: DriverFilterOptions;
  onFilterChange: (options: DriverFilterOptions) => void;
  teams: string[];
}

const DriverFilter: React.FC<DriverFilterProps> = ({
  filterOptions,
  onFilterChange,
  teams,
}) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filterOptions,
      status: e.target.value as DriverFilterOptions["status"],
    });
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const team = e.target.value;
    onFilterChange({
      ...filterOptions,
      team: team === "all" ? undefined : team,
    });
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filterOptions,
      sortBy: e.target.value as DriverFilterOptions["sortBy"],
    });
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filterOptions,
      sortOrder: e.target.value as DriverFilterOptions["sortOrder"],
    });
  };

  const handleReset = () => {
    onFilterChange({
      status: "all",
      team: undefined,
      sortBy: "name",
      sortOrder: "asc",
    });
  };

  return (
    <div className="driver-filter">
      <div className="filter-header">
        <h2>Filter Drivers</h2>
        <button
          type="button"
          className="reset-button"
          onClick={handleReset}
          aria-label="Reset filters"
        >
          Reset
        </button>
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={filterOptions.status}
            onChange={handleStatusChange}
            aria-label="Filter by driver status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="reserve">Reserve</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="team-filter">Team</label>
          <select
            id="team-filter"
            value={filterOptions.team || "all"}
            onChange={handleTeamChange}
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

        <div className="filter-group">
          <label htmlFor="sort-by-filter">Sort By</label>
          <select
            id="sort-by-filter"
            value={filterOptions.sortBy}
            onChange={handleSortByChange}
            aria-label="Sort drivers by"
          >
            <option value="name">Name</option>
            <option value="points">Total Points</option>
            <option value="average">Average Points</option>
            <option value="price">Price</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-order-filter">Order</label>
          <select
            id="sort-order-filter"
            value={filterOptions.sortOrder}
            onChange={handleSortOrderChange}
            aria-label="Sort order"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default DriverFilter;
