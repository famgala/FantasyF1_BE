import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RaceResult, getRaceResults } from "../../services/raceResultsService";
import { CardSkeleton, TableSkeleton } from "../loading";

import "./RaceResults.scss";

interface RaceResultsProps {
  raceId?: string;
}

const RaceResults: React.FC<RaceResultsProps> = ({ raceId: propRaceId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const raceId = propRaceId || params.raceId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [raceName, setRaceName] = useState<string>("");
  const [circuitName, setCircuitName] = useState<string>("");
  const [raceDate, setRaceDate] = useState<string>("");
  const [results, setResults] = useState<RaceResult[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof RaceResult>("position");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (raceId) {
      fetchRaceResults();
    }
  }, [raceId]);

  const fetchRaceResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRaceResults(raceId!);
      setRaceName(data.race_name);
      setCircuitName(data.circuit_name);
      setRaceDate(data.date);
      setResults(data.results);
    } catch (err) {
      console.error("Error fetching race results:", err);
      setError("Failed to load race results. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: keyof RaceResult) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let aValue = a[sortColumn];
    let bValue = b[sortColumn];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getSortIcon = (column: keyof RaceResult) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  if (loading) {
    return (
      <div className="race-results race-results--loading">
        <div className="race-results__header-skeleton">
          <CardSkeleton />
        </div>
        <div className="race-results__table-skeleton">
          <TableSkeleton rowCount={10} columnCount={7} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="race-results race-results--error">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchRaceResults} className="retry-button">
            Try Again
          </button>
          <button onClick={() => navigate(-1)} className="back-button">
            Back
          </button>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="race-results race-results--empty">
        <div className="empty-message">
          <p>Results not yet available for this race.</p>
          <button onClick={() => navigate(-1)} className="back-button">
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="race-results">
      <div className="race-results__header">
        <h2 className="race-results__title">{raceName}</h2>
        <p className="race-results__subtitle">
          {circuitName} - {formatDate(raceDate)}
        </p>
      </div>

      <div className="race-results__table-container">
        <table className="race-results__table">
          <thead>
            <tr>
              <th onClick={() => handleSort("position")} className="sortable">
                Pos{getSortIcon("position")}
              </th>
              <th onClick={() => handleSort("points_earned")} className="sortable">
                Driver{getSortIcon("points_earned")}
              </th>
              <th>Team</th>
              <th onClick={() => handleSort("grid_position")} className="sortable">
                Grid{getSortIcon("grid_position")}
              </th>
              <th onClick={() => handleSort("laps_completed")} className="sortable">
                Laps{getSortIcon("laps_completed")}
              </th>
              <th onClick={() => handleSort("points_earned")} className="sortable">
                Pts{getSortIcon("points_earned")}
              </th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result) => (
              <tr 
                key={result.driver.id} 
                className={result.dnf_status ? "race-results__row--dnf" : ""}
                onClick={() => navigate(`/drivers/${result.driver.id}`)}
              >
                <td className="race-results__position">
                  <span className={`position-badge position-badge--${result.position}`}>
                    {result.position}
                  </span>
                  {result.fastest_lap && (
                    <span className="fastest-lap-indicator" title="Fastest Lap">
                      ⚡
                    </span>
                  )}
                </td>
                <td className="race-results__driver">
                  <span className="driver-number">#{result.driver.number}</span>
                  <span className="driver-name">{result.driver.name}</span>
                </td>
                <td className="race-results__team">{result.driver.team_name}</td>
                <td className="race-results__grid">{result.grid_position}</td>
                <td className="race-results__laps">{result.laps_completed}</td>
                <td className="race-results__points">{result.points_earned}</td>
                <td className="race-results__time">
                  {result.dnf_status ? (
                    <span className="dnf-status" title={result.dnf_reason}>
                      {result.dnf_status}
                    </span>
                  ) : result.position === 1 ? (
                    result.time || "N/A"
                  ) : (
                    result.time_delta || "N/A"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="race-results__footer">
        <button onClick={() => navigate(-1)} className="back-button">
          Back to Race Details
        </button>
      </div>
    </div>
  );
};

export default RaceResults;
