import React, { useState } from "react";
import "./ScoringRules.scss";

interface PositionPoints {
  position: number;
  points: number;
}

const ScoringRules: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"table" | "examples">("table");

  // Inverted position scoring system
  const scoringData: PositionPoints[] = [
    { position: 1, points: 1 },
    { position: 2, points: 2 },
    { position: 3, points: 3 },
    { position: 4, points: 4 },
    { position: 5, points: 5 },
    { position: 6, points: 6 },
    { position: 7, points: 7 },
    { position: 8, points: 8 },
    { position: 9, points: 9 },
    { position: 10, points: 10 },
    { position: 11, points: 9 },
    { position: 12, points: 8 },
    { position: 13, points: 7 },
    { position: 14, points: 6 },
    { position: 15, points: 5 },
    { position: 16, points: 4 },
    { position: 17, points: 3 },
    { position: 18, points: 2 },
    { position: 19, points: 1 },
    { position: 20, points: 1 },
  ];

  const examples = [
    {
      scenario: "Perfect Selection",
      description: "You select two drivers who finish 10th and 9th in the race",
      calculation: "10 points (10th place) + 10 points (9th place) = 20 points",
      total: 20,
    },
    {
      scenario: "Mixed Performance",
      description: "You select drivers who finish 1st and 15th",
      calculation: "1 point (1st place) + 6 points (15th place) = 7 points",
      total: 7,
    },
    {
      scenario: "DNF Situation",
      description: "One driver finishes 8th, the other DNF (Did Not Finish)",
      calculation: "7 points (8th place) + 0 points (DNF) = 7 points",
      total: 7,
    },
    {
      scenario: "Strategy Pick",
      description: "Selecting drivers fighting for mid-pack positions (11th & 12th)",
      calculation: "9 points (11th place) + 8 points (12th place) = 17 points",
      total: 17,
    },
  ];

  return (
    <div className="scoring-rules">
      <div className="scoring-rules__header">
        <h2 className="scoring-rules__title">Scoring Rules</h2>
        <p className="scoring-rules__subtitle">
          Learn how fantasy points are calculated in Fantasy F1
        </p>
      </div>

      <div className="scoring-rules__tabs">
        <button
          className={`scoring-rules__tab ${
            activeTab === "table" ? "scoring-rules__tab--active" : ""
          }`}
          onClick={() => setActiveTab("table")}
        >
          Points Table
        </button>
        <button
          className={`scoring-rules__tab ${
            activeTab === "examples" ? "scoring-rules__tab--active" : ""
          }`}
          onClick={() => setActiveTab("examples")}
        >
          Examples
        </button>
      </div>

      <div className="scoring-rules__content">
        {activeTab === "table" && (
          <div className="scoring-rules__table-section">
            <div className="scoring-rules__explanation">
              <h3>How Inverted Scoring Works</h3>
              <p>
                In Fantasy F1, we use an <strong>inverted position scoring system</strong>.
                Unlike real F1 where finishing 1st earns the most points, in Fantasy
                F1, finishing <strong>10th position</strong> earns the maximum{" "}
                <strong>10 points</strong>.
              </p>
              <p>
                The scoring pattern mirrors outward from 10th place - 9th and 11th
                earn 9 points, 8th and 12th earn 8 points, and so on. First and
                19th/20th positions earn only 1 point.
              </p>
              <div className="scoring-rules__highlight">
                <strong>Strategic Tip:</strong> This system rewards predicting
                mid-pack battles and choosing drivers who will finish in the
                8th-12th positions, rather than just picking the race winner!
              </div>
            </div>

            <div className="scoring-rules__table-container">
              <table className="scoring-rules__table">
                <thead>
                  <tr>
                    <th>Position</th>
                    <th>Points</th>
                    <th>Position</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {scoringData.slice(0, 10).map((row) => {
                    const opposite = scoringData[20 - row.position];
                    return (
                      <tr
                        key={row.position}
                        className={
                          row.position === 10
                            ? "scoring-rules__row--highlight"
                            : ""
                        }
                      >
                        <td>{row.position}</td>
                        <td
                          className={`scoring-rules__points scoring-rules__points--${row.points}`}
                        >
                          {row.points}
                        </td>
                        <td className="scoring-rules__separator">|</td>
                        <td>{opposite.position}</td>
                        <td
                          className={`scoring-rules__points scoring-rules__points--${opposite.points}`}
                        >
                          {opposite.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="scoring-rules__special-cases">
              <h4>Special Cases</h4>
              <ul>
                <li>
                  <strong>DNF (Did Not Finish):</strong> Drivers who do not complete
                  the race earn <strong>0 points</strong>
                </li>
                <li>
                  <strong>DSQ (Disqualified):</strong> Disqualified drivers earn{" "}
                  <strong>0 points</strong>
                </li>
                <li>
                  <strong>DNS (Did Not Start):</strong> Drivers who do not start the
                  race earn <strong>0 points</strong>
                </li>
                <li>
                  <strong>Maximum Points:</strong> The maximum points per driver is{" "}
                  <strong>10 points</strong> (for 10th place)
                </li>
                <li>
                  <strong>Team Maximum:</strong> Each team selects 2 drivers per race,
                  so the maximum team points per race is <strong>20 points</strong>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "examples" && (
          <div className="scoring-rules__examples-section">
            <h3>Scoring Examples</h3>
            <p className="scoring-rules__examples-intro">
              Here are some examples to help you understand how the scoring works in
              practice. In each race, you select 2 drivers for your team.
            </p>

            <div className="scoring-rules__examples-list">
              {examples.map((example, index) => (
                <div key={index} className="scoring-rules__example-card">
                  <div className="scoring-rules__example-header">
                    <h4 className="scoring-rules__example-title">
                      {example.scenario}
                    </h4>
                    <div
                      className={`scoring-rules__example-total scoring-rules__example-total--${
                        example.total >= 15 ? "high" : example.total >= 10 ? "medium" : "low"
                      }`}
                    >
                      {example.total} pts
                    </div>
                  </div>
                  <p className="scoring-rules__example-description">
                    {example.description}
                  </p>
                  <div className="scoring-rules__example-calculation">
                    <span className="scoring-rules__calc-label">Calculation:</span>{" "}
                    {example.calculation}
                  </div>
                </div>
              ))}
            </div>

            <div className="scoring-rules__strategy-tips">
              <h4>Strategy Tips</h4>
              <ul>
                <li>
                  <strong>Avoid the extremes:</strong> Drivers finishing 1st or 20th
                  earn only 1 point. Look for drivers likely to finish in the
                  8th-12th range.
                </li>
                <li>
                  <strong>Consider reliability:</strong> A reliable driver who
                  consistently finishes 8th-10th is more valuable than a fast driver
                  who risks DNF.
                </li>
                <li>
                  <strong>Track characteristics:</strong> Some tracks have more
                  chaotic racing with unpredictable finishing positions.
                </li>
                <li>
                  <strong>Team orders:</strong> Consider team dynamics where one
                  driver might be favored over another.
                </li>
                <li>
                  <strong>Weather conditions:</strong> Rain races often have
                  unexpected finishing positions - great opportunities for strategic
                  picks.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoringRules;
