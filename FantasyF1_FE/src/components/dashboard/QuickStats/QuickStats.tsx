import React from 'react';
import { DashboardData } from '../../../services/dashboardService';
import * as S from './QuickStats.scss';

interface QuickStatsProps {
  data: DashboardData['user'];
}

const QuickStats: React.FC<QuickStatsProps> = ({ data }) => {
  const stats = [
    {
      label: 'Total Points',
      value: data.total_points,
      icon: (
        <S.PointsIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </S.PointsIcon>
      ),
      color: '#E10600',
      suffix: ' pts',
    },
    {
      label: 'Leagues',
      value: data.leagues_count,
      icon: (
        <S.LeaguesIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </S.LeaguesIcon>
      ),
      color: '#0066CC',
      suffix: '',
    },
    {
      label: 'Races Completed',
      value: data.races_completed,
      icon: (
        <S.RacesIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="10 8 16 12 10 16 10 8"></polygon>
        </S.RacesIcon>
      ),
      color: '#00A651',
      suffix: data.races_completed === 1 ? '' : 's',
    },
  ];

  return (
    <S.QuickStats>
      {stats.map((stat, index) => (
        <S.StatCard key={index} color={stat.color}>
          <S.StatIcon color={stat.color}>{stat.icon}</S.StatIcon>
          <S.StatValue>
            {stat.value.toLocaleString()}
            {stat.suffix}
          </S.StatValue>
          <S.StatLabel>{stat.label}</S.StatLabel>
        </S.StatCard>
      ))}
    </S.QuickStats>
  );
};

export default QuickStats;
