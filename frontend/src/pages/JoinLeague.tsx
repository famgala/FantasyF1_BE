import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeagueByCode, joinLeague } from '../services/leagueService';
import type { League } from '../types';

export default function JoinLeague() {
  const navigate = useNavigate();
  const [leagueCode, setLeagueCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [touched, setTouched] = useState({
    leagueCode: false,
    teamName: false,
  });

  // Validation
  const validateLeagueCode = (code: string): string => {
    if (!code.trim()) return 'League code is required';
    if (code.length < 6 || code.length > 10) return 'League code must be 6-10 characters';
    return '';
  };

  const validateTeamName = (name: string): string => {
    if (!name.trim()) return 'Team name is required';
    if (name.length < 3) return 'Team name must be at least 3 characters';
    if (name.length > 100) return 'Team name must be less than 100 characters';
    return '';
  };

  const leagueCodeError = touched.leagueCode ? validateLeagueCode(leagueCode) : '';
  const teamNameError = touched.teamName ? validateTeamName(teamName) : '';

  const handleSearchLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ ...touched, leagueCode: true });

    const codeError = validateLeagueCode(leagueCode);
    if (codeError) {
      setError(codeError);
      return;
    }

    setSearching(true);
    setError('');
    setSuccess('');
    setLeague(null);

    try {
      const foundLeague = await getLeagueByCode(leagueCode);
      setLeague(foundLeague);
      setSuccess('League found! Enter your team name to join.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'League not found. Please check the code and try again.');
      setLeague(null);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ leagueCode: true, teamName: true });

    const nameError = validateTeamName(teamName);
    if (nameError || !league) {
      setError(nameError || 'Please search for a league first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await joinLeague(league.id, { team_name: teamName });
      setSuccess(`Successfully joined ${league.name}! Redirecting...`);
      setTimeout(() => {
        navigate(`/leagues/${league.id}`);
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Failed to join league. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="join-league-page">
      <div className="join-league-container">
        <h1>Join a League</h1>
        <p className="subtitle">Enter a league code to join an existing league</p>

        {/* Search League Form */}
        <form onSubmit={handleSearchLeague} className="join-league-form">
          <div className="form-group">
            <label htmlFor="leagueCode">League Code</label>
            <input
              type="text"
              id="leagueCode"
              className="form-control"
              value={leagueCode}
              onChange={(e) => setLeagueCode(e.target.value.toUpperCase())}
              onBlur={() => setTouched({ ...touched, leagueCode: true })}
              placeholder="Enter league code (e.g., ABC123)"
              disabled={searching || loading}
            />
            {leagueCodeError && <div className="error-message">{leagueCodeError}</div>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={searching || loading || !!leagueCodeError}
          >
            {searching ? 'Searching...' : 'Search League'}
          </button>
        </form>

        {/* Display League Information */}
        {league && (
          <div className="league-info-box">
            <h2>League Information</h2>
            <div className="league-details">
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{league.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{league.description || 'No description'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Privacy:</span>
                <span className={`privacy-badge ${league.privacy}`}>
                  {league.privacy}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Draft Method:</span>
                <span className="detail-value">{league.draft_method}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Max Teams:</span>
                <span className="detail-value">{league.max_teams}</span>
              </div>
            </div>

            {/* Join Form */}
            <form onSubmit={handleJoinLeague} className="team-name-form">
              <div className="form-group">
                <label htmlFor="teamName">Your Team Name</label>
                <input
                  type="text"
                  id="teamName"
                  className="form-control"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  onBlur={() => setTouched({ ...touched, teamName: true })}
                  placeholder="Enter your team name"
                  disabled={loading}
                />
                {teamNameError && <div className="error-message">{teamNameError}</div>}
              </div>

              <button 
                type="submit" 
                className="btn btn-success"
                disabled={loading || !!teamNameError}
              >
                {loading ? 'Joining...' : 'Join League'}
              </button>
            </form>
          </div>
        )}

        {/* Messages */}
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Cancel Button */}
        <button 
          type="button" 
          className="btn btn-outline"
          onClick={() => navigate('/dashboard')}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
