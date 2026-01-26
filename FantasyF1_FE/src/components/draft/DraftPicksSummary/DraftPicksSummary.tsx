import React from "react";
import "./DraftPicksSummary.scss";

/**
 * Props for DraftPicksSummary component
 */
export interface DraftPicksSummaryProps {
  raceName: string;
  picks: Array<{
    id: string;
    constructorName: string;
    ownerUsername: string;
    pickNumber: number;
    driverName: string;
    driverNumber: number;
    teamName: string;
    timestamp: string;
  }>;
}

/**
 * Format timestamp to local time
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * DraftPicksSummary component
 * Displays final draft picks after draft closes
 */
const DraftPicksSummary: React.FC<DraftPicksSummaryProps> = ({
  raceName,
  picks,
}) => {
  if (!picks || picks.length === 0) {
    return (
      <div className="draft-picks-summary draft-picks-summary--empty">
        <h3 className="draft-picks-summary__title">
          {raceName} Draft Picks
        </h3>
        <p className="draft-picks-summary__message">
          No draft picks available yet.
        </p>
      </div>
    );
  }

  // Group picks by constructor
  const picksByConstructor = picks.reduce((acc, pick) => {
    const key = pick.constructorName;
    if (!acc[key]) {
      acc[key] = {
        constructorName: pick.constructorName,
        ownerUsername: pick.ownerUsername,
        picks: [],
      };
    }
    acc[key].picks.push(pick);
    return acc;
  }, {} as Record<string, any>);

  const constructorEntries = Object.entries(picksByConstructor).sort(
    (a, b) => (a[1].constructorName || "ZZZ").localeCompare(b[1].constructorName || "ZZZ")
  );

  return (
    <div className="draft-picks-summary">
      <div className="draft-picks-summary__header">
        <h3 className="draft-picks-summary__title">
          {raceName} Draft Results
        </h3>
        <span className="draft-picks-summary__count">
          {picks.length} picks
        </span>
      </div>

      <div className="draft-picks-summary__content">
        {constructorEntries.map(([_, data], index) => (
          <div
            key={index}
            className="draft-picks-summary__constructor"
          >
            <div className="draft-picks-summary__constructor-header">
              <h4 className="draft-picks-summary__constructor-name">
                {data.constructorName}
              </h4>
              <span className="draft-picks-summary__constructor-owner">
                Owner: @({data.ownerUsername})
              </span>
            </div>

            <div className="draft-picks-summary__picks">
              {data.picks.map((pick: any) => (
                <div
                  key={pick.id}
                  className="draft-picks-summary__pick"
                >
                  <div className="draft-picks-summary__pick-number">
                    #{pick.pickNumber}
                  </div>
                  <div className="draft-picks-summary__pick-driver">
                    <div className="draft-picks-summary__driver-name">
                      {pick.driverName}
                    </div>
                    <div className="draft-picks-summary__driver-team">
                      {pick.teamName}
                    </div>
                  </div>
                  <div className="draft-picks-summary__pick-info">
                    <div className="draft-picks-summary__driver-number">
                      {pick.driverNumber}
                    </div>
                    <div className="draft-picks-summary__pick-time">
                      {formatTimestamp(pick.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DraftPicksSummary;
