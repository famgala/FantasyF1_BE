import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getPlatformStats,
  getSystemHealth,
  PlatformStats,
  SystemHealth,
} from "../../services/adminService";
import "./AdminDashboardPage.scss";

/**
 * Admin Dashboard Page Component
 * 
 * Admin-only dashboard showing platform statistics, user metrics,
 * activity graphs, and system health status.
 */
const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  /**
   * Load all dashboard data
   */
  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, healthData] = await Promise.all([
        getPlatformStats(),
        getSystemHealth(),
      ]);
      setStats(statsData);
      setHealth(healthData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get status color class
   */
  const getStatusClass = (status: string): string => {
    switch (status) {
      case "healthy":
        return "admin-dashboard__status--healthy";
      case "degraded":
        return "admin-dashboard__status--degraded";
      case "down":
        return "admin-dashboard__status--down";
      default:
        return "";
    }
  };

  /**
   * Format number with commas
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  /**
   * Calculate max value for chart scaling
   */
  const getMaxValue = (data: { count: number }[]): number => {
    return Math.max(...data.map((d) => d.count), 1);
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard admin-dashboard--loading">
        <div className="admin-dashboard__loader">
          <div className="admin-dashboard__spinner" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard admin-dashboard--error">
        <div className="admin-dashboard__error-content">
          <h2>Error Loading Dashboard</h2>
          <p>{error}</p>
          <button
            className="admin-dashboard__retry-button"
            onClick={loadDashboardData}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div className="admin-dashboard__header-content">
          <h1 className="admin-dashboard__title">Admin Dashboard</h1>
          <p className="admin-dashboard__subtitle">
            Platform overview and management
          </p>
        </div>
        <div className="admin-dashboard__header-actions">
          <button
            className="admin-dashboard__refresh-button"
            onClick={loadDashboardData}
            aria-label="Refresh dashboard data"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {/* Quick Stats Cards */}
      <section className="admin-dashboard__stats-grid">
        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon">👥</div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">
              {stats ? formatNumber(stats.totalUsers) : "-"}
            </span>
            <span className="admin-dashboard__stat-label">Total Users</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon">✅</div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">
              {stats ? formatNumber(stats.activeUsers7d) : "-"}
            </span>
            <span className="admin-dashboard__stat-label">
              Active Users (7d)
            </span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon">🏆</div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">
              {stats ? formatNumber(stats.totalLeagues) : "-"}
            </span>
            <span className="admin-dashboard__stat-label">Total Leagues</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon">🔥</div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">
              {stats ? formatNumber(stats.activeLeagues) : "-"}
            </span>
            <span className="admin-dashboard__stat-label">Active Leagues</span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon">🏁</div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">
              {stats ? formatNumber(stats.completedRaces) : "-"}
            </span>
            <span className="admin-dashboard__stat-label">
              Completed Races
            </span>
          </div>
        </div>

        <div className="admin-dashboard__stat-card">
          <div className="admin-dashboard__stat-icon">📅</div>
          <div className="admin-dashboard__stat-content">
            <span className="admin-dashboard__stat-value">
              {stats ? formatNumber(stats.upcomingRaces) : "-"}
            </span>
            <span className="admin-dashboard__stat-label">Upcoming Races</span>
          </div>
        </div>
      </section>

      {/* Charts Section */}
      <section className="admin-dashboard__charts">
        <div className="admin-dashboard__chart-card">
          <h3 className="admin-dashboard__chart-title">
            User Registrations (Last 30 Days)
          </h3>
          <div className="admin-dashboard__chart">
            {stats && stats.registrationsByDay.length > 0 ? (
              <div className="admin-dashboard__bar-chart">
                {stats.registrationsByDay.map((day, index) => (
                  <div
                    key={day.date}
                    className="admin-dashboard__bar-container"
                    title={`${day.date}: ${day.count} registrations`}
                  >
                    <div
                      className="admin-dashboard__bar"
                      style={{
                        height: `${(day.count / getMaxValue(stats.registrationsByDay)) * 100}%`,
                      }}
                    />
                    {index % 5 === 0 && (
                      <span className="admin-dashboard__bar-label">
                        {day.date.slice(5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-dashboard__chart-empty">No data available</div>
            )}
          </div>
        </div>

        <div className="admin-dashboard__chart-card">
          <h3 className="admin-dashboard__chart-title">
            League Creation (Last 30 Days)
          </h3>
          <div className="admin-dashboard__chart">
            {stats && stats.leaguesByDay.length > 0 ? (
              <div className="admin-dashboard__bar-chart">
                {stats.leaguesByDay.map((day, index) => (
                  <div
                    key={day.date}
                    className="admin-dashboard__bar-container"
                    title={`${day.date}: ${day.count} leagues`}
                  >
                    <div
                      className="admin-dashboard__bar admin-dashboard__bar--secondary"
                      style={{
                        height: `${(day.count / getMaxValue(stats.leaguesByDay)) * 100}%`,
                      }}
                    />
                    {index % 5 === 0 && (
                      <span className="admin-dashboard__bar-label">
                        {day.date.slice(5)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-dashboard__chart-empty">No data available</div>
            )}
          </div>
        </div>
      </section>

      {/* System Health Section */}
      <section className="admin-dashboard__health">
        <h2 className="admin-dashboard__section-title">System Health</h2>
        <div className="admin-dashboard__health-grid">
          <div className="admin-dashboard__health-card">
            <div className="admin-dashboard__health-header">
              <span className="admin-dashboard__health-name">API Server</span>
              <span
                className={`admin-dashboard__status ${getStatusClass(health?.api || "down")}`}
              >
                {health?.api || "Unknown"}
              </span>
            </div>
            <div className="admin-dashboard__health-detail">
              Response Time: {health?.responseTimes.api || "-"}ms
            </div>
          </div>

          <div className="admin-dashboard__health-card">
            <div className="admin-dashboard__health-header">
              <span className="admin-dashboard__health-name">Database</span>
              <span
                className={`admin-dashboard__status ${getStatusClass(health?.database || "down")}`}
              >
                {health?.database || "Unknown"}
              </span>
            </div>
            <div className="admin-dashboard__health-detail">
              Response Time: {health?.responseTimes.database || "-"}ms
            </div>
          </div>

          <div className="admin-dashboard__health-card">
            <div className="admin-dashboard__health-header">
              <span className="admin-dashboard__health-name">Redis Cache</span>
              <span
                className={`admin-dashboard__status ${getStatusClass(health?.redis || "down")}`}
              >
                {health?.redis || "Unknown"}
              </span>
            </div>
            <div className="admin-dashboard__health-detail">
              Response Time: {health?.responseTimes.redis || "-"}ms
            </div>
          </div>

          <div className="admin-dashboard__health-card">
            <div className="admin-dashboard__health-header">
              <span className="admin-dashboard__health-name">Celery Workers</span>
              <span
                className={`admin-dashboard__status ${getStatusClass(health?.celery || "down")}`}
              >
                {health?.celery || "Unknown"}
              </span>
            </div>
            <div className="admin-dashboard__health-detail">
              Background task processing
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="admin-dashboard__actions">
        <h2 className="admin-dashboard__section-title">Quick Actions</h2>
        <div className="admin-dashboard__actions-grid">
          <Link to="/admin/users" className="admin-dashboard__action-card">
            <span className="admin-dashboard__action-icon">👥</span>
            <span className="admin-dashboard__action-title">Manage Users</span>
            <span className="admin-dashboard__action-description">
              View, edit, and manage user accounts
            </span>
          </Link>

          <Link to="/admin/leagues" className="admin-dashboard__action-card">
            <span className="admin-dashboard__action-icon">🏆</span>
            <span className="admin-dashboard__action-title">Manage Leagues</span>
            <span className="admin-dashboard__action-description">
              View and moderate leagues
            </span>
          </Link>

          <Link to="/admin/logs" className="admin-dashboard__action-card">
            <span className="admin-dashboard__action-icon">📋</span>
            <span className="admin-dashboard__action-title">Error Logs</span>
            <span className="admin-dashboard__action-description">
              View system errors and warnings
            </span>
          </Link>

          <Link to="/admin/races" className="admin-dashboard__action-card">
            <span className="admin-dashboard__action-icon">🏎️</span>
            <span className="admin-dashboard__action-title">Race Data</span>
            <span className="admin-dashboard__action-description">
              Sync and manage race data
            </span>
          </Link>

          <Link to="/admin/notifications" className="admin-dashboard__action-card">
            <span className="admin-dashboard__action-icon">📢</span>
            <span className="admin-dashboard__action-title">
              Broadcast Notification
            </span>
            <span className="admin-dashboard__action-description">
              Send system-wide announcements
            </span>
          </Link>

          <Link to="/admin/settings" className="admin-dashboard__action-card">
            <span className="admin-dashboard__action-icon">⚙️</span>
            <span className="admin-dashboard__action-title">System Settings</span>
            <span className="admin-dashboard__action-description">
              Configure platform settings
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboardPage;
