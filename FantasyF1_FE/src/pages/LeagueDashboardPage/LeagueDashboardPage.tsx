import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./LeagueDashboardPage.scss";

/**
 * Interface for League data
 */
interface League {
  id: string;
  name: string;
  description: string;
  code: string;
  is_private: boolean;
  max_teams: number;
  current_teams: number;
  draft_method: string;
  scoring_system: string;
  manager_id: string;
  manager_username: string;
  created_at: string;
}

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
 * Interface for current race data
 */
interface Race {
  id: string;
  name: string;
  circuit: string;
  country: string;
  race_date: string;
  qualifying_date: string;
  status: string;
}

/**
 * Interface for draft status
 */
interface DraftStatus {
  status: "UPCOMING" | "OPEN" | "CLOSED" | "COMPLETE";
  opens_at: string;
  closes_at: string;
  user_picks_count: number;
  max_picks: number;
}

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
  const [draftStatus, setDraftStatus] = useState<DraftStatus | null>(null);
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
      // In a real application, these would be actual API calls
      // Simulating API responses for now

      // Fetch league details
      const leagueData: League = {
        id: id,
        name: "F1 Fanatics League",
        description: "The ultimate fantasy F1 league for true Formula 1 fans!",
        code: "F1FAN",
        is_private: false,
        max_teams: 20,
        current_teams: 8,
        draft_method: "sequential",
        scoring_system: "inverted_position",
        manager_id: "manager123",
        manager_username: "AdminUser",
        created_at: "2024-01-15T10:00:00Z",
      };
      setLeague(leagueData);

      // Check if current user is manager
      setIsManager(user?.username === leagueData.manager_username);

      // Fetch constructors (league standings)
      const constructorsData: Constructor[] = [
        {
          id: "1",
          league_id: id,
          team_name: "Red Bull Racing",
          username: "AdminUser",
          user_id: "manager123",
          total_points: 245,
          rank: 1,
          is_manager: true,
        },
        {
          id: "2",
          league_id: id,
          team_name: "Mercedes AMG",
          username: "SpeedDemon",
          user_id: "user456",
          total_points: 220,
          rank: 2,
          is_manager: false,
        },
        {
          id: "3",
          league_id: id,
          team_name: "Ferrari Scuderia",
          username: "TifosoPro",
          user_id: "user789",
          total_points: 198,
          rank: 3,
          is_manager: false,
        },
        {
          id: "4",
          league_id: id,
          team_name: "McLaren F1",
          username: "PapayaArmy",
          user_id: "user101",
          total_points: 175,
          rank: 4,
          is_manager: false,
        },
      ];
      setConstructors(constructorsData);

      // Fetch current race
      const raceData: Race = {
        id: "race1",
        name: "Australian Grand Prix",
        circuit: "Albert Park Circuit",
        country: "Australia",
        race_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        qualifying_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
        status: "upcoming",
      };
      setCurrentRace(raceData);

      // Fetch draft status
      const draftStatusData: DraftStatus = {
        status: "OPEN",
        opens_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        closes_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        user_picks_count: 1,
        max_picks: 2,
      };
      setDraftStatus(draftStatusData);
    } catch (err) {
      setError("Failed to load league data. Please try again.");
      console.error("Error fetching league data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterDraftRoom = () => {
    if (currentRace && draftStatus?.status === "OPEN") {
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

  const getDraftStatusColor = (status: string): string => {
    switch (status) {
      case "UPCOMING":
        return "#f59e0b"; // Yellow
      case "OPEN":
        return "#10b981"; // Green
      case "CLOSED":
        return "#ef4444"; // Red
      case "COMPLETE":
        return "#3b82f6"; // Blue
      default:
        return "#6b7280"; // Gray
    }
  };

  if (loading) {
    return (
      <div className="league-dashboard-page league-dashboard-page--loading">
        <div className="skeleton skeleton--header" />
        <div className="skeleton skeleton--content" />
        <div className="skeleton skeleton--table" />
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
                style={{ backgroundColor: getDraftStatusColor(draftStatus.status) }}
              >
                {draftStatus.status}
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
                  Opens: Monday 8:00 AM EST → Closes at Qualifying
                </span>
              </div>
              {draftStatus.status === "UPCOMING" && (
                <div className="detail-item detail-item--highlight">
                  <span className="detail-item__label">Opens in:</span>
                  <span className="detail-item__value">{getCountdown(draftStatus.opens_at)}</span>
                </div>
              )}
              {draftStatus.status === "OPEN" && (
                <div className="detail-item detail-item--highlight">
                  <span className="detail-item__label">Draft closes in:</span>
                  <span className="detail-item__value">{getCountdown(draftStatus.closes_at)}</span>
                </div>
              )}
            </div>

            {draftStatus.status === "OPEN" && currentUserConstructor && (
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

            {draftStatus.status === "COMPLETE" && (
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
