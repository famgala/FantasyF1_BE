import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboardData } from "../../services/dashboardService";
import { DashboardData } from "../../services/dashboardService";
import QuickStats from "../../components/dashboard/QuickStats/QuickStats";
import RaceCountdown from "../../components/dashboard/RaceCountdown/RaceCountdown";
import LeagueCard from "../../components/dashboard/LeagueCard/LeagueCard";
import ActivityFeed from "../../components/dashboard/ActivityFeed/ActivityFeed";
import { NoLeagueState } from "../../components/dashboard/NoLeagueState/NoLeagueState";
import { CardSkeleton, ListSkeleton, LoadingSpinner } from "../../components/loading";
import * as S from "./DashboardPage.scss";

/**
 * Dashboard Page Component
 * 
 * Main user dashboard displaying:
 * - Quick stats (total points, leagues, races completed)
 * - Next race countdown
 * - User's fantasy leagues
 * - Recent activity feed
 */
const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (err) {
        setError("Failed to load dashboard data. Please try again later.");
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLeagueClick = (leagueId: string) => {
    navigate(`/leagues/${leagueId}`);
  };

  if (loading) {
    return (
      <S.DashboardPage>
        <S.Header>
          <S.HeaderContent>
            <S.Title>Loading your dashboard...</S.Title>
          </S.HeaderContent>
        </S.Header>

        <S.Content>
          <S.TopSection>
            <CardSkeleton />
          </S.TopSection>

          <S.MainSection>
            <S.LeftColumn>
              <CardSkeleton />
              <S.LeaguesSection>
                <S.SectionTitle>Your Leagues</S.SectionTitle>
                <S.LeaguesGrid>
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </S.LeaguesGrid>
              </S.LeaguesSection>
            </S.LeftColumn>

            <S.RightColumn>
              <CardSkeleton />
            </S.RightColumn>
          </S.MainSection>
        </S.Content>
      </S.DashboardPage>
    );
  }

  if (error || !data) {
    return (
      <S.DashboardPage>
        <S.ErrorState>
          <S.ErrorIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </S.ErrorIcon>
          <S.ErrorMessage>{error || "No data available"}</S.ErrorMessage>
        </S.ErrorState>
      </S.DashboardPage>
    );
  }

  return (
    <S.DashboardPage>
      <S.Header>
        <S.HeaderContent>
          <S.Title>Welcome back, {data.user.username}!</S.Title>
          <S.Subtitle>Your Fantasy F1 Dashboard</S.Subtitle>
        </S.HeaderContent>
      </S.Header>

      <S.Content>
        <S.TopSection>
          <QuickStats data={data.user} />
        </S.TopSection>

        <S.MainSection>
          <S.LeftColumn>
            <RaceCountdown data={data.next_race} />
            <S.LeaguesSection>
              <S.SectionTitle>Your Leagues</S.SectionTitle>
              {data.leagues.length === 0 ? (
                <NoLeagueState username={data.user.username} />
              ) : (
                <S.LeaguesGrid>
                  {data.leagues.map((league) => (
                    <LeagueCard
                      key={league.id}
                      league={league}
                      onClick={() => handleLeagueClick(league.id)}
                    />
                  ))}
                </S.LeaguesGrid>
              )}
            </S.LeaguesSection>
          </S.LeftColumn>

          <S.RightColumn>
            <ActivityFeed activities={data.activities} />
          </S.RightColumn>
        </S.MainSection>
      </S.Content>
    </S.DashboardPage>
  );
};

export default DashboardPage;
