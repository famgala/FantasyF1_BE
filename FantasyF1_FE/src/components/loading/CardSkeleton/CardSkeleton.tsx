import React from 'react';
import { SkeletonLoader } from '../SkeletonLoader';
import './CardSkeleton.scss';

interface CardSkeletonProps {
  count?: number;
  className?: string;
}

/**
 * Skeleton loader for card-based layouts (league cards, driver cards, etc.)
 * Generates a skeleton placeholder matching the card structure
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 1,
  className = '',
}) => {
  const cards = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={`card-skeleton ${className}`} data-testid="card-skeleton">
      {cards.map((index) => (
        <div key={index} className="card-skeleton__item">
          <div className="card-skeleton__header">
            <SkeletonLoader variant="circular" width={50} height={50} className="card-skeleton__icon" />
            <div className="card-skeleton__title">
              <SkeletonLoader variant="text" width="80%" height={20} />
              <SkeletonLoader variant="text" width="60%" height={16} />
            </div>
          </div>
          <div className="card-skeleton__body">
            <SkeletonLoader variant="text" width="100%" height={16} />
            <SkeletonLoader variant="text" width="100%" height={16} />
            <SkeletonLoader variant="text" width="70%" height={16} />
          </div>
          <div className="card-skeleton__footer">
            <SkeletonLoader variant="rounded" width={80} height={32} />
            <SkeletonLoader variant="rounded" width={80} height={32} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardSkeleton;
