import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ScoringView } from "../../components/scoring/ScoringView";
import { getConstructorScoring, ScoringData } from "../../services/scoringService";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute/ProtectedRoute";
import { CardSkeleton } from "../../components/loading";

import "./ScoringPage.scss";

/**
 * ScoringPage Component
 * 
 * Displays scoring information for a constructor/team
 * Supports viewing scoring via URL parameters or from navigation
 */
const ScoringContent: React.FC = () => {
  const { constructorId } = useParams<{ constructorId: string }>();
  const navigate = useNavigate();
  const [scoringData, setScoringData] = useState<ScoringData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScoring = async () => {
      if (!constructorId) {
        setError("Constructor ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const id = parseInt(constructorId, 10);
        
        if (isNaN(id)) {
          setError("Invalid constructor ID");
          setLoading(false);
          return;
        }

        const data = await getConstructorScoring(id);
        setScoringData(data);
      } catch (err) {
        console.error("Failed to fetch scoring data:", err);
        setError("Failed to load scoring data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchScoring();
  }, [constructorId]);

  const handleDriverClick = (driverId: number) => {
    // Navigate to driver profile page when implemented
    console.log(`Navigating to driver ${driverId}`);
    // navigate(`/drivers/${driverId}`);
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="scoring-page">
        <div className="page-header-skeleton">
          <CardSkeleton />
        </div>
        <div className="scoring-skeleton">
          <CardSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scoring-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Scoring</h3>
          <p>{error}</p>
          <button className="back-button" onClick={handleBackClick}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!scoringData) {
    return (
      <div className="scoring-page">
        <div className="error-container">
          <div className="error-icon">📊</div>
          <h3>No Scoring Data</h3>
          <p>No scoring data available for this constructor.</p>
          <button className="back-button" onClick={handleBackClick}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scoring-page">
      <div className="page-header">
        <button className="back-button" onClick={handleBackClick}>
          ← Back
        </button>
        <h1 className="page-title">Team Scoring</h1>
      </div>
      <ScoringView scoringData={scoringData} onDriverClick={handleDriverClick} />
    </div>
  );
};

/**
 * ScoringPage wrapper with ProtectedRoute
 */
export const ScoringPage: React.FC = () => {
  return (
    <ProtectedRoute>
      <ScoringContent />
    </ProtectedRoute>
  );
};
