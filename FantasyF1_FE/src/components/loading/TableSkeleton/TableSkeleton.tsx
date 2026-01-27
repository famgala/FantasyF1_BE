import React from 'react';
import { SkeletonLoader } from '../SkeletonLoader';
import './TableSkeleton.scss';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Skeleton loader for table-based layouts (standings, leaderboards, etc.)
 * Generates a skeleton placeholder matching the table structure
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 6,
  className = '',
}) => {
  const tableRows = Array.from({ length: rows }, (_, i) => i);
  const tableCols = Array.from({ length: columns }, (_, i) => i);

  return (
    <div className={`table-skeleton ${className}`} data-testid="table-skeleton">
      <div className="table-skeleton__header">
        {tableCols.map((index) => (
          <div key={`header-${index}`} className="table-skeleton__header-cell">
            <SkeletonLoader variant="text" width="80%" height={16} />
          </div>
        ))}
      </div>
      <div className="table-skeleton__body">
        {tableRows.map((rowIndex) => (
          <div key={`row-${rowIndex}`} className="table-skeleton__row">
            {tableCols.map((colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="table-skeleton__cell">
                <SkeletonLoader variant="text" width="70%" height={16} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;
