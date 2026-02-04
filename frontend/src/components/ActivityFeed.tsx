import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { activityLogService, type GetActivitiesParams } from '../services/activityLogService';
import type { ActivityLog, ActivityType } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface ActivityFeedProps {
  leagueId: string;
  limit?: number;
  showFilter?: boolean;
  refreshInterval?: number; // Auto-refresh interval in seconds (default: 60)
  autoRefresh?: boolean; // Enable/disable auto-refresh (default: true)
}

const getActivityIcon = (type: ActivityType): string => {
  const icons: Record<ActivityType, string> = {
    member_joined: '👋',
    team_created: '🏎️',
    draft_pick_made: '🎯',
    race_completed: '🏁',
    points_updated: '🏆',
    league_created: '🏛️',
    invitation_sent: '💌',
    invitation_accepted: '✅',
  };
  return icons[type] || '📋';
};

const getActivityColor = (type: ActivityType): string => {
  const colors: Record<ActivityType, string> = {
    member_joined: 'var(--primary-color)',
    team_created: 'var(--secondary-color)',
    draft_pick_made: 'var(--accent-color)',
    race_completed: '#28a745',
    points_updated: '#ffc107',
    league_created: '#17a2b8',
    invitation_sent: '#6f42c1',
    invitation_accepted: '#20c997',
  };
  return colors[type] || 'var(--text-secondary)';
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

const activityTypeLabels: Record<ActivityType, string> = {
  member_joined: 'Member Joined',
  team_created: 'Team Created',
  draft_pick_made: 'Draft Pick',
  race_completed: 'Race Completed',
  points_updated: 'Points Updated',
  league_created: 'League Created',
  invitation_sent: 'Invitation Sent',
  invitation_accepted: 'Invitation Accepted',
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  leagueId,
  limit = 20,
  showFilter = true,
  refreshInterval = 60,
  autoRefresh = true,
}) => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [filterType, setFilterType] = useState<ActivityType | ''>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!leagueId) return;

    setLoading(true);
    setError(null);

    try {
      const params: GetActivitiesParams = {
        skip,
        limit,
      };

      if (filterType) {
        params.activity_type = filterType;
      }

      const response = await activityLogService.getLeagueActivities(leagueId, params);
      setActivities(response.activities);
      setTotal(response.total);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [leagueId, skip, limit, filterType]);

  // Initial fetch
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Auto-refresh with interval
  useEffect(() => {
    if (!autoRefresh || !leagueId) return;

    const intervalId = setInterval(() => {
      fetchActivities();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, leagueId, refreshInterval, fetchActivities]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = e.target.value as ActivityType | '';
    setFilterType(newFilter);
    setSkip(0); // Reset pagination when filter changes
  };

  const handleLoadMore = () => {
    setSkip((prev) => prev + limit);
  };

  const hasMore = skip + activities.length < total;

  if (loading && activities.length === 0) {
    return (
      <div className="activity-feed-loading">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <h3 className="activity-feed-title">
          <span className="title-icon">📊</span>
          League Activity
        </h3>
        <div className="activity-feed-header-right">
          {autoRefresh && lastUpdated && (
            <span className="activity-feed-last-updated">
              Updated {formatTimeAgo(lastUpdated.toISOString())}
            </span>
          )}
          {showFilter && (
            <div className="activity-feed-filter">
              <select
                value={filterType}
                onChange={handleFilterChange}
                className="filter-select"
                aria-label="Filter activities by type"
              >
                <option value="">All Activities</option>
                {(Object.keys(activityTypeLabels) as ActivityType[]).map((type) => (
                  <option key={type} value={type}>
                    {activityTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="activity-feed-error">
          <p>{error}</p>
          <button onClick={fetchActivities} className="retry-btn">
            Retry
          </button>
        </div>
      )}

      <div className="activity-feed-list">
        {activities.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No Activities Yet"
            description="Activities will appear here as members join, teams are created, and events happen in your league."
          />
        ) : (
          <>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
            {hasMore && (
              <div className="activity-feed-load-more">
                <button
                  onClick={handleLoadMore}
                  className="load-more-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface ActivityItemProps {
  activity: ActivityLog;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const icon = getActivityIcon(activity.activity_type);
  const color = getActivityColor(activity.activity_type);

  // Build link based on reference type
  const getActivityLink = (): string | undefined => {
    if (!activity.reference_id || !activity.reference_type) return undefined;

    switch (activity.reference_type) {
      case 'team':
        return `/teams/${activity.reference_id}`;
      case 'race':
        return `/races/${activity.reference_id}`;
      case 'league':
        return `/leagues/${activity.reference_id}`;
      case 'draft_pick':
        return `/leagues/${activity.league_id}/draft`;
      case 'invitation':
        return `/leagues/${activity.league_id}/invitations`;
      default:
        return undefined;
    }
  };

  const link = getActivityLink();
  const timeAgo = formatTimeAgo(activity.created_at);

  const content = (
    <>
      <div className="activity-icon-wrapper" style={{ borderColor: color }}>
        <span className="activity-icon">{icon}</span>
      </div>
      <div className="activity-content">
        <p className="activity-title">{activity.title}</p>
        <p className="activity-message">{activity.message}</p>
        <span className="activity-time">{timeAgo}</span>
      </div>
    </>
  );

  return (
    <div className="activity-item">
      {link ? (
        <Link to={link} className="activity-link">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
};

export default ActivityFeed;
