import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getDraftRoom, makePick, Driver, DraftStatus } from "../../services/draftService";
import DraftTimer from "../../components/draft/DraftTimer";
import DriverSelectionCard from "../../components/draft/DriverSelectionCard";
import DraftOrderList from "../../components/draft/DraftOrderList";
import { DraftParticipant } from "../../services/draftService";
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
  const [selectedDriver, setSelectedDriver] = useState<number | null>(null);
  const [expandedDriver, setExpandedDriver] = useState<number | null>(null);
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterSearch, setFilterSearch] = useState<string>("");
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
  const handleSelectDriver = useCallback(async (driverId: number) => {
    if (!leagueId || !raceId || isSubmitting || !draftData?.status.is_my_turn) {
      return;
    }

    setIsSubmitting(true);
    try {
      await makePick(Number(leagueId), Number(raceId), driverId);
      await fetchDraftRoom();
      setSelectedDriver(null);
    } catch (err) {
      setError("Failed to select driver. Please try again.");
      console.error("Select driver error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }, [leagueId, raceId, isSubmitting, draftData, fetchDraftRoom]);

  // Get unique teams for filter
  const teams = draftData
    ? Array.from(new Set(draftData.available_drivers.map((d) => d.team)))
    : [];

  // Filter drivers
  const filteredDrivers = draftData
    ? draftData.available_drivers.filter((driver) => {
        if (filterTeam !== "all" && driver.team !== filterTeam) return false;
        if (
          filterSearch &&
          !driver.name.toLowerCase().includes(filterSearch.toLowerCase())
        )
          return false;
        return true;
      })
    : [];

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

  if (loading) {
    return (
      <div className="draft-room-page">
        <div className="draft-room-page__loading">Loading draft room...</div>
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

      <div className="draft-room-page__content">
        <div className="draft-room-page__main">
          <div className="draft-room-page__drivers-section">
            <div className="draft-room-page__filters">
              <input
                type="text"
                placeholder="Search drivers..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="draft-room-page__search"
              />

              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="draft-room-page__team-filter"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            <div className="draft-room-page__drivers-list">
              {filteredDrivers.length === 0 ? (
                <div className="draft-room-page__no-drivers">
                  No drivers match your filters
                </div>
              ) : (
                filteredDrivers.map((driver) => {
                  const isDrafted = draftedDriverIds.includes(driver.id);
                  const canSelect =
                    isMyTurn &&
                    !isDrafted &&
                    draftData!.status.is_my_turn &&
                    !isSubmitting;

                  return (
                    <DriverSelectionCard
                      key={driver.id}
                      driver={driver}
                      selected={selectedDriver === driver.id}
                      disabled={!canSelect || isDrafted}
                      expanded={expandedDriver === driver.id}
                      onSelect={() => {
                        setSelectedDriver(driver.id);
                        handleSelectDriver(driver.id);
                      }}
                      onToggle={() => {
                        setExpandedDriver(
                          expandedDriver === driver.id ? null : driver.id
                        );
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
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

      {isSubmitting && (
        <div className="draft-room-page__submitting-overlay">
          <div className="draft-room-page__submitting-spinner" />
          <div className="draft-room-page__submitting-text">
            Submitting pick...
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftRoomPage;
