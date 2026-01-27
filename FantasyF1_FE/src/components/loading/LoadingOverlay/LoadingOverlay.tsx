import React from 'react';
import { LoadingSpinner } from '../LoadingSpinner';
import './LoadingOverlay.scss';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Overlay component that shows a loading spinner over content
 * Used for page-wide or section-wide loading states
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message,
  className = '',
  children,
}) => {
  return (
    <div className={`loading-overlay ${className}`} data-testid="loading-overlay">
      {children}
      {isLoading && (
        <div className="loading-overlay__backdrop">
          <div className="loading-overlay__spinner-container">
            <LoadingSpinner size="lg" />
            {message && <p className="loading-overlay__message">{message}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;
