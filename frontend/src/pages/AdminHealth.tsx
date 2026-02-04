import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService } from '../services/adminService';
import { PageLoader } from '../components/PageLoader';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { MobileNav } from '../components/MobileNav';
import type { HealthStatus, ComponentHealth } from '../types/admin';

const statusColors = {
  healthy: '#22c55e',
  degraded: '#f59e0b',
  unhealthy: '#ef4444',
};

const statusBgColors = {
  healthy: 'status-healthy',
  degraded: 'status-degraded',
  unhealthy: 'status-unhealthy',
};

const statusIcons = {
  healthy: '✓',
  degraded: '⚠',
  unhealthy: '✕',
};

const ComponentHealthCard: React.FC<{
  title: string;
  icon: string;
  health: ComponentHealth;
}> = ({ title, icon, health }) => {
  return (
    <div className={`health-card ${statusBgColors[health.status]}`}>
      <div className="health-card-header">
        <div className="health-card-icon">{icon}</div>
        <div
          className="health-status-badge"
          style={{ backgroundColor: statusColors[health.status] }}
        >
          {statusIcons[health.status]} {health.status}
        </div>
      </div>
      <h3 className="health-card-title">{title}</h3>
      <div className="health-card-metrics">
        <div className="health-metric">
          <span className="health-metric-label">Response Time</span>
          <span className="health-metric-value">{health.response_time_ms}ms</span>
        </div>
        {health.message && (
          <div className="health-message">
            <span className="health-message-label">Message:</span>
            <span className="health-message-text">{health.message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminHealth: React.FC = () => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();

  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user is superuser
  useEffect(() => {
    if (user && !user.is_superuser) {
      showError('Access Denied', 'You do not have permission to access this page');
      navigate('/dashboard');
    }
  }, [user, navigate, showError]);

  const fetchHealth = useCallback(
    async (showLoading = true) => {
      if (showLoading) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const data = await adminService.getHealthStatus();
        setHealth(data);
      } catch (err) {
        const message =
          (err as Error).message || 'Failed to load system health status';
        setError(message);
        showError('Error', message);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [showError]
  );

  // Initial load
  useEffect(() => {
    if (user?.is_superuser) {
      fetchHealth();
    }
  }, [user, fetchHealth]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user?.is_superuser) return;

    const interval = setInterval(() => {
      fetchHealth(false);
    }, 30 * 1000); // 30 seconds

    return () => clearInterval(interval);
  }, [user, fetchHealth]);

  const handleManualRefresh = () => {
    fetchHealth(false);
    showSuccess('Success', 'Health status refreshed');
  };

  const isAnyComponentUnhealthy = (healthData: HealthStatus): boolean => {
    return (
      healthData.components.api.status === 'unhealthy' ||
      healthData.components.database.status === 'unhealthy' ||
      healthData.components.redis.status === 'unhealthy' ||
      healthData.components.celery.status === 'unhealthy'
    );
  };

  const isAnyComponentDegraded = (healthData: HealthStatus): boolean => {
    return (
      healthData.components.api.status === 'degraded' ||
      healthData.components.database.status === 'degraded' ||
      healthData.components.redis.status === 'degraded' ||
      healthData.components.celery.status === 'degraded'
    );
  };

  if (loading) {
    return <PageLoader message="Loading system health status..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to Load Health Status"
        message={error}
        onRetry={() => fetchHealth(true)}
      />
    );
  }

  if (!health) {
    return (
      <ErrorDisplay
        title="No Data Available"
        message="Unable to retrieve system health status. Please try again."
        onRetry={() => fetchHealth(true)}
      />
    );
  }

  const overallStatusColor = statusColors[health.overall_status];
  const showUnhealthyAlert = isAnyComponentUnhealthy(health);
  const showDegradedAlert = isAnyComponentDegraded(health) && !showUnhealthyAlert;

  return (
    <div className="page-container">
      <nav className="page-nav">
        <div className="nav-brand">
          <h1>FantasyF1 Admin</h1>
        </div>
        <div className="nav-links">
          <a href="/admin" className="nav-link">
            ← Back to Admin
          </a>
          <a href="/dashboard" className="nav-link">
            Dashboard
          </a>
        </div>
      </nav>

      <MobileNav />

      <main className="page-content">
        <div className="admin-header">
          <div className="admin-title-section">
            <h1 className="page-title">System Health Monitoring</h1>
            {health.last_checked && (
              <p className="last-updated">
                Last checked: {new Date(health.last_checked).toLocaleTimeString()}
                {isRefreshing && (
                  <span className="refreshing-indicator"> (refreshing...)</span>
                )}
              </p>
            )}
          </div>
          <div className="admin-actions">
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="btn btn-secondary"
            >
              {isRefreshing ? '⟳ Refreshing...' : '↻ Refresh Now'}
            </button>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div
          className="overall-status-banner"
          style={{ backgroundColor: overallStatusColor }}
        >
          <div className="overall-status-content">
            <span className="overall-status-icon">
              {statusIcons[health.overall_status]}
            </span>
            <span className="overall-status-text">
              System Status: <strong>{health.overall_status.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {/* Alert Banners */}
        {showUnhealthyAlert && (
          <div className="alert-banner alert-error">
            <span className="alert-icon">🚨</span>
            <span className="alert-text">
              One or more components are unhealthy. Please investigate immediately.
            </span>
          </div>
        )}

        {showDegradedAlert && (
          <div className="alert-banner alert-warning">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">
              One or more components are experiencing degraded performance.
            </span>
          </div>
        )}

        {/* Components Grid */}
        <div className="health-components-grid">
          <ComponentHealthCard
            title="API Service"
            icon="🔌"
            health={health.components.api}
          />
          <ComponentHealthCard
            title="Database"
            icon="🗄️"
            health={health.components.database}
          />
          <ComponentHealthCard
            title="Redis Cache"
            icon="⚡"
            health={health.components.redis}
          />
          <ComponentHealthCard
            title="Celery Task Queue"
            icon="📋"
            health={health.components.celery}
          />
        </div>

        {/* Legend */}
        <div className="health-legend">
          <h3 className="legend-title">Status Legend</h3>
          <div className="legend-items">
            <div className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: statusColors.healthy }}
              ></span>
              <span className="legend-text">
                <strong>Healthy</strong> - Component is operating normally
              </span>
            </div>
            <div className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: statusColors.degraded }}
              ></span>
              <span className="legend-text">
                <strong>Degraded</strong> - Component is slow or experiencing issues
              </span>
            </div>
            <div className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: statusColors.unhealthy }}
              ></span>
              <span className="legend-text">
                <strong>Unhealthy</strong> - Component is down or critically failing
              </span>
            </div>
          </div>
        </div>

        {/* Admin Navigation */}
        <div className="admin-nav-section">
          <h2 className="section-title">Admin Tools</h2>
          <div className="admin-nav-grid">
            <a href="/admin" className="admin-nav-card">
              <div className="admin-nav-icon">📊</div>
              <div className="admin-nav-content">
                <h3>Platform Statistics</h3>
                <p>View platform usage and growth metrics</p>
              </div>
            </a>
            <a href="/admin/error-logs" className="admin-nav-card">
              <div className="admin-nav-icon">🐛</div>
              <div className="admin-nav-content">
                <h3>Error Logs</h3>
                <p>View and manage system error logs</p>
              </div>
            </a>
            <a href="/admin/users" className="admin-nav-card">
              <div className="admin-nav-icon">👤</div>
              <div className="admin-nav-content">
                <h3>User Management</h3>
                <p>Manage user accounts and permissions</p>
              </div>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminHealth;
