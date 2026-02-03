import { useEffect, useState } from 'react';
import type { DraftTimer } from '../types';

interface CountdownTimerProps {
  timer: DraftTimer;
  isMyTurn?: boolean;
  onTimeExpired?: () => void;
}

export default function CountdownTimer({ timer, isMyTurn = false, onTimeExpired }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(timer.time_remaining);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Reset state when timer changes
    setTimeRemaining(timer.time_remaining);
    setIsExpired(false);

    // If draft is paused, don't start countdown
    if (timer.is_draft_paused) {
      return;
    }

    // If no time remaining initially, mark as expired
    if (timer.time_remaining <= 0) {
      setIsExpired(true);
      if (onTimeExpired) {
        onTimeExpired();
      }
      return;
    }

    // Start countdown
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          setIsExpired(true);
          if (onTimeExpired) {
            onTimeExpired();
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.time_remaining, timer.is_draft_paused, onTimeExpired]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine timer color based on time remaining
  const getTimerColor = (): string => {
    if (timer.is_draft_paused) {
      return 'text-gray-400';
    }
    if (isExpired) {
      return 'text-red-600';
    }
    if (timeRemaining <= 10) {
      return 'text-red-500';
    }
    if (timeRemaining <= 30) {
      return 'text-yellow-500';
    }
    return 'text-green-500';
  };

  // Determine if timer should pulse (warning state)
  const shouldPulse = (): boolean => {
    return !timer.is_draft_paused && timeRemaining <= 10 && !isExpired;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="text-sm text-gray-600 mb-1">
        {timer.is_draft_paused ? (
          <span className="text-gray-500">Draft Paused</span>
        ) : isMyTurn ? (
          <span className="font-semibold text-blue-600">Your Turn!</span>
        ) : (
          <span>Time Remaining</span>
        )}
      </div>
      <div
        className={`text-4xl font-mono font-bold ${getTimerColor()} ${
          shouldPulse() ? 'animate-pulse' : ''
        }`}
      >
        {timer.is_draft_paused ? 'PAUSED' : formatTime(timeRemaining)}
      </div>
      {isExpired && !timer.is_draft_paused && (
        <div className="text-xs text-red-600 mt-1 font-semibold">
          Time Expired!
        </div>
      )}
      {isMyTurn && !timer.is_draft_paused && !isExpired && (
        <div className="text-xs text-blue-600 mt-1">
          Make your pick before time runs out
        </div>
      )}
    </div>
  );
}