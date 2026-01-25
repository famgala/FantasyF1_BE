import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as S from "./JoinWithCodeForm.scss";
import { inviteCodeCheck, joinLeague, League } from "../../../services/leagueService";

interface JoinWithCodeFormProps {
  onJoinLeague: (league: League) => void;
}

const JoinWithCodeForm: React.FC<JoinWithCodeFormProps> = ({ onJoinLeague }) => {
  const navigate = useNavigate();
  const [inviteCode, setInviteCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [leagueFound, setLeagueFound] = useState<League | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleCheckCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError("");
    setLeagueFound(null);

    try {
      const league = await inviteCodeCheck(inviteCode.trim().toUpperCase());
      
      if (!league) {
        setError("Invalid league code. Please check and try again.");
        return;
      }

      if (league.is_private && !league.invite_link) {
        setError("This is a private league. You need a valid invite link to join.");
        return;
      }

      if (league.current_teams >= league.max_teams) {
        setError("This league is full. Please contact the league manager or find another league.");
        return;
      }

      setLeagueFound(league);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to check league code. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leagueFound || !teamName.trim()) return;

    setJoining(true);
    setError("");

    try {
      await joinLeague({
        league_id: leagueFound.id,
        team_name: teamName.trim(),
      });

      setJoinSuccess(true);
      setError("");

      setTimeout(() => {
        onJoinLeague(leagueFound);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to join league. Please try again.";
      setError(errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const handleReset = () => {
    setInviteCode("");
    setTeamName("");
    setError("");
    setLeagueFound(null);
    setJoinSuccess(false);
  };

  return (
    <div className={S.container}>
      {!joinSuccess && (
        <>
          {!leagueFound ? (
            <div className={S.formSection}>
              <h2 className={S.title}>Join with Invite Code</h2>
              <p className={S.subtitle}>Enter the league code shared with you by the league manager</p>

              <form onSubmit={handleCheckCode} className={S.codeForm}>
                <div className={S.formGroup}>
                  <label htmlFor="inviteCode" className={S.formLabel}>
                    League Code <span className={S.required}>*</span>
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-10 character code"
                    className={S.formInput}
                    aria-required="true"
                    minLength={6}
                    maxLength={10}
                    disabled={loading}
                  />
                  <p className={S.formHint}>Case-insensitive, 6-10 characters</p>
                </div>

                {error && (
                  <div className={S.errorMessage} role="alert">
                    {error}
                  </div>
                )}

                <div className={S.formActions}>
                  <button
                    type="button"
                    className={S.cancelButton}
                    onClick={() => navigate("/dashboard")}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={S.submitButton}
                    disabled={loading || inviteCode.length < 6}
                  >
                    {loading ? "Checking..." : "Check Code"}
                  </button>
                </div>
              </form>

              <div className={S.divider}>
                <span>OR</span>
              </div>

              <div className={S.searchSection}>
                <h3 className={S.sectionTitle}>Don't have a code?</h3>
                <p className={S.sectionSubtitle}>Browse public leagues to join</p>
                <button
                  className={S.searchButton}
                  onClick={() => {
                    const searchForm = document.querySelector("[data-tab='search']") as HTMLElement;
                    searchForm?.click();
                  }}
                >
                  Browse Public Leagues
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={S.leagueFoundSection}>
                <h2 className={S.title}>Join {leagueFound.name}</h2>
                <p className={S.subtitle}>Enter your team name below to join this league</p>

                <div className={S.leagueInfo}>
                  <div className={S.leagueInfoRow}>
                    <span className={S.leagueInfoLabel}>League Name:</span>
                    <span className={S.leagueInfoValue}>{leagueFound.name}</span>
                  </div>
                  <div className={S.leagueInfoRow}>
                    <span className={S.leagueInfoLabel}>Manager:</span>
                    <span className={S.leagueInfoValue}>{leagueFound.manager_username}</span>
                  </div>
                  <div className={S.leagueInfoRow}>
                    <span className={S.leagueInfoLabel}>Teams:</span>
                    <span className={S.leagueInfoValue}>
                      {leagueFound.current_teams}/{leagueFound.max_teams}
                    </span>
                  </div>
                  <div className={S.leagueInfoRow}>
                    <span className={S.leagueInfoLabel}>Scoring:</span>
                    <span className={S.leagueInfoValue}>
                      {leagueFound.scoring_system === "inverted_position" ? "Inverted Position" : leagueFound.scoring_system}
                    </span>
                  </div>
                  {leagueFound.description && (
                    <div className={S.leagueInfoRow}>
                      <span className={S.leagueInfoLabel}>Description:</span>
                      <span className={S.leagueInfoValue}>{leagueFound.description}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleJoinLeague} className={S.joinForm}>
                  <div className={S.formGroup}>
                    <label htmlFor="teamName" className={S.formLabel}>
                      Team Name <span className={S.required}>*</span>
                    </label>
                    <input
                      id="teamName"
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Enter your team name (3-50 characters)"
                      className={S.formInput}
                      aria-required="true"
                      minLength={3}
                      maxLength={50}
                      disabled={joining}
                    />
                    <p className={S.formHint}>Must be 3-50 characters</p>
                  </div>

                  {error && (
                    <div className={S.errorMessage} role="alert">
                      {error}
                    </div>
                  )}

                  <div className={S.formActions}>
                    <button
                      type="button"
                      className={S.cancelButton}
                      onClick={handleReset}
                      disabled={joining}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className={S.submitButton}
                      disabled={joining || teamName.length < 3}
                    >
                      {joining ? "Joining..." : "Join League"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </>
      )}

      {joinSuccess && (
        <div className={S.successState}>
          <div className={S.successIcon}>✓</div>
          <h3>Welcome to {leagueFound?.name}!</h3>
          <p>You have successfully joined the league</p>
          <p className={S.successMessage}>Get ready to draft your team! 🏎️</p>
        </div>
      )}
    </div>
  );
};

export default JoinWithCodeForm;
