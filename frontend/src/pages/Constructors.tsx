import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConstructors, type GetConstructorsRequest } from '../services/constructorService';
import type { Constructor } from '../types';

export default function Constructors() {
  const navigate = useNavigate();
  const [constructors, setConstructors] = useState<Constructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'wins' | 'championships'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const pageSize = 20;

  useEffect(() => {
    fetchConstructors();
  }, [currentPage, sortBy, sortOrder]);

  const fetchConstructors = async () => {
    try {
      setLoading(true);
      const params: GetConstructorsRequest = {
        page: currentPage,
        page_size: pageSize,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      const response = await getConstructors(params);
      setConstructors(response.items);
      setTotalPages(response.total_pages);
      setError(null);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError.response?.data?.detail || 'Failed to load constructors');
    } finally {
      setLoading(false);
    }
  };

  const handleConstructorClick = (constructorId: string) => {
    // Navigate to constructor detail page (placeholder for now)
    navigate(`/constructors/${constructorId}`);
  };

  const handleSortChange = (newSortBy: 'name' | 'points' | 'wins' | 'championships') => {
    if (sortBy === newSortBy) {
      // Toggle sort order if clicking same sort option
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const getNationalityFlag = (nationality: string) => {
    const flags: { [key: string]: string } = {
      'British': '🇬🇧',
      'German': '🇩🇪',
      'Italian': '🇮🇹',
      'Austrian': '🇦🇹',
      'French': '🇫🇷',
      'American': '🇺🇸',
      'Swiss': '🇨🇭',
      'Dutch': '🇳🇱',
    };
    return flags[nationality] || '🏁';
  };

  return (
    <div className="constructors-page">
      <div className="container">
        <div className="page-header">
          <h1>F1 Constructors</h1>
          <p className="page-subtitle">
            View all Formula 1 teams, their performance stats, and team rosters
          </p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-row">
            <div className="sort-controls">
              <label>Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as 'name' | 'points' | 'wins' | 'championships')}
                className="sort-select"
              >
                <option value="name">Name</option>
                <option value="points">Points</option>
                <option value="wins">Wins</option>
                <option value="championships">Championships</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="sort-order-btn"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchConstructors} className="btn btn-primary">
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading constructors...</p>
          </div>
        )}

        {/* Constructors Grid */}
        {!loading && !error && (
          <>
            <div className="results-info">
              Showing {constructors.length} constructors
            </div>

            {constructors.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🏎️</div>
                <h3>No Constructors Found</h3>
                <p>There are no constructors available at this time.</p>
              </div>
            ) : (
              <div className="constructors-grid">
                {constructors.map((constructor) => (
                  <div
                    key={constructor.id}
                    className="constructor-card"
                    onClick={() => handleConstructorClick(constructor.id)}
                  >
                    <div className="constructor-header">
                      <div className="constructor-code">{constructor.code}</div>
                      <div className={`constructor-status ${constructor.is_active ? 'active' : 'inactive'}`}>
                        {constructor.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    <div className="constructor-name-section">
                      <div className="constructor-flag">{getNationalityFlag(constructor.nationality)}</div>
                      <h3 className="constructor-name">{constructor.name}</h3>
                    </div>

                    <div className="constructor-info">
                      <div className="info-row">
                        <span className="info-label">Engine:</span>
                        <span className="info-value">{constructor.engine}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Nationality:</span>
                        <span className="info-value">{constructor.nationality}</span>
                      </div>
                    </div>

                    <div className="constructor-stats">
                      <div className="stat-item">
                        <div className="stat-value points">{constructor.points.toLocaleString()}</div>
                        <div className="stat-label">Points</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value wins">{constructor.wins}</div>
                        <div className="stat-label">Wins</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-value championships">{constructor.championships}</div>
                        <div className="stat-label">Titles</div>
                      </div>
                    </div>

                    <div className="constructor-footer">
                      <span className="view-details">View Team Details →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {constructors.length > 0 && totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
