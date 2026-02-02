import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDraftStatus, getDraftPicks } from '../services/draftService';
import type { DraftStatus, DraftPick } from '../types';
import { useAuth } from '../context/AuthContext';
import { MobileNav } from '../components/MobileNav';

export default function DraftStatus() {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [draftStatus, setDraftStatus] = useState<DraftStatus | null>(null);
  const [recentPicks, setRecentPicks] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Determine race ID - for now, we'll use a default or get from URL params
  // In a real app, this would come from the league's current/upcoming race
  const raceId = 1; // TODO: Get this from league data or URL params

  useEffect(() => {
    if (!leagueId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [statusData, picksData] = await Promise.all([
          getDraftStatus(leagueId, raceId),
          getDraftPicks(leagueId, raceId),
        ]);
        setDraftStatus(statusData);
        setRecentPicks(picksData.draft_picks.slice(-5)); // Get last 5 picks
        setError(null);
      } catch (err) {
        setError('Failed to load draft status');
        console.error('Error fetching draft status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchData, 5000);

    return () => clearInterval(interval);
  }, [leagueId, raceId]);

  const isMyTurn = draftStatus?.current_team?.user_id === user?.id;
  const totalPicks = draftStatus?.total_teams ? draftStatus.total_teams * 5 : 0; // 5 drivers per team
  const progressPercentage = draftStatus ? (draftStatus.total_picks_made / totalPicks) * 100 : 0;
  const picksRemaining = totalPicks - (draftStatus?.total_picks_made || 0);

  if (loading) {
    return (
    <>
      <MobileNav />
      <div className="page-container">
        <div className="loading">Loading draft status...</div>
      </div>
    </>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  if (!draftStatus) {
    return (
      <div className="page-container">
        <div className="error-message">Draft status not available</div>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="draft-status-container">
        {/* Header */}
        <div className="draft-status-header">
          <h1>Draft Status</h1>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            Back to League
          </button>
        </div>

        {/* Draft Complete Indicator */}
        {draftStatus.is_draft_complete ? (
          <div className="draft-complete-banner">
            <h2>🎉 Draft Complete!</h2>
            <p>All teams have completed their picks.</p>
          </div>
        ) : (
          <>
            {/* Your Turn Indicator */}
            {isMyTurn && (
              <div className="your-turn-banner">
                <h2>🏁 It's Your Turn!</h2>
                <p>You are on the clock. Make your pick now!</p>
                <button
                  onClick={() => navigate(`/leagues/${leagueId}/make-draft-pick`)}
                  className="btn btn-primary"
                >
                  Make Your Pick
                </button>
              </div>
            )}

            {/* Current Draft Info */}
            <div className="draft-info-card">
              <div className="draft-info-grid">
                <div className="draft-info-item">
                  <label>Current Round</label>
                  <span className="draft-info-value">{draftStatus.current_round} / 5</span>
                </div>
                <div className="draft-info-item">
                  <label>Current Position</label>
                  <span className="draft-info-value">
                    {draftStatus.current_position} / {draftStatus.total_teams}
                  </span>
                </div>
                <div className="draft-info-item">
                  <label>Team on Clock</label>
                  <span className="draft-info-value">
                    {draftStatus.current_team?.name || 'Unknown'}
                  </span>
                </div>
                <div className="draft-info-item">
                  <label>Draft Method</label>
                  <span className="draft-info-value capitalize">
                    {draftStatus.draft_method}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="draft-progress-section">
              <div className="progress-header">
                <h3>Draft Progress</h3>
                <span className="progress-percentage">
                  {progressPercentage.toFixed(1)}% Complete
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="progress-stats">
                <span>{draftStatus.total_picks_made} picks made</span>
                <span>{picksRemaining} picks remaining</span>
              </div>
            </div>

            {/* Recently Drafted Players */}
            <div className="recent-picks-section">
              <h3>Recently Drafted</h3>
              {recentPicks.length > 0 ? (
                <div className="recent-picks-list">
                  {recentPicks.slice().reverse().map((pick) => (
                    <div key={pick.id} className="recent-pick-item">
                      <div className="pick-info">
                        <span className="pick-round">Round {pick.round}</span>
                        <span className="pick-number">Pick #{pick.pick_number}</span>
                      </div>
                      <div className="pick-details">
                        <span className="pick-driver">{pick.driver_name}</span>
                        <span className="pick-team">{pick.team_name}</span>
                      </div>
                      {pick.is_auto_pick && <span className="auto-pick-badge">Auto</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-picks-message">No picks made yet</p>
              )}
            </div>
          </>
        )}

        {/* Draft Summary */}
        <div className="draft-summary-section">
          <h3>Draft Summary</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <label>Total Teams</label>
              <span>{draftStatus.total_teams}</span>
            </div>
            <div className="summary-item">
              <label>Total Picks Made</label>
              <span>{draftStatus.total_picks_made}</span>
            </div>
            <div className="summary-item">
              <label>Status</label>
              <span className={draftStatus.is_draft_complete ? 'status-complete' : 'status-active'}>
                {draftStatus.is_draft_complete ? 'Complete' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}