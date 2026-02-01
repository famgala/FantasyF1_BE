import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getDriver } from '../services/driverService';
import type { Driver } from '../types';

// Extended driver type to include status from backend
interface DriverWithStatus extends Driver {
  status?: 'active' | 'injured' | 'retired';
}

export default function DriverDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<DriverWithStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Driver ID is required');
      setLoading(false);
      return;
    }

    const fetchDriver = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getDriver(id);
        setDriver(data as DriverWithStatus);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load driver details');
        setDriver(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [id]);

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'active':
        return 'status-badge status-active';
      case 'injured':
        return 'status-badge status-injured';
      case 'retired':
        return 'status-badge status-retired';
      default:
        return 'status-badge status-active';
    }
  };

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'injured':
        return 'Injured';
      case 'retired':
        return 'Retired';
      default:
        return 'Active';
    }
  };

  if (loading) {
    return (
      <div className="driver-detail-container">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading driver details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="driver-detail-container">
        <div className="alert alert-error">
          {error}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/drivers')}
        >
          Back to Drivers
        </button>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="driver-detail-container">
        <div className="empty-state">
          <h3>Driver not found</h3>
          <p>The driver you are looking for does not exist.</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/drivers')}
        >
          Back to Drivers
        </button>
      </div>
    );
  }

  return (
    <div className="driver-detail-container">
      {/* Header Section */}
      <div className="driver-detail-header">
        <div className="header-top">
          <Link to="/drivers" className="back-link">
            ← Back to Drivers
          </Link>
        </div>
        
        <div className="driver-header-content">
          <div className="driver-number-section">
            <div className="driver-number-large">#{driver.number}</div>
            <div className="driver-code-badge">{driver.code}</div>
          </div>
          
          <div className="driver-title-section">
            <h1 className="driver-name-large">{driver.name}</h1>
            <div className="driver-meta">
              <span className={getStatusBadgeClass(driver.status)}>
                {getStatusDisplay(driver.status)}
              </span>
              <span className="driver-country">{driver.country}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="driver-detail-content">
        {/* Team Section */}
        <div className="detail-card team-card">
          <h3>Constructor Team</h3>
          <div className="team-info">
            <div className="team-name">{driver.team}</div>
            <Link to={`/constructors/${encodeURIComponent(driver.team)}`} className="view-team-link">
              View Team Details →
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Price</div>
            <div className="stat-value price-value">${driver.price.toFixed(1)}M</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Total Points</div>
            <div className="stat-value">{driver.total_points.toFixed(1)}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Average Points / Race</div>
            <div className="stat-value">{driver.average_points.toFixed(1)}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Driver Number</div>
            <div className="stat-value">#{driver.number}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Country</div>
            <div className="stat-value">{driver.country}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Code</div>
            <div className="stat-value">{driver.code}</div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="detail-card performance-card">
          <h3>Performance Summary</h3>
          <div className="performance-stats">
            <div className="performance-item">
              <span className="performance-label">Total Points Earned:</span>
              <span className="performance-value">{driver.total_points.toFixed(1)}</span>
            </div>
            <div className="performance-item">
              <span className="performance-label">Average Points per Race:</span>
              <span className="performance-value">{driver.average_points.toFixed(1)}</span>
            </div>
            <div className="performance-item">
              <span className="performance-label">Value Rating:</span>
              <span className={`performance-value ${getValueRatingClass(driver.price, driver.average_points)}`}>
                {getValueRating(driver.price, driver.average_points)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="driver-actions">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/drivers')}
          >
            Back to Drivers
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to calculate value rating based on price and average points
function getValueRating(price: number, avgPoints: number): string {
  if (price === 0) return 'N/A';
  const ratio = avgPoints / price;
  if (ratio >= 5) return 'Excellent';
  if (ratio >= 3) return 'Good';
  if (ratio >= 1.5) return 'Fair';
  return 'Poor';
}

function getValueRatingClass(price: number, avgPoints: number): string {
  if (price === 0) return '';
  const ratio = avgPoints / price;
  if (ratio >= 5) return 'rating-excellent';
  if (ratio >= 3) return 'rating-good';
  if (ratio >= 1.5) return 'rating-fair';
  return 'rating-poor';
}
