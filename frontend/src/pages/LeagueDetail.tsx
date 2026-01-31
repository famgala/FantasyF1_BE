import { useParams } from 'react-router-dom';
import { getLeagueById } from '../services/leagueService';
import type { League } from '../types';
import { useState, useEffect } from 'react';

export default function LeagueDetail() {
  const { id } = useParams<{ id: string }>();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeague = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const leagueData = await getLeagueById(id);
        setLeague(leagueData);
      } catch (err: any) {
        console.error('Error fetching league:', err);
        setError(err.response?.data?.detail || 'Failed to load league details');
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
  }, [id]);

  if (loading) {
    return (
      <div className="league-detail">
        <div className="loading-spinner">Loading league details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="league-detail">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="league-detail">
        <div className="alert alert-error">League not found</div>
      </div>
    );
  }

  return (
    <div className="league-detail">
      <div className="league-header">
        <h1>{league.name}</h1>
        <div className="league-meta">
          <span className={`badge badge-${league.privacy}`}>{league.privacy}</span>
          <span className="league-code">Code: {league.code}</span>
        </div>
      </div>

      <div className="league-info">
        <div className="info-section">
          <h3>Description</h3>
          <p>{league.description || 'No description provided'}</p>
        </div>

        <div className="info-section">
          <h3>League Settings</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <span className="setting-label">Maximum Teams:</span>
              <span className="setting-value">{league.max_teams}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Draft Method:</span>
              <span className="setting-value">{league.draft_method}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Draft Close Condition:</span>
              <span className="setting-value">{league.draft_close_condition}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Created:</span>
              <span className="setting-value">{new Date(league.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="info-section">
          <h3>Actions</h3>
          <p className="info-note">
            More features coming soon! This page will be fully implemented in US-005.
          </p>
        </div>
      </div>
    </div>
  );
}