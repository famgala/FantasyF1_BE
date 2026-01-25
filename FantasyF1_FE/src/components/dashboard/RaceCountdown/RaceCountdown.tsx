import React, { useState, useEffect } from 'react';
import { Race } from '../../../services/dashboardService';
import * as S from './RaceCountdown.scss';

interface RaceCountdownProps {
  race?: Race | null;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const RaceCountdown: React.FC<RaceCountdownProps> = ({ race }) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!race || !race.race_date_time) return;

    const calculateTimeLeft = () => {
      const difference = new Date(race.race_date_time).getTime() - new Date().getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [race]);

  if (!race) {
    return (
      <S.RaceCountdown>
        <S.Content>
          <S.IconWrapper>
            <S.RaceIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </S.RaceIcon>
          </S.IconWrapper>
          <S.RaceName>No upcoming races</S.RaceName>
          <S.CircuitName>Check back later</S.CircuitName>
        </S.Content>
      </S.RaceCountdown>
    );
  }

  const isRaceLive = new Date(race.race_date_time) <= new Date();
  const formattedDate = new Date(race.race_date_time).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = new Date(race.race_date_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <S.RaceCountdown>
      <S.Content>
        <S.IconWrapper>
          {isRaceLive ? (
            <S.LiveIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10"></circle>
            </S.LiveIcon>
          ) : (
            <S.RaceIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </S.RaceIcon>
          )}
        </S.IconWrapper>

        {isRaceLive ? (
          <S.LiveBadge>LIVE NOW</S.LiveBadge>
        ) : (
          <S.Countdown>
            <S.TimeUnit>
              <S.TimeValue>{timeLeft.days}</S.TimeValue>
              <S.TimeLabel>DAYS</S.TimeLabel>
            </S.TimeUnit>
            <S.TimeSeparator>:</S.TimeSeparator>
            <S.TimeUnit>
              <S.TimeValue>{String(timeLeft.hours).padStart(2, '0')}</S.TimeValue>
              <S.TimeLabel>HRS</S.TimeLabel>
            </S.TimeUnit>
            <S.TimeSeparator>:</S.TimeSeparator>
            <S.TimeUnit>
              <S.TimeValue>{String(timeLeft.minutes).padStart(2, '0')}</S.TimeValue>
              <S.TimeLabel>MIN</S.TimeLabel>
            </S.TimeUnit>
            <S.TimeSeparator>:</S.TimeSeparator>
            <S.TimeUnit>
              <S.TimeValue>{String(timeLeft.seconds).padStart(2, '0')}</S.TimeValue>
              <S.TimeLabel>SEC</S.TimeLabel>
            </S.TimeUnit>
          </S.Countdown>
        )}

        <S.RaceName>Round {race.round_number}: {race.name}</S.RaceName>
        <S.CircuitName>{race.circuit_name} • {race.city}, {race.country}</S.CircuitName>
        
        <S.DateTimeInfo>
          <S.DateIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </S.DateIcon>
          {formattedDate} at {formattedTime}
        </S.DateTimeInfo>
      </S.Content>
    </S.RaceCountdown>
  );
};

export default RaceCountdown;
