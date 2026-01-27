import React, { useState, useEffect } from "react";
import { RaceCalendar } from "../components/raceCalendar/RaceCalendar";
import { raceService } from "../services/raceService";
import { Race } from "../services/raceService";
import "./RaceCalendarPage.scss";

/**
 * Race Calendar Page
 * Displays the complete F1 race calendar for the selected season
 */
const RaceCalendarPage: React.FC = () => {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRaces(selectedYear);
  }, [selectedYear]);

  const fetchRaces = async (year: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await raceService.getRacesByYear(year);
      setRaces(data);
    } catch (err) {
      console.error("Error fetching races:", err);
      setError("Failed to load race calendar. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  return (
    <div className="race-calendar-page">
      <RaceCalendar
        races={races}
        loading={loading}
        error={error}
        onYearChange={handleYearChange}
        currentYear={selectedYear}
      />
    </div>
  );
};

export default RaceCalendarPage;
