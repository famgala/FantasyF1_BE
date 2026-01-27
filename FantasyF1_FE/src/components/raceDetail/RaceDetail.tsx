import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { raceService, Race } from "../../services/raceService";
import "./RaceDetail.scss";

interface RaceDetailProps {
  raceId?: number;
}

const RaceDetail: React.FC<RaceDetailProps> = ({ raceId: propRaceId }) => {
  const params = useParams();
  const navigate = useNavigate();
  const raceId = propRaceId || parseInt(params.raceId || "0");

  const [race, setRace] = useState<Race | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRaceDetails();
  }, [raceId]);

  const fetchRaceDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await raceService.getRaceById(raceId);
      setRace(data);
    } catch (err) {
      setError("Failed to load race details");
      console.error("Error fetching race details:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getCountdown = (raceDate: string) => {
    const now = new Date();
    const race = new Date(raceDate);
    const diff = race.getTime() - now.getTime();

    if (diff <= 0) return "Race started";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="race-detail">
        <div className="skeleton skeleton-header" />
        <div className="skeleton skeleton-info" />
        <div className="skeleton skeleton-details" />
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="race-detail">
        <div className="error-message">
          <p>{error || "Race not found"}</p>
          <button onClick={() => navigate("/races")} className="btn-back">
            Back to Races
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="race-detail">
      <div className="race-detail-header">
        <button onClick={() => navigate("/races")} className="btn-back">
          ← Back to Calendar
        </button>
        <div className={`status-badge ${race.status.toLowerCase()}`}>
          {race.status.replace("_", " ").toUpperCase()}
        </div>
      </div>

      <h1 className="race-title">{race.race_name}</h1>

      <div className="race-info-grid">
        <div className="info-card">
          <h3>Circuit</h3>
          <p className="circuit-name">{race.circuit_name}</p>
          <p className="location">
            {race.locality}, {race.country}
          </p>
        </div>

        <div className="info-card">
          <h3>Round</h3>
          <p className="round-number">{race.round_number}</p>
        </div>

        <div className="info-card">
          <h3>Laps</h3>
          <p className="laps-count">{race.laps}</p>
        </div>
      </div>

      <div className="race-timing">
        {race.status === "upcoming" && (
          <div className="countdown-box">
            <h3>Race starts in</h3>
            <p className="countdown">{getCountdown(race.race_date)}</p>
          </div>
        )}

        <div className="date-box">
          <h3>Race Date</h3>
          <p className="race-date">{formatDateTime(race.race_date)}</p>
        </div>

        {race.qualifying_date && (
          <div className="date-box">
            <h3>Qualifying</h3>
            <p className="qualifying-date">{formatDateTime(race.qualifying_date)}</p>
          </div>
        )}
      </div>

      <div className="race-actions">
        {race.status === "completed" && (
          <button
            onClick={() => navigate(`/races/${raceId}/results`)}
            className="btn-primary btn-results"
          >
            View Results
          </button>
        )}

        {race.status === "upcoming" && (
          <button
            onClick={() => navigate(`/leagues/1/races/${raceId}/draft`)}
            className="btn-primary btn-draft"
          >
            Enter Draft
          </button>
        )}

        {race.status === "cancelled" && (
          <div className="cancelled-message">
            This race has been cancelled.
          </div>
        )}
      </div>
    </div>
  );
};

export default RaceDetail;
