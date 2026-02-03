import React, { useState, useEffect } from 'react';

export type ConnectionStatusType = 'connecting' | 'connected' | 'offline' | 'error';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  lastUpdated?: Date;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
}

const statusConfig = {
  connecting: {
    color: 'bg-yellow-500',
    text: 'Connecting...',
    icon: 'M12 4v1m0 14v1m8-8h-1M5 12H4m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707',
  },
  connected: {
    color: 'bg-green-500',
    text: 'Live',
    icon: 'M5 13l4 4L19 7',
  },
  offline: {
    color: 'bg-red-500',
    text: 'Offline',
    icon: 'M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728',
  },
  error: {
    color: 'bg-red-500',
    text: 'Error',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  lastUpdated,
  onManualRefresh,
  isRefreshing = false,
}) => {
  const config = statusConfig[status];
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffSecs = Math.floor(diffMs / 1000);

      if (diffSecs < 60) {
        setTimeAgo(`${diffSecs}s ago`);
      } else if (diffSecs < 3600) {
        const mins = Math.floor(diffSecs / 60);
        setTimeAgo(`${mins}m ago`);
      } else {
        const hours = Math.floor(diffSecs / 3600);
        setTimeAgo(`${hours}h ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="connection-status">
      <div className="connection-status-indicator">
        <div className={`status-dot ${config.color} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
        <span className="status-text">{config.text}</span>
        {timeAgo && <span className="status-time">({timeAgo})</span>}
      </div>
      {onManualRefresh && (
        <button
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="refresh-button"
          title="Refresh manually"
          aria-label="Refresh manually"
        >
          {isRefreshing ? (
            <svg
              className="animate-spin"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
};

export default ConnectionStatus;