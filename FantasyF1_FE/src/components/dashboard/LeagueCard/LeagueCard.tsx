import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLeagueData } from '../../../services/dashboardService';
import * as S from './LeagueCard.scss';

interface LeagueCardProps {
  leagueData: UserLeagueData;
}

const LeagueCard: React.FC<LeagueCardProps> = ({ leagueData }) => {
  const navigate = useNavigate();
  const { league, constructor } = leagueData;

  const handleCardClick = () => {
    navigate(`/leagues/${league.id}`);
  };

  const getRankBadgeColor = (rank: number): string => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#666666';
  };

  return (
    <S.LeagueCard onClick={handleCardClick} role="button" tabIndex={0} aria-label={`View ${league.name} league`}>
      <S.LeagueCardHeader>
        <S.LeagueName>{league.name}</S.LeagueName>
        {league.is_private && (
          <S.PrivateBadge aria-label="Private league">
            <S.LockIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </S.LockIcon>
            Private
          </S.PrivateBadge>
        )}
      </S.LeagueCardHeader>

      <S.LeagueCardContent>
        <S.TeamName>{constructor.team_name}</S.TeamName>
        
        <S.StatsRow>
          <S.StatItem>
            <S.StatLabel>Rank</S.StatLabel>
            <S.RankBadge color={getRankBadgeColor(constructor.rank)}>
              #{constructor.rank}
            </S.RankBadge>
          </S.StatItem>
          
          <S.StatItem>
            <S.StatLabel>Points</S.StatLabel>
            <S.StatValue>{constructor.total_points}</S.StatValue>
          </S.StatItem>
        </S.StatsRow>

        {league.description && (
          <S.LeagueDescription>{league.description}</S.LeagueDescription>
        )}
      </S.LeagueCardContent>

      <S.LeagueCardFooter>
        <S.ClickToView>Click to view league →</S.ClickToView>
      </S.LeagueCardFooter>
    </S.LeagueCard>
  );
};

export default LeagueCard;
