import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DriverCard, { Driver as DriverCardType } from "../../components/drivers/DriverCard";
import DriverFilter, { DriverFilterOptions } from "../../components/drivers/DriverFilter";
import driverService, { Driver } from "../../services/driverService";
import "./DriverListPage.scss";

const DriverListPage: React.FC = () => {
  const { status } = useParams<{ status?: string }>();
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<DriverFilterOptions>({
    status: "all",
    team: undefined,
    sortBy: "name",
    sortOrder: "asc",
  });

  // Get unique teams from drivers
  const teams = useMemo(() => {
    const uniqueTeams = new Set<string>();
    drivers.forEach((driver) => {
      if (driver.team) {
        uniqueTeams.add(driver.team);
      }
    });
    return Array.from(uniqueTeams).sort();
  }, [drivers]);

  // Load drivers
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await driverService.getAllDrivers();
        setDrivers(data);

        // Set initial filter from URL if present
        if (status) {
          setFilterOptions((prev) => ({
            ...prev,
            status: status as any,
          }));
        }
      } catch (err) {
        setError("Failed to load drivers. Please try again later.");
        console.error("Error loading drivers:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDrivers();
  }, [status]);

  // Filter and sort drivers
  const filteredDrivers = useMemo(() => {
    let result = [...drivers];

    // Apply status filter
    if (filterOptions.status !== "all") {
      result = result.filter((driver) => driver.status === filterOptions.status);
    }

    // Apply team filter
    if (filterOptions.team) {
      result = result.filter((driver) => driver.team === filterOptions.team);
    }

    // Apply sorting
    result.sort((a, b) => {
      let compareValue = 0;

      switch (filterOptions.sortBy) {
        case "name":
          compareValue = a.full_name.localeCompare(b.full_name);
          break;
        case "points":
          compareValue = (a.total_points || 0) - (b.total_points || 0);
          break;
        case "average":
          compareValue = (a.average_points || 0) - (b.average_points || 0);
          break;
        case "price":
          compareValue = (a.price || 0) - (b.price || 0);
          break;
      }

      return filterOptions.sortOrder === "desc" ? -compareValue : compareValue;
    });

    return result;
  }, [drivers, filterOptions]);

  // Handle filter change
  const handleFilterChange = (newFilterOptions: DriverFilterOptions) => {
    setFilterOptions(newFilterOptions);

    // Update URL
    const searchParams = new URLSearchParams();
    if (newFilterOptions.status !== "all") {
      navigate(`/drivers/${newFilterOptions.status}`);
    } else {
      navigate("/drivers");
    }
  };

  // Handle driver card click
  const handleDriverClick = (driverId: number) => {
    navigate(`/drivers/${driverId}`);
  };

  // Get status text
  const getStatusText = () => {
    switch (filterOptions.status) {
      case "active":
        return "Active Drivers";
      case "reserve":
        return "Reserve Drivers";
      case "retired":
        return "Retired Drivers";
      default:
        return "All Drivers";
    }
  };

  if (loading) {
    return (
      <div className="driver-list-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading drivers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="driver-list-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-list-page">
      <div className="page-header">
        <h1>{getStatusText()}</h1>
        <p className="subtitle">
          Browse the complete list of F1 drivers and their statistics
        </p>
      </div>

      <DriverFilter
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        teams={teams}
      />

      <div className="results-info">
        <p>Showing {filteredDrivers.length} driver(s)</p>
      </div>

      {filteredDrivers.length === 0 ? (
        <div className="no-results">
          <p>No drivers match your current filters.</p>
          <button
            className="reset-filters-button"
            onClick={() =>
              handleFilterChange({
                status: "all",
                team: undefined,
                sortBy: "name",
                sortOrder: "asc",
              })
            }
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="drivers-grid">
          {filteredDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver as DriverCardType}
              onClick={() => handleDriverClick(driver.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverListPage;
