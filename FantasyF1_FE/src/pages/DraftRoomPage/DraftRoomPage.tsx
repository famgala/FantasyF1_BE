import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getDraftRoom, makePick, Driver, DraftStatus } from "../../services/draftService";
import DraftTimer from "../../components/draft/DraftTimer";
import DriverList from "../../components/draft/DriverList";
import DraftOrderList from "../../components/draft/DraftOrderList";
import { DraftHistory } from "../../components/draft/DraftHistory";
import { DraftParticipant } from "../../services/draftService";
import { CardSkeleton, ListSkeleton, LoadingSpinner, LoadingOverlay } from "../../components/loading";
import "./DraftRoomPage.scss";

/**
 * DraftRoomPage component
 * Main draft room interface for selecting drivers
 */
const DraftRoomPage: React.FC = () => {
  const { leagueId, raceId } = useParams<{ leagueId: string; raceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [draftData, setDraftData] = useState<{
    race_id: number;
    race_name: string;
    circuit: string;
    race_date: string;
    league_id: number;
    league_name: string;
    draft_order: any[];
    available_drivers: Driver[];
    drafted_drivers: any[];
    status: DraftStatus;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch draft room data
  const fetchDraftRoom = useCallback(async () => {
    if (!leagueId || !raceId) return;

    try {
      setLoading(true);
      const data = await getDraftRoom(Number(leagueId), Number(raceId));
      setDraftData(data);
    } catch (err) {
      setError("Failed to load draft room. Please try again.");
      console.error("Draft room error:", err);
    } finally {
      setLoading(false);
    }
  }, [leagueId, raceId]);

  useEffect(() => {
    fetchDraftRoom();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(fetchDraftRoom, 10000);
    
    return () => clearInterval(interval);
  }, [fetchDraftRoom]);

  // Handle driver selection
  const handleSelectDriver = useCallback(async (driver: Driver) => {
    if (!leagueId || !raceId || isSubmitting || !draftData?.status.is_my_turn) {
      return;
    }

    setIsSubmitting(true);
    try {
      await makePick(Number(leagueId), Number(raceId), driver.id);
      await fetchDraftRoom();
    } catch (err) {
      setError("Failed to select driver. Please try again.");
      console.error("Select driver error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueId, raceId, isSubmitting, draftData, fetchDraftRoom]);

  // Convert draft order to participants for DraftOrderList
  const draftParticipants: DraftParticipant[] = draftData
    ? draftData.draft_order.map((order) => ({
        user_id: order.user_id,
        username: order.username,
        team_name: order.constructor_name,
        selected_driver:
          order.picks.length > 0
            ? {
                number: order.picks[0].driver.number,
                name: order.picks[0].driver.name,
                team: order.picks[0].driver.team,
              }
            : null,
      }))
    : [];

  // Get drafted driver IDs
  const draftedDriverIds = draftData
    ? draftData.drafted_drivers.map((pick) => pick.driver.id)
    : [];

  // Calculate user's picks count
  const myPicksCount = draftData
    ? draftData.draft_order.find((order) => order.user_id === user?.id)?.picks.length || 0
    : 0;

  // Get max picks per team
  const maxPicks = draftData?.draft_order.length > 0
    ? Math.ceil(draftData.available_drivers.length / draftData.draft_order.length)
    : 2;

  if (loading) {
    return (
      <div className="draft-room-page draft-room-page--loading">
        <div className="draft-room-page__header">
          <div className="draft-room-page__header-content">
            <CardSkeleton />
          </div>
          <div className="draft-timer-card">
            <CardSkeleton />
          </div>
        </div>
        <div className="draft-room-page__content">
          <div className="draft-room-page__main">
            <ListSkeleton items={6} />
          </div>
          <div className="draft-room-page__sidebar">
            <ListSkeleton items={5} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="draft-room-page">
        <div className="draft-room-page__error">
          <div className="draft-room-page__error-icon">⚠️</div>
          <div className="draft-room-page__error-message">{error}</div>
          <button
            className="draft-room-page__retry-btn"
            onClick={fetchDraftRoom}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!draftData) {
    return null;
  }

  const isMyTurn = draftData.status.is_my_turn;
  const draftOpen =
    draftData.status.status === "OPEN" || draftData.status.status === "COMPLETE";

  return (
    <div className="draft-room-page">
      <div className="draft-room-page__header">
        <div className="draft-room-page__header-content">
          <h1 className="draft-room-page__title">{draftData.race_name}</h1>
          <div className="draft-room-page__subtitle">
            {draftData.league_name} • {draftData.circuit} •{" "}
            {new Date(draftData.race_date).toLocaleDateString()}
          </div>
        </div>
        <DraftTimer
          status={draftData.status.status}
          opensAt={draftData.status.opens_at}
          closesAt={draftData.status.closes_at}
          isMyTurn={isMyTurn}
        />
      </div>

      {!draftOpen && (
        <div className="draft-room-page__closed-banner">
          <div className="draft-room-page__closed-icon">🔒</div>
          <div className="draft-room-page__closed-text">
            Draft is {draftData.status.status.toLowerCase()}
          </div>
        </div>
      )}

      {draftData.status.status === "COMPLETE" || draftData.status.status === "CLOSED" ? (
        <div className="draft-room-page__history">
          <DraftHistory leagueId={Number(leagueId)} raceId={Number(raceId)} />
        </div>
      ) : (
        <div className="draft-room-page__content">
          <div className="draft-room-page__main">
            <DriverList
              drivers={draftData.available_drivers}
              draftedDriverIds={draftedDriverIds}
              isMyTurn={isMyTurn && draftData.status.is_my_turn}
              myPicksCount={myPicksCount}
              maxPicks={maxPicks}
              onDriverSelect={handleSelectDriver}
            />
          </div>

          <div className="draft-room-page__sidebar">
            <DraftOrderList
              participants={draftParticipants}
              currentDraftIndex={draftData.draft_order.findIndex(
                (order) => order.is_current_picker
              )}
              isMyTurn={isMyTurn}
              userId={user?.id}
            />
          </div>
        </div>
      )}

      {isSubmitting && (
        <LoadingOverlay message="Submitting pick..." />
      )}
    </div>
  );
};

export default DraftRoomPage;
