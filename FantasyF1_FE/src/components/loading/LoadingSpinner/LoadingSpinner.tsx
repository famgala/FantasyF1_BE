import React from 'react';
import './LoadingSpinner.scss';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

/**
 * Reusable loading spinner component
 * Supports different sizes and colors for consistent loading indicators
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
}) => {
  return (
    <div
      className={`loading-spinner loading-spinner--${size} loading-spinner--${color} ${className}`}
      data-testid="loading-spinner"
      aria-label="Loading"
      role="status"
    >
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
      <div className="spinner-ring"></div>
    </div>
  );
};

export default LoadingSpinner;
