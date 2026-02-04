import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService } from '../services/adminService';
import { PageLoader } from '../components/PageLoader';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { MobileNav } from '../components/MobileNav';
import type { AdminStats } from '../types/admin';

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan';
}> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'stat-card-blue',
    green: 'stat-card-green',
    purple: 'stat-card-purple',
    orange: 'stat-card-orange',
    red: 'stat-card-red',
    cyan: 'stat-card-cyan',
  };

  return (
    <div className={`stat-card ${colorClasses[color]}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-content">
        <h3 className="stat-title">{title}</h3>
        <p className="stat-value">{value.toLocaleString()}</p>
      </div>
    </div>
  );
};

const SimpleBarChart: React.FC<{
  data: { date: string; count: number }[];
  title: string;
  color: string;
}> = ({ data, title, color }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="chart-wrapper">
        <svg viewBox={`0 0 ${data.length * 40} ${chartHeight}`} className="chart-svg">
          {data.map((item, index) => {
            const barHeight = (item.count / maxValue) * (chartHeight - 30);
            const x = index * 40 + 5;
            const y = chartHeight - barHeight - 20;

            return (
              <g key={item.date}>
                <rect
                  x={x}
                  y={y}
                  width="30"
                  height={barHeight}
                  fill={color}
                  rx="4"
                  className="chart-bar"
                />
                <text
                  x={x + 15}
                  y={y - 5}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                >
                  {item.count}
                </text>
                <text
                  x={x + 15}
                  y={chartHeight - 5}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#6b7280"
                >
                  {new Date(item.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user is superuser
  useEffect(() => {
    if (user && !user.is_superuser) {
      showError('Access Denied', 'You do not have permission to access this page');
      navigate('/dashboard');
    }
  }, [user, navigate, showError]);

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const data = await adminService.getStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      const message = (err as Error).message || 'Failed to load admin statistics';
      setError(message);
      showError('Error', message);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [showError]);

  // Initial load
  useEffect(() => {
    if (user?.is_superuser) {
      fetchStats();
    }
  }, [user, fetchStats]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!user?.is_superuser) return;

    const interval = setInterval(() => {
      fetchStats(false);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, fetchStats]);

  const handleManualRefresh = () => {
    fetchStats(false);
    showSuccess('Success', 'Statistics refreshed');
  };

  if (loading) {
    return <PageLoader message="Loading admin statistics..." />;
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to Load Statistics"
        message={error}
        onRetry={() => fetchStats(true)}
      />
    );
  }

  if (!stats) {
    return (
      <ErrorDisplay
        title="No Data Available"
        message="Unable to retrieve admin statistics. Please try again."
        onRetry={() => fetchStats(true)}
      />
    );
  }

  return (
    <div className="page-container">
      <nav className="page-nav">
        <div className="nav-brand">
          <h1>FantasyF1 Admin</h1>
        </div>
        <div className="nav-links">
          <a href="/dashboard" className="nav-link">Back to Dashboard</a>
        </div>
      </nav>

      <MobileNav />

      <main className="page-content">
        <div className="admin-header">
          <div className="admin-title-section">
            <h1 className="page-title">Platform Statistics</h1>
            {lastUpdated && (
              <p className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {isRefreshing && <span className="refreshing-indicator"> (refreshing...)</span>}
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

        {/* Statistics Grid */}
        <div className="stats-grid">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon="👥"
            color="blue"
          />
          <StatCard
            title="Active Users (7d)"
            value={stats.active_users_7d}
            icon="📈"
            color="green"
          />
          <StatCard
            title="Total Leagues"
            value={stats.total_leagues}
            icon="🏆"
            color="purple"
          />
          <StatCard
            title="Active Leagues"
            value={stats.active_leagues}
            icon="⚡"
            color="orange"
          />
          <StatCard
            title="Completed Races"
            value={stats.completed_races}
            icon="🏁"
            color="red"
          />
          <StatCard
            title="Upcoming Races"
            value={stats.upcoming_races}
            icon="📅"
            color="cyan"
          />
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <SimpleBarChart
            data={stats.user_registrations_by_day}
            title="User Registrations (Last 30 Days)"
            color="#3b82f6"
          />
          <SimpleBarChart
            data={stats.league_creations_by_day}
            title="League Creations (Last 30 Days)"
            color="#8b5cf6"
          />
        </div>

        {/* Admin Navigation Cards */}
        <div className="admin-nav-section">
          <h2 className="section-title">Admin Tools</h2>
          <div className="admin-nav-grid">
            <a href="/admin/error-logs" className="admin-nav-card">
              <div className="admin-nav-icon">🐛</div>
              <div className="admin-nav-content">
                <h3>Error Logs</h3>
                <p>View and manage system error logs</p>
              </div>
            </a>
            <a href="/admin/health" className="admin-nav-card">
              <div className="admin-nav-icon">💓</div>
              <div className="admin-nav-content">
                <h3>System Health</h3>
                <p>Monitor API, database, and cache status</p>
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

export default AdminDashboard;
