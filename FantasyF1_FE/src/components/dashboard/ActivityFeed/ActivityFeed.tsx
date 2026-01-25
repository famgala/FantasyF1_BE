import React from 'react';
import { Activity } from '../../../services/dashboardService';
import * as S from './ActivityFeed.scss';

interface ActivityFeedProps {
  activities: Activity[];
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return then.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: then.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const getActivityIcon = (type: string): React.ReactNode => {
    switch (type.toLowerCase()) {
      case 'league_joined':
        return (
          <S.ActivityIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </S.ActivityIcon>
        );
      case 'points_scored':
        return (
          <S.ActivityIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </S.ActivityIcon>
        );
      case 'draft_completed':
        return (
          <S.ActivityIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </S.ActivityIcon>
        );
      case 'race_result':
        return (
          <S.ActivityIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10 8 16 12 10 16 10 8"></polygon>
          </S.ActivityIcon>
        );
      case 'team_update':
        return (
          <S.ActivityIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </S.ActivityIcon>
        );
      default:
        return (
          <S.ActivityIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </S.ActivityIcon>
        );
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <S.ActivityFeed>
        <S.FeedTitle>Recent Activity</S.FeedTitle>
        <S.EmptyState>
          <S.EmptyIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </S.EmptyIcon>
          <S.EmptyMessage>No recent activity</S.EmptyMessage>
          <S.EmptySubmessage>Start by joining a league!</S.EmptySubmessage>
        </S.EmptyState>
      </S.ActivityFeed>
    );
  }

  return (
    <S.ActivityFeed>
      <S.FeedTitle>Recent Activity</S.FeedTitle>
      <S.ActivityList>
        {activities.map((activity) => (
          <S.ActivityItem key={activity.id}>
            <S.ActivityIconWrapper type={activity.type}>
              {getActivityIcon(activity.type)}
            </S.ActivityIconWrapper>
            <S.ActivityContent>
              <S.ActivityMessage>{activity.message}</S.ActivityMessage>
              <S.ActivityTimestamp>{formatRelativeTime(activity.timestamp)}</S.ActivityTimestamp>
            </S.ActivityContent>
          </S.ActivityItem>
        ))}
      </S.ActivityList>
    </S.ActivityFeed>
  );
};

export default ActivityFeed;
