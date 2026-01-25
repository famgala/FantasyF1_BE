import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./LeagueStandingsPage.scss";

/**
 * LeagueStandingsPage Component
 *
 * Detailed standings view showing overall season standings and per-race breakdowns.
 * Displays rank, rank change indicators, team name, username, total points,
 * and points per race. Allows filtering by race and CSV export for managers.
 */

interface Constructor {
  id: string;
  team_name: string;
  username: string;
  is_manager: boolean;
  total_points: number;
  rank: number;
  rank_change: "up" | "down" | "same" | number;
}

interface Race {
  id: string;
  name: string;
  round_number: number;
  is_completed: boolean;
}

interface LeagueStandingsData {
  league_id: string;
  league_name: string;
  league_code: string;
  is_manager: boolean;
  constructors: Constructor[];
  races: Race[];
  overall_totals: Constructor[];
  current_race_id: string | null;
}

const LeagueStandingsPage: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<LeagueStandingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof Constructor>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Fetch league standings data
  const fetchStandingsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual API
      // const response = await api.get(`/leagues/${leagueId}/leaderboard`);
      // setData(response.data);

      // Mock data for simulation
      const mockData: LeagueStandingsData = {
        league_id: leagueId || "1",
        league_name: "F1 Fantasy Champions",
        league_code: "F1CHAMP",
        is_manager: true,
        constructors: [
          {
            id: "c1",
            team_name: "Red Bull Dash",
            username: "SpeedDemon",
            is_manager: true,
            total_points: 0,
            rank: 1,
            rank_change: "up",
          },
          {
            id: "c2",
            team_name: "Ferrari Fanatics",
            username: "TifosoPro",
            is_manager: false,
            total_points: 0,
            rank: 2,
            rank_change: 2,
          },
          {
            id: "c3",
            team_name: "Mercedes Magic",
            username: "SilverArrow",
            is_manager: false,
            total_points: 0,
            rank: 3,
            rank_change: "down",
          },
          {
            id: "c4",
            team_name: "McLaren Masters",
            username: "PapayaOrange",
            is_manager: false,
            total_points: 0,
            rank: 4,
            rank_change: "same",
          },
          {
            id: "c5",
            team_name: "Aston Acceleration",
            username: "GreenMachine",
            is_manager: false,
            total_points: 0,
            rank: 5,
            rank_change: 1,
          },
        ],
        races: [
          {
            id: "r1",
            name: "Australian Grand Prix",
            round_number: 1,
            is_completed: true,
          },
          {
            id: "r2",
            name: "Saudi Arabian Grand Prix",
            round_number: 2,
            is_completed: true,
          },
          {
            id: "r3",
            name: "Japanese Grand Prix",
            round_number: 3,
            is_completed: true,
          },
          {
            id: "r4",
            name: "Chinese Grand Prix",
            round_number: 4,
            is_completed: false,
          },
          {
            id: "r5",
            name: "Miami Grand Prix",
            round_number: 5,
            is_completed: false,
          },
        ],
        overall_totals: [
          {
            id: "c1",
            team_name: "Red Bull Dash",
            username: "SpeedDemon",
            is_manager: true,
            total_points: 142,
            rank: 1,
            rank_change: "up",
          },
          {
            id: "c2",
            team_name: "Ferrari Fanatics",
            username: "TifosoPro",
            is_manager: false,
            total_points: 128,
            rank: 2,
            rank_change: 2,
          },
          {
            id: "c3",
            team_name: "Mercedes Magic",
            username: "SilverArrow",
            is_manager: false,
            total_points: 115,
            rank: 3,
            rank_change: "down",
          },
          {
            id: "c4",
            team_name: "McLaren Masters",
            username: "PapayaOrange",
            is_manager: false,
            total_points: 98,
            rank: 4,
            rank_change: "same",
          },
          {
            id: "c5",
            team_name: "Aston Acceleration",
            username: "GreenMachine",
            is_manager: false,
            total_points: 87,
            rank: 5,
            rank_change: 1,
          },
        ],
        current_race_id: "r4",
      };

      setData(mockData);
    } catch (err) {
      setError("Failed to load standings data. Please try again.");
      console.error("Error fetching standings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leagueId) {
      fetchStandingsData();
    }
  }, [leagueId]);

  const handleRaceFilterChange = (raceId: string | null) => {
    setSelectedRaceId(raceId);
  };

  const handleSort = (column: keyof Constructor) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleExportCSV = () => {
    if (!data) return;

    // Generate CSV content
    const csvContent = [
      ["Rank", "Rank Change", "Team Name", "Username", "Total Points"].join(","),
      ...getSortedConstructors().map(
        (c) =>
          `${c.rank},"${getRankChangeDisplay(c.rank_change)}","${c.team_name}","${c.username}",${c.total_points}`
      ),
    ].join("\n");

    // Create and download blob
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.league_name}-standings.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Standings exported successfully!");
  };

  const getSortedConstructors = (): Constructor[] => {
    if (!data) return [];

    let constructors = selectedRaceId
      ? data.constructors.map((c) => ({
          ...c,
          // In real implementation, fetch race-specific points
          ...(data.overall_totals.find((ot) => ot.id === c.id) || {}),
        }))
      : data.overall_totals;

    return constructors.sort((a, b) => {
      let aVal, bVal;

      if (sortColumn === "rank") {
        aVal = a.rank;
        bVal = b.rank;
      } else if (sortColumn === "total_points") {
        aVal = a.total_points;
        bVal = b.total_points;
      } else {
        aVal = a[sortColumn];
        bVal = b[sortColumn];
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getRankChangeDisplay = (change: Constructor["rank_change"]): string => {
    if (change === "up") return "↑ 1";
    if (change === "down") return "↓ 1";
    if (change === "same") return "−";
    return `↑ ${change}`;
  };

  const getRankChangeClass = (change: Constructor["rank_change"]): string => {
    if (change === "up" || (typeof change === "number" && change > 0)) {
      return "rank-change--up";
    }
    if (change === "down") {
      return "rank-change--down";
    }
    return "rank-change--same";
  };

  if (loading) {
    return (
      <div className="league-standings-page league-standings-page--loading">
        <div className="skeleton skeleton--header" />
        <div className="skeleton skeleton--filter" />
        <div className="skeleton skeleton--table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="league-standings-page league-standings-page--error">
        <div className="error-container">
          <h2>Error Loading Standings</h2>
          <p>{error}</p>
          <button className="btn btn--primary" onClick={fetchStandingsData}>
            Try Again
          </button>
          <button className="btn btn--outline" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const constructors = getSortedConstructors();
  const selectedRace = data.races.find((r) => r.id === selectedRaceId);

  return (
    <div className="league-standings-page">
      {/* Header */}
      <header className="standings-header">
        <div className="standings-header__content">
          <h1 className="standings-header__title">
            <button
              className="back-button"
              onClick={() => navigate(`/league/${leagueId}`)}
            >
              ←
            </button>
            League Standings
          </h1>
          <p className="standings-header__subtitle">{data.league_name}</p>
        </div>
        {data.is_manager && (
          <div className="standings-header__actions">
            <button className="btn btn--secondary" onClick={handleExportCSV}>
              <span className="btn__icon">📊</span>
              Export CSV
            </button>
          </div>
        )}
      </header>

      {/* Filter Section */}
      <div className="standings-filter-section">
        <div className="filter-controls">
          <label className="filter-label" htmlFor="race-filter">
            Filter by Race:
          </label>
          <select
            id="race-filter"
            className="filter-select"
            value={selectedRaceId || ""}
            onChange={(e) => handleRaceFilterChange(e.target.value || null)}
          >
            <option value="">Overall Standings</option>
            {data.races.map((race) => (
              <option key={race.id} value={race.id}>
                Round {race.round_number}: {race.name}
                {race.is_completed ? " (Completed)" : " (Upcoming)"}
              </option>
            ))}
          </select>
          {selectedRace && (
            <button onClick={() => handleRaceFilterChange(null)}>
              Clear Filter
            </button>
          )}
        </div>

        {selectedRace && (
          <div className="filter-indicator">
            <span className="filter-indicator__text">
              Showing standings for: {selectedRace.name}
            </span>
          </div>
        )}
      </div>

      {/* Standings Table */}
      <div className="standings-table-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th
                className="standings-table__header standings-table__header--rank"
                onClick={() => handleSort("rank")}
              >
                Rank
                {sortColumn === "rank" && (
                  <span className="sort-indicator">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th className="standings-table__header standings-table__header--change">
                Change
              </th>
              <th
                className="standings-table__header standings-table__header--team"
                onClick={() => handleSort("team_name")}
              >
                Team Name
                {sortColumn === "team_name" && (
                  <span className="sort-indicator">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              <th
                className="standings-table__header standings-table__header--username"
                onClick={() => handleSort("username")}
              >
                Manager
                {sortColumn === "username" && (
                  <span className="sort-indicator">{sortDirection === "asc" ? "↑" : "↓"}</span>
                )}
              </th>
              {selectedRace ? (
                <th
                  className="standings-table__header standings-table__header--race-points"
                  onClick={() => handleSort("total_points")}
                >
                  Race Points
                  {sortColumn === "total_points" && (
                    <span className="sort-indicator">{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ) : (
                <th
                  className="standings-table__header standings-table__header--total-points"
                  onClick={() => handleSort("total_points")}
                >
                  Total Points
                  {sortColumn === "total_points" && (
                    <span className="sort-indicator">{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {constructors.map((constructor) => (
              <tr key={constructor.id} className="standings-table__row">
                <td className="standings-table__cell standings-table__cell--rank">
                  {constructor.rank === 1 && (
                    <span className="rank-badge rank-badge--gold">1</span>
                  )}
                  {constructor.rank === 2 && (
                    <span className="rank-badge rank-badge--silver">2</span>
                  )}
                  {constructor.rank === 3 && (
                    <span className="rank-badge rank-badge--bronze">3</span>
                  )}
                  {constructor.rank > 3 && (
                    <span className="rank-badge rank-badge--default">{constructor.rank}</span>
                  )}
                </td>
                <td className="standings-table__cell standings-table__cell--change">
                  <span className={`rank-change ${getRankChangeClass(constructor.rank_change)}`}>
                    {getRankChangeDisplay(constructor.rank_change)}
                  </span>
                </td>
                <td className="standings-table__cell standings-table__cell--team">
                  <div className="team-info">
                    <span className="team-info__name">{constructor.team_name}</span>
                    {constructor.is_manager && (
                      <span className="manager-badge">⭐ Manager</span>
                    )}
                  </div>
                </td>
                <td className="standings-table__cell standings-table__cell--username">
                  {constructor.username}
                </td>
                <td className="standings-table__cell standings-table__cell--points">
                  {constructor.total_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {constructors.length === 0 && (
        <div className="empty-state">
          <h3>No Standings Data</h3>
          <p>
            {selectedRace
              ? "No draft data available for this race yet."
              : "No standings data available yet."}
          </p>
          <button className="btn btn--primary" onClick={() => handleRaceFilterChange(null)}>
            View Overall Standings
          </button>
        </div>
      )}

      {/* Info Section */}
      <div className="standings-info">
        <h3>Understanding the Standings</h3>
        <ul className="info-list">
          <li>
            <strong>Rank:</strong> Current position in the standings
          </li>
          <li>
            <strong>Change:</strong> Movement since last race (↑ up, ↓ down, − same)
          </li>
          <li>
            <strong>Team Name:</strong> Your constructor team name
          </li>
          <li>
            <strong>Manager:</strong> Username of the team manager
          </li>
          <li>
            <strong>Points:</strong>
            {selectedRace
              ? " Points earned during this specific race"
              : " Total points accumulated across all races"}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LeagueStandingsPage;
