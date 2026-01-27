import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { 
  getLeagueById, 
  getLeagueTeams, 
  getDraftStatus, 
  getCurrentRace,
  DraftStatus as BackendDraftStatus,
  Race as BackendRace,
  LeagueTeam,
  League
} from "../../services/leagueService";
import { CardSkeleton, TableSkeleton } from "../../components/loading";
import "./LeagueDashboardPage.scss";


/**
 * Interface for Constructor (Team/Player) data
 */
interface Constructor {
  id: string;
  league_id: string;
  team_name: string;
  username: string;
  user_id: string;
  total_points: number;
  rank: number;
  is_manager: boolean;
}

/**
 * Extended DraftStatus with additional UI properties
 */
interface UIDraftStatus {
  league_id: string;
  race_id: number;
  draft_method: string;
  is_draft_complete: boolean;
  total_teams: number;
  total_picks_made: number;
  current_round: number;
  current_position: number;
  current_team: {
    id: string;
    name: string;
    user_id: string;
  } | null;
  next_pick: {
    fantasy_team_id: string;
    pick_round: number;
    draft_position: number;
  } | null;
  opens_at?: string;
  closes_at?: string;
  user_picks_count: number;
  max_picks: number;
}

/**
 * Interface for current race data (using backend Race type)
 */
type Race = BackendRace;

/**
 * League Dashboard Page
 * 
 * Main league view showing league info, standings, draft status, and navigation.
 * Only accessible to league members.
 */
