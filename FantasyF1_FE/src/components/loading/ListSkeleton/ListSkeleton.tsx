import React from 'react';
import { SkeletonLoader } from '../SkeletonLoader';
import './ListSkeleton.scss';

interface ListSkeletonProps {
  count?: number;
  showIcon?: boolean;
  className?: string;
}

/**
 * Skeleton loader for list-based layouts (activity feeds, notifications, etc.)
 * Generates a skeleton placeholder matching the list structure
 */
export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 5,
  showIcon = true,
  className = '',
}) => {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div className={`list-skeleton ${className}`} data-testid="list-skeleton">
      {items.map((index) => (
        <div key={index} className="list-skeleton__item">
          {showIcon && <SkeletonLoader variant="circular" width={40} height={40} className="list-skeleton__icon" />}
          <div className="list-skeleton__content">
            <SkeletonLoader variant="text" width="100%" height={16} className="list-skeleton__title" />
            <SkeletonLoader variant="text" width="80%" height={14} className="list-skeleton__subtitle" />
          </div>
          <SkeletonLoader variant="text" width={60} height={12} className="list-skeleton__date" />
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
