import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Trophy, Users, Calendar } from 'lucide-react';
import './NoLeagueState.scss';

interface NoLeagueStateProps {
  username?: string;
}

export const NoLeagueState: React.FC<NoLeagueStateProps> = ({ username = 'User' }) => {
  const navigate = useNavigate();

  const handleJoinLeague = () => {
    navigate('/leagues/join');
  };

  const handleCreateLeague = () => {
    navigate('/leagues/create');
  };

  return (
    <div className="no-league-state">
      <div className="no-league-state__welcome">
        <Trophy className="no-league-state__trophy-icon" />
        <h1 className="no-league-state__title">Welcome to Fantasy F1, {username}!</h1>
        <p className="no-league-state__subtitle">
          Get ready to build your dream team and compete against friends and fellow racing fans
        </p>
      </div>

      <div className="no-league-state__overview">
        <h2 className="no-league-state__overview-title">How It Works</h2>
        <div className="no-league-state__overview-content">
          <div className="no-league-state__overview-item">
            <div className="no-league-state__overview-icon">
              <Users />
            </div>
            <div className="no-league-state__overview-text">
              <h3>Join or Create a League</h3>
              <p>Join a public league, enter a private invite code, or create your own league</p>
            </div>
          </div>
          <div className="no-league-state__overview-item">
            <div className="no-league-state__overview-icon">
              <Calendar />
            </div>
            <div className="no-league-state__overview-text">
              <h3>Draft Drivers Weekly</h3>
              <p>Select 2 drivers before each race during the Monday-to-qualifying draft window</p>
            </div>
          </div>
          <div className="no-league-state__overview-item">
            <div className="no-league-state__overview-icon">
              <Trophy />
            </div>
            <div className="no-league-state__overview-text">
              <h3>Score Points</h3>
              <p>Earn points using inverted position scoring - lower grid positions = more points!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="no-league-state__actions">
        <h2 className="no-league-state__actions-title">Get Started</h2>
        <div className="no-league-state__action-buttons">
          <button
            className="no-league-state__button no-league-state__button--primary"
            onClick={handleCreateLeague}
            aria-label="Create a new league"
          >
            <Plus className="no-league-state__button-icon" />
            Create New League
          </button>
          <button
            className="no-league-state__button no-league-state__button--secondary"
            onClick={handleJoinLeague}
            aria-label="Join an existing league"
          >
            <Search className="no-league-state__button-icon" />
            Join Existing League
          </button>
        </div>
      </div>

      <div className="no-league-state__info">
        <p className="no-league-state__info-text">
          <strong>Tip:</strong> Private leagues use invite codes. Ask your league manager for the code after they create a league.
        </p>
      </div>
    </div>
  );
};
