import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUpcomingRaces, createDraftOrder } from '../services/draftService';
import { getLeagueById } from '../services/leagueService';
import type { Race, DraftOrder } from '../types';

export default function CreateDraftOrder() {
  const { id: leagueId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [league, setLeague] = useState<any>(null);
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [draftMethod, setDraftMethod] = useState<'random' | 'sequential' | 'snake'>('random');
  const [previewOrder, setPreviewOrder] = useState<DraftOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!leagueId) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch league and upcoming races in parallel
        const [leagueData, racesData] = await Promise.all([
          getLeagueById(leagueId),
          getUpcomingRaces(),
        ]);

        setLeague(leagueData);
        setRaces(racesData);

        // Set default draft method from league settings
        setDraftMethod(leagueData.draft_method || 'random');
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [leagueId]);

  const handlePreview = async () => {
    if (!leagueId || !selectedRaceId) return;

    try {
      setCreating(true);
      setError(null);

      const order = await createDraftOrder(leagueId, selectedRaceId, draftMethod);
      setPreviewOrder(order);
      setShowConfirmModal(true);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('Draft order already exists for this race');
      } else {
        setError(err.response?.data?.detail || 'Failed to create draft order');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleConfirm = () => {
    // Draft order already created in preview, just navigate away
    setShowConfirmModal(false);
    navigate(`/leagues/${leagueId}`);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setPreviewOrder(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error && !league) {
    return (
      <div className="page-container">
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Create Draft Order</h1>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(`/leagues/${leagueId}`)}
        >
          Back to League
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="card-header">
          <h2>League: {league?.name}</h2>
        </div>
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="race">Select Race</label>
            <select
              id="race"
              className="form-control"
              value={selectedRaceId || ''}
              onChange={(e) => setSelectedRaceId(e.target.value ? parseInt(e.target.value) : null)}
              disabled={creating}
            >
              <option value="">-- Select a race --</option>
              {races.map((race) => (
                <option key={race.id} value={race.id}>
                  Round {race.round_number}: {race.name} - {formatDate(race.race_date)}
                </option>
              ))}
            </select>
            <small className="form-text">
              Only upcoming races are available for draft order creation
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="draftMethod">Draft Method</label>
            <select
              id="draftMethod"
              className="form-control"
              value={draftMethod}
              onChange={(e) => setDraftMethod(e.target.value as any)}
              disabled={creating}
            >
              <option value="random">Random</option>
              <option value="sequential">Sequential</option>
              <option value="snake">Snake</option>
            </select>
            <small className="form-text">
              {draftMethod === 'random' && 'Teams are assigned random draft positions'}
              {draftMethod === 'sequential' && 'Teams pick in the same order each round'}
              {draftMethod === 'snake' && 'Draft order reverses each round (1-2-3, 3-2-1)'}
            </small>
          </div>

          <button
            className="btn btn-primary"
            onClick={handlePreview}
            disabled={!selectedRaceId || creating}
          >
            {creating ? 'Creating...' : 'Preview Draft Order'}
          </button>
        </div>
      </div>

      {showConfirmModal && previewOrder && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Draft Order Created</h2>
              <button className="modal-close" onClick={handleCancel}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="success-message">
                Draft order has been successfully created!
              </div>

              <div className="draft-order-preview">
                <h3>Draft Order Preview</h3>
                <div className="draft-info">
                  <p><strong>Race:</strong> {races.find(r => r.id === previewOrder.race_id)?.name}</p>
                  <p><strong>Method:</strong> {previewOrder.draft_method}</p>
                  <p><strong>Total Teams:</strong> {previewOrder.draft_orders.length}</p>
                </div>

                <div className="draft-order-list">
                  {previewOrder.draft_orders.map((order) => (
                    <div key={order.team_id} className="draft-order-item">
                      <span className="draft-position">#{order.draft_order_number}</span>
                      <span className="draft-team-name">{order.team_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="info-banner">
                <p>All league members have been notified that the draft order is ready.</p>
                <p>The draft will begin when the first pick is made.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleConfirm}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}