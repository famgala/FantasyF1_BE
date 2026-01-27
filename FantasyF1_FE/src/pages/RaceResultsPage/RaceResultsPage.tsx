import React from "react";
import RaceResults from "../../components/raceResults/RaceResults";
import "./RaceResultsPage.scss";

const RaceResultsPage: React.FC = () => {
  return (
    <div className="race-results-page">
      <RaceResults />
    </div>
  );
};

export default RaceResultsPage;
