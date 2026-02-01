import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDraftOrder } from '../services/draftService';
import { getLeagueById } from '../services/leagueService';
import { useAuth } from '../context/AuthContext';
import type { DraftOrder } from '../types';

export default function ViewDraftOrder() {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [league, setLeague] = useState<any>(null);
  const [draftOrder, setDraftOrder] = useState<DraftOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!leagueId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch league and draft order in parallel
        const [leagueData, draftOrderData] = await Promise.all([
          getLeagueById(leagueId),
          getDraftOrder(leagueId),
        ]);

        setLeague(leagueData);
        setDraftOrder(draftOrderData);
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('Draft order has not been created yet');
        } else {
          setError(err.response?.data?.detail || 'Failed to load draft order');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leagueId]);

  const getDraftMethodLabel = (method: string) => {
    switch (method) {
      case 'random':
        return 'Random';
      case 'sequential':
        return 'Sequential';
      case 'snake':
        return 'Snake';
      default:
        return method;
    }
  };

  const getDraftMethodDescription = (method: string) => {
    switch (method) {
      case 'random':
        return 'Teams were assigned random draft positions';
      case 'sequential':
        return 'Teams pick in the same order each round';
      case 'snake':
        return 'Draft order reverses each round (1-2-3, 3-2-1)';
      default:
        return '';
    }
  };

  const isMyTeam = (userId: string) => {
    return user?.id === userId;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Draft Order</h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/leagues/${leagueId}`)}
          >
            Back to League
          </button>
        </div>
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  if (!draftOrder || !draftOrder.draft_orders || draftOrder.draft_orders.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Draft Order</h1>
          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/leagues/${leagueId}`)}
          >
            Back to League
          </button>
        </div>
        <div className="empty-state">
          <h3>No Draft Order Created</h3>
          <p>The draft order has not been created yet.</p>
          <p>Contact the league creator to create the draft order.</p>
        </div>
      </div>
    );
  }

  // Calculate number of rounds based on draft method
  const totalTeams = draftOrder.draft_orders.length;
  const totalRounds = 5; // Default to 5 rounds (can be configured)

  // Organize draft order by round
  const draftByRound: Record<number, typeof draftOrder.draft_orders> = {};
  draftOrder.draft_orders.forEach((order) => {
    const round = Math.ceil(order.draft_order_number / totalTeams);
    if (!draftByRound[round]) {
      draftByRound[round] = [];
    }
    draftByRound[round].push(order);
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Draft Order</h1>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/leagues/${leagueId}`)}
        >
          Back to League
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>League: {league?.name}</h2>
        </div>
        <div className="card-body">
          <div className="draft-info-section">
            <div className="draft-info-item">
              <span className="draft-info-label">Draft Method:</span>
              <span className="draft-info-value">{getDraftMethodLabel(draftOrder.draft_method)}</span>
            </div>
            <div className="draft-info-item">
              <span className="draft-info-label">Total Teams:</span>
              <span className="draft-info-value">{totalTeams}</span>
            </div>
            <div className="draft-info-item">
              <span className="draft-info-label">Total Rounds:</span>
              <span className="draft-info-value">{totalRounds}</span>
            </div>
          </div>

          <div className="draft-method-description">
            {getDraftMethodDescription(draftOrder.draft_method)}
          </div>

          {isMyTeam(draftOrder.draft_orders[0]?.user_id) && (
            <div className="info-banner">
              <p>💡 Your team is highlighted in the draft order below.</p>
            </div>
          )}
        </div>
      </div>

      <div className="draft-order-container">
        {Object.entries(draftByRound).map(([round, orders]) => (
          <div key={round} className="draft-round">
            <h3 className="draft-round-title">Round {round}</h3>
            <div className="draft-round-table">
              <div className="draft-table-header">
                <div className="draft-table-cell draft-table-cell-pick">Pick</div>
                <div className="draft-table-cell draft-table-cell-team">Team</div>
                <div className="draft-table-cell draft-table-cell-owner">Owner</div>
              </div>
              {orders.map((order) => (
                <div
                  key={order.team_id}
                  className={`draft-table-row ${isMyTeam(order.user_id) ? 'my-team' : ''}`}
                >
                  <div className="draft-table-cell draft-table-cell-pick">
                    <span className="pick-number">#{order.draft_order_number}</span>
                  </div>
                  <div className="draft-table-cell draft-table-cell-team">
                    <span className="team-name">{order.team_name}</span>
                    {isMyTeam(order.user_id) && <span className="my-team-badge">You</span>}
                  </div>
                  <div className="draft-table-cell draft-table-cell-owner">
                    <span className="owner-name">User ID: {order.user_id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="draft-legend">
        <div className="legend-item">
          <span className="legend-indicator my-team-indicator"></span>
          <span>Your Team</span>
        </div>
      </div>
    </div>
  );
}