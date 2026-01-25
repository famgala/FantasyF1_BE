import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import * as S from "./LeagueSearchForm.scss";
import { searchLeagues, League } from "../../../services/leagueService";

interface LeagueSearchFormProps {
  onJoinLeague: (league: League) => void;
}

const LeagueSearchForm: React.FC<LeagueSearchFormProps> = ({ onJoinLeague }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState<League | null>(null);
  const [teamName, setTeamName] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setSearched(false);

    try {
      const results = await searchLeagues({
        search: searchQuery,
        is_private: false,
      });
      setLeagues(results);
      setSearched(true);

      if (results.length === 0) {
        setError("No public leagues found matching your search.");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to search leagues. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleViewTeamName = (league: League) => {
    setSelectedLeague(league);
    setTeamName("");
  };

  const handleCloseModal = () => {
    setSelectedLeague(null);
    setTeamName("");
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeague || !teamName.trim()) return;

    setJoining(true);
    setError("");

    try {
      const { joinLeague } = await import("../../../services/leagueService");
      await joinLeague({
        league_id: selectedLeague.id,
        team_name: teamName.trim(),
      });

      setJoinSuccess(true);
      setError("");

      setTimeout(() => {
        onJoinLeague(selectedLeague);
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to join league. Please try again.";
      setError(errorMessage);
    } finally {
      setJoining(false);
    }
  };

  const isLeagueFull = (league: League) => {
    return league.current_teams >= league.max_teams;
  };

  return (
    <div className={S.container}>
      <div className={S.searchSection}>
        <h2 className={S.title}>Find Public Leagues</h2>
        <form onSubmit={handleSearch} className={S.searchForm}>
          <div className={S.searchInputGroup}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by league name or description..."
              className={S.searchInput}
              aria-label="Search leagues"
            />
            <button type="submit" className={S.searchButton} disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setLeagues([]);
              setSearched(false);
              setError("");
            }}
            className={S.clearButton}
          >
            Clear
          </button>
        </form>

        {error && (
          <div className={S.errorMessage} role="alert">
            {error}
          </div>
        )}

        {searched && leagues.length > 0 && (
          <div className={S.resultsSection}>
            <h3 className={S.resultsTitle}>{leagues.length} league(s) found</h3>
            <div className={S.leaguesList}>
              {leagues.map((league) => (
                <div key={league.id} className={S.leagueCard}>
                  <div className={S.leagueHeader}>
                    <h4 className={S.leagueName}>{league.name}</h4>
                    <span
                      className={`${S.privacyBadge} ${S}`}
                      aria-label={league.is_private ? "Private league" : "Public league"}
                    >
                      {league.is_private ? "Private" : "Public"}
                    </span>
                  </div>
                  {league.description && (
                    <p className={S.leagueDescription}>{league.description}</p>
                  )}
                  <div className={S.leagueMeta}>
                    <span className={S.leagueManager}>
                      Created by {league.manager_username}
                    </span>
                    <span className={S.leagueTeams}>
                      {league.current_teams}/{league.max_teams} teams
                    </span>
                  </div>
                  <div className={S.leagueActions}>
                    {isLeagueFull(league) ? (
                      <button className={S.fullButton} disabled>
                        Full
                      </button>
                    ) : (
                      <button
                        className={S.joinButton}
                        onClick={() => handleViewTeamName(league)}
                        aria-label={`Join ${league.name}`}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searched && leagues.length === 0 && !error && (
          <div className={S.noResults}>
            <div className={S.noResultsIcon}>🏁</div>
            <h3>No Results Found</h3>
            <p>Try searching with different keywords or create your own league.</p>
            <button
              className={S.createLeagueButton}
              onClick={() => navigate("/leagues/create")}
            >
              Create New League
            </button>
          </div>
        )}
      </div>

      {/* Team Name Modal */}
      {selectedLeague && (
        <div className={S.modalOverlay} onClick={handleCloseModal}>
          <div className={S.modalContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={S.modalClose}
              onClick={handleCloseModal}
              aria-label="Close modal"
            >
              ✕
            </button>

            {joinSuccess ? (
              <div className={S.successState}>
                <div className={S.successIcon}>✓</div>
                <h3>Successfully Joined!</h3>
                <p>You have successfully joined {selectedLeague.name}</p>
                <p>Game on! 🏎️</p>
              </div>
            ) : (
              <>
                <h3>Join {selectedLeague.name}</h3>
                <div className={S.leagueInfo}>
                  <p>
                    <strong>League:</strong> {selectedLeague.name}
                  </p>
                  <p>
                    <strong>Teams:</strong> {selectedLeague.current_teams}/{selectedLeague.max_teams}
                  </p>
                  <p>
                    <strong>Manager:</strong> {selectedLeague.manager_username}
                  </p>
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
                    />
                    <p className={S.formHint}>Must be 3-50 characters</p>
                  </div>

                  {error && <div className={S.errorText}>{error}</div>}

                  <div className={S.modalActions}>
                    <button
                      type="button"
                      className={S.cancelButton}
                      onClick={handleCloseModal}
                      disabled={joining}
                    >
                      Cancel
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeagueSearchForm;