const LeagueDashboardPage: React.FC = () => {
  const { leagueId } = useParams<{ leagueId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [league, setLeague] = useState<League | null>(null);
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [draftStatus, setDraftStatus] = useState<UIDraftStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isManager, setIsManager] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteLinkCopied, setInviteLinkCopied] = useState<boolean>(false);

  useEffect(() => {
    if (leagueId) {
      fetchLeagueData(leagueId);
    }
  }, [leagueId]);

  const fetchLeagueData = async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch league details
      const leagueData = await getLeagueById(id);
      setLeague(leagueData);

      // Check if current user is manager
      if (leagueData) {
        setIsManager(user?.username === leagueData.manager_username || user?.email === leagueData.creator_id);
      }

      // Fetch constructors (league teams/standings)
      const teamsData = await getLeagueTeams(id);
      
      // Convert teams to constructors with ranking
      const constructorsData: Constructor[] = teamsData
        .map((team, index) => ({
          id: team.id,
          league_id: id,
          team_name: team.name,
          username: team.username || `User${team.user_id}`,
          user_id: team.user_id,
          total_points: team.total_points,
          rank: index + 1,
          is_manager: team.is_manager || false,
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .map((team, index) => ({ ...team, rank: index + 1 }));
      
      setConstructors(constructorsData);

      // Fetch current/upcoming race
      const raceData = await getCurrentRace() || await getCurrentRace() || null;
      setCurrentRace(raceData);

      // Fetch draft status if race is available
      if (raceData) {
        try {
          const draftData = await getDraftStatus(id, Number(raceData.id));
          const uiDraftStatus: UIDraftStatus = {
            ...draftData,
            opens_at: raceData.race_date, // Typically opens before race
            closes_at: raceData.qualifying_date, // Closes at qualifying
            user_picks_count: draftData.total_picks_made % draftData.total_teams,
            max_picks: 2, // Assuming 2 picks per round
          };
          setDraftStatus(uiDraftStatus);
        } catch (draftErr) {
          console.error("Error fetching draft status:", draftErr);
          // Set default draft status if not available
          setDraftStatus({
            league_id: id,
            race_id: Number(raceData.id),
            draft_method: leagueData.draft_method || "sequential",
            is_draft_complete: false,
            total_teams: leagueData.current_teams || teamsData.length,
            total_picks_made: 0,
            current_round: 1,
            current_position: 1,
            current_team: null,
            next_pick: null,
            opens_at: raceData.race_date,
            closes_at: raceData.qualifying_date,
            user_picks_count: 0,
            max_picks: 2,
          });
        }
      }
    } catch (err) {
      setError("Failed to load league data. Please try again.");
      console.error("Error fetching league data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDraftRoom = () => {
    if (currentRace && draftStatus && !draftStatus.is_draft_complete) {
      navigate(`/draft/${leagueId}/${currentRace.id}`);
    }
  };

  const handleViewStandings = () => {
    navigate(`/league/${leagueId}/standings`);
  };

  const handleSettings = () => {
    navigate(`/league/${leagueId}/settings`);
  };

  const copyInviteLink = () => {
    if (league) {
      const inviteLink = `${window.location.origin}/join?code=${league.code}`;
      navigator.clipboard.writeText(inviteLink);
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2000);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCountdown = (targetDate: string): string => {
    const now = new Date();
    const target = new Date(targetDate);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return "Closed";
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getDraftStatusColor = (isComplete: boolean, isOpen: boolean): string => {
    if (isComplete) {
      return "#3b82f6"; // Blue for complete
    }
    if (isOpen) {
      return "#10b981"; // Green for open
    }
    return "#f59e0b"; // Yellow for upcoming
  };

  const getDraftStatusLabel = (draftStatus: UIDraftStatus | null): string => {
    if (!draftStatus) return "Loading...";
    if (draftStatus.is_draft_complete) return "COMPLETE";
    if (draftStatus.total_picks_made > 0) return "OPEN";
    return "UPCOMING";
  };

  if (loading) {
    return (
      <div className="league-dashboard-page league-dashboard-page--loading">
        <div className="league-header">
          <CardSkeleton />
        </div>
        <section className="draft-status-section">
          <CardSkeleton />
        </section>
        <section className="standings-section">
          <TableSkeleton rows={5} columns={4} />
        </section>
      </div>
    );
  }

  if (error || !league) {
    return (
      <div className="league-dashboard-page league-dashboard-page--error">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error || "League not found"}</p>
          <button onClick={() => navigate("/dashboard")} className="btn btn--primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentUserConstructor = constructors.find((c) => c.username === user?.username);

  return (
    <div className="league-dashboard-page">
      {/* League Header */}
      <header className="league-header">
        <div className="league-header__info">
          <h1 className="league-header__title">{league.name}</h1>
          <p className="league-header__description">{league.description}</p>
          <div className="league-header__badges">
            {league.is_private && <span className="badge badge--private">Private</span>}
            <span className="badge badge--code">Code: {league.code}</span>
            <span className="badge badge--manager">
              Manager: {league.manager_username}
            </span>
          </div>
        </div>

        {isManager && (
          <div className="league-header__actions">
            <button
              onClick={() => setShowInviteModal(true)}
              className="btn btn--secondary"
              aria-label="Invite members"
            >
              <span className="btn__icon">👥</span>
              Invite Members
            </button>
            <button
              onClick={handleSettings}
              className="btn btn--outline"
              aria-label="League settings"
            >
              <span className="btn__icon">⚙️</span>
              Settings
            </button>
          </div>
        )}
      </header>

      {/* Draft Status Section */}
      {currentRace && draftStatus && (
        <section className="draft-status-section">
          <div className="draft-status-card">
            <div className="draft-status-card__header">
              <h2 className="draft-status-card__title">
                <span className="draft-status-card__icon">🏁</span>
                {currentRace.name}
              </h2>
              <span
                className="draft-status-card__status"
                style={{ backgroundColor: getDraftStatusColor(draftStatus.is_draft_complete, draftStatus.total_picks_made > 0) }}
              >
                {getDraftStatusLabel(draftStatus)}
              </span>
            </div>

            <div className="draft-status-card__details">
              <div className="detail-item">
                <span className="detail-item__label">Circuit:</span>
                <span className="detail-item__value">{currentRace.circuit}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Race Date:</span>
                <span className="detail-item__value">{formatDateTime(currentRace.race_date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-item__label">Draft Window:</span>
                <span className="detail-item__value">
                  Opens: {draftStatus.opens_at ? formatDateTime(draftStatus.opens_at) : "TBD"} → 
                  Closes: {draftStatus.closes_at ? formatDateTime(draftStatus.closes_at) : "TBD"}
                </span>
              </div>
              {!draftStatus.is_draft_complete && draftStatus.total_picks_made === 0 && draftStatus.opens_at && (
                <div className="detail-item detail-item--highlight">
                  <span className="detail-item__label">Opens in:</span>
                  <span className="detail-item__value">{getCountdown(draftStatus.opens_at)}</span>
                </div>
              )}
              {!draftStatus.is_draft_complete && draftStatus.total_picks_made > 0 && draftStatus.closes_at && (
                <div className="detail-item detail-item--highlight">
                  <span className="detail-item__label">Draft closes in:</span>
                  <span className="detail-item__value">{getCountdown(draftStatus.closes_at)}</span>
                </div>
              )}
            </div>

            {!draftStatus.is_draft_complete && draftStatus.total_picks_made > 0 && currentUserConstructor && (
              <div className="draft-status-card__picks">
                <p className="picks-info">
                  Your Picks: {draftStatus.user_picks_count} / {draftStatus.max_picks}
                </p>
                {draftStatus.user_picks_count < draftStatus.max_picks && (
                  <button onClick={handleEnterDraftRoom} className="btn btn--primary btn--large">
                    <span className="btn__icon">✏️</span>
                    Enter Draft Room
                  </button>
                )}
              </div>
            )}

            {draftStatus.is_draft_complete && (
              <div className="draft-status-card__actions">
                <button onClick={handleViewStandings} className="btn btn--secondary">
                  <span className="btn__icon">📊</span>
                  View Final Draft
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Standings Section */}
      <section className="standings-section">
        <div className="section-header">
          <h2 className="section-header__title">League Standings</h2>
          <button onClick={handleViewStandings} className="btn btn--text">
            View Full Standings →
          </button>
        </div>

        <div className="standings-table-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th className="standings-table__header standings-table__header--rank">Rank</th>
                <th className="standings-table__header standings-table__header--team">Team</th>
                <th className="standings-table__header standings-table__header--manager">Manager</th>
                <th className="standings-table__header standings-table__header--points">
                  Total Points
                </th>
              </tr>
            </thead>
            <tbody>
              {constructors.map((constructor) => (
                <tr
                  key={constructor.id}
                  className={`standings-table__row ${
                    constructor.username === user?.username
                      ? "standings-table__row--highlight"
                      : ""
                  }`}
                  onClick={() => navigate(`/constructor/${constructor.id}`)}
                >
                  <td className="standings-table__cell standings-table__cell--rank">
                    {constructor.rank === 1 && <span className="rank-badge rank-badge--gold">1</span>}
                    {constructor.rank === 2 && <span className="rank-badge rank-badge--silver">2</span>}
                    {constructor.rank === 3 && <span className="rank-badge rank-badge--bronze">3</span>}
                    {constructor.rank > 3 &&
                      <span className="rank-badge rank-badge--default">{constructor.rank}</span>
                    }
                  </td>
                  <td className="standings-table__cell standings-table__cell--team">
                    <div className="team-info">
                      <span className="team-info__name">{constructor.team_name}</span>
                      {constructor.is_manager && (
                        <span className="manager-badge">⭐ Manager</span>
                      )}
                    </div>
                  </td>
                  <td className="standings-table__cell standings-table__cell--manager">
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
      </section>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal modal--invite" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h3 className="modal__title">Invite Members</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="btn btn--icon"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal__body">
              <p className="invite-instructions">
                Share this code or link with others to invite them to your league:
              </p>
              <div className="invite-code-display">
                <span className="invite-code">{league.code}</span>
                <button
                  onClick={copyInviteLink}
                  className="btn btn--secondary"
                  disabled={inviteLinkCopied}
                >
                  {inviteLinkCopied ? "✓ Copied!" : "Copy Link"}
                </button>
              </div>
              <p className="invite-note">
                Members can join by entering this code on the join league page.
              </p>
              <div className="invite-link-container">
                <label className="invite-link-label">Direct Invite Link:</label>
                <div className="invite-link-wrapper">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/join?code=${league.code}`}
                    className="invite-link-input"
                  />
                  <button
                    onClick={copyInviteLink}
                    className="btn btn--icon"
                    aria-label="Copy link"
                    disabled={inviteLinkCopied}
                  >
                    {inviteLinkCopied ? "✓" : "📋"}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button onClick={() => setShowInviteModal(false)} className="btn btn--primary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueDashboardPage;
