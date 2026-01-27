import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import * as S from "./JoinWithCodeForm.scss";
import { inviteCodeCheck, joinLeague, League } from "../../../services/leagueService";

// Validation schema using yup
const codeCheckSchema = yup.object().shape({
  inviteCode: yup
    .string()
    .required("League code is required")
    .min(6, "Code must be at least 6 characters")
    .max(10, "Code must be less than 10 characters")
    .matches(
      /^[A-Z0-9]+$/,
      "Code can only contain letters and numbers"
    ),
});

const joinLeagueSchema = yup.object().shape({
  teamName: yup
    .string()
    .required("Team name is required")
    .min(3, "Team name must be at least 3 characters")
    .max(50, "Team name must be less than 50 characters"),
});

interface CheckCodeFormData {
  inviteCode: string;
}

interface JoinLeagueFormData {
  teamName: string;
}

interface JoinWithCodeFormProps {
  onJoinLeague: (league: League) => void;
}

/**
 * JoinWithCodeForm - Form for joining a league with an invite code
 * 
 * Features:
 * - Two-step process: Check code, then join league
 * - Invite code validation (6-10 chars, alphanumeric)
 * - Team name validation (3-50 chars)
 * - League info display after code verification
 * - Error handling for invalid codes and full leagues
 */
const JoinWithCodeForm: React.FC<JoinWithCodeFormProps> = ({ onJoinLeague }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [leagueFound, setLeagueFound] = useState<League | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const {
    register: registerCode,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors },
    reset: resetCode,
  } = useForm<CheckCodeFormData>({
    resolver: yupResolver(codeCheckSchema),
    mode: "onBlur",
  });

  const {
    register: registerTeam,
    handleSubmit: handleTeamSubmit,
    formState: { errors: teamErrors },
    reset: resetTeam,
  } = useForm<JoinLeagueFormData>({
    resolver: yupResolver(joinLeagueSchema),
    mode: "onBlur",
  });

  const onCheckCode = async (data: CheckCodeFormData) => {
    setLoading(true);
    setApiError(null);
    setError("");
    setLeagueFound(null);

    try {
      const league = await inviteCodeCheck(data.inviteCode.trim().toUpperCase());
      
      if (!league) {
        setApiError("Invalid league code. Please check and try again.");
        return;
      }

      if (league.is_private && !league.invite_link) {
        setApiError("This is a private league. You need a valid invite link to join.");
        return;
      }

      if (league.current_teams >= league.max_teams) {
        setApiError("This league is full. Please contact the league manager or find another league.");
        return;
      }

      setLeagueFound(league);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to check league code. Please try again.";
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const onJoin = async (data: JoinLeagueFormData) => {
    if (!leagueFound) return;

    setJoining(true);
    setApiError("");
    setError("");

    try {
      await joinLeague({
        league_id: leagueFound.id,
        team_name: data.teamName.trim(),
      });

      setJoinSuccess(true);
      setError("");

      setTimeout(() => {
        onJoinLeague(leagueFound);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to join league. Please try again.";
      setApiError(errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const handleReset = () => {
    resetCode();
    resetTeam();
    setError("");
    setApiError(null);
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

              <form onSubmit={handleCodeSubmit(onCheckCode)} className={S.codeForm}>
                <div className={S.formGroup}>
                  <label htmlFor="inviteCode" className={S.formLabel}>
                    League Code <span className={S.required}>*</span>
                  </label>
                  <input
                    id="inviteCode"
                    type="text"
                    className={S.formInput}
                    placeholder="Enter 6-10 character code"
                    aria-required="true"
                    aria-invalid={!!codeErrors.inviteCode}
                    aria-describedby={
                      codeErrors.inviteCode ? "inviteCode-error inviteCode-hint" : "inviteCode-hint"
                    }
                    disabled={loading}
                    {...registerCode("inviteCode")}
                  />
                  <p id="inviteCode-hint" className={S.formHint}>
                    Case-insensitive, 6-10 characters, letters and numbers only
                  </p>
                  {codeErrors.inviteCode && (
                    <p id="inviteCode-error" className={S.errorMessage} role="alert">
                      {codeErrors.inviteCode.message}
                    </p>
                  )}
                </div>

                {apiError && (
                  <div className={S.errorMessage} role="alert">
                    {apiError}
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
                    disabled={loading}
                    aria-busy={loading}
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

                <form onSubmit={handleTeamSubmit(onJoin)} className={S.joinForm}>
                  <div className={S.formGroup}>
                    <label htmlFor="teamName" className={S.formLabel}>
                      Team Name <span className={S.required}>*</span>
                    </label>
                    <input
                      id="teamName"
                      type="text"
                      className={S.formInput}
                      placeholder="Enter your team name (3-50 characters)"
                      aria-required="true"
                      aria-invalid={!!teamErrors.teamName}
                      aria-describedby={
                        teamErrors.teamName ? "teamName-error teamName-hint" : "teamName-hint"
                      }
                      disabled={joining}
                      {...registerTeam("teamName")}
                    />
                    <p id="teamName-hint" className={S.formHint}>
                      Must be 3-50 characters
                    </p>
                    {teamErrors.teamName && (
                      <p id="teamName-error" className={S.errorMessage} role="alert">
                        {teamErrors.teamName.message}
                      </p>
                    )}
                  </div>

                  {apiError && (
                    <div className={S.errorMessage} role="alert">
                      {apiError}
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
                      disabled={joining}
                      aria-busy={joining}
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
