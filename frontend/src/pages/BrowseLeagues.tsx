import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeagues, searchLeagues } from '../services/leagueService';
import { MobileNav } from '../components/MobileNav';
import { PageLoader, ErrorDisplay, SkeletonCard } from '../components';
import type { LeagueWithTeamCount } from '../types';

export default function BrowseLeagues() {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState<LeagueWithTeamCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState<'all' | 'public' | 'private'>('all');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch leagues
  const fetchLeagues = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (debouncedQuery.trim()) {
        // Use search endpoint
        response = await searchLeagues(debouncedQuery, page, 20);
      } else {
        // Use regular leagues endpoint with privacy filter
        response = await getLeagues({
          page,
          page_size: 20,
          privacy: privacyFilter === 'all' ? undefined : privacyFilter,
        });
      }
      
      setLeagues(response.items);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load leagues');
      setLeagues([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, privacyFilter]);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handlePrivacyFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPrivacyFilter(e.target.value as 'all' | 'public' | 'private');
    setPage(1);
  };

  const handleLeagueClick = (leagueId: string) => {
    navigate(`/leagues/${leagueId}`);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePageClick = (pageNum: number) => {
    setPage(pageNum);
  };

  const getPrivacyBadgeClass = (privacy: string) => {
    return privacy === 'public' ? 'badge-public' : 'badge-private';
  };

  const getPrivacyBadgeText = (privacy: string) => {
    return privacy === 'public' ? 'Public' : 'Private';
  };

  return (
    <>
      <MobileNav />
    <div className="browse-leagues-container">
      <div className="page-header">
        <h1>Browse Leagues</h1>
        <p>Find and join fantasy F1 leagues</p>
      </div>

      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            className="form-control"
            placeholder="Search leagues by name..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-bar">
          <label htmlFor="privacy-filter">Privacy:</label>
          <select
            id="privacy-filter"
            className="form-control"
            value={privacyFilter}
            onChange={handlePrivacyFilterChange}
          >
            <option value="all">All Leagues</option>
            <option value="public">Public Only</option>
            <option value="private">Private Only</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {error && (
        <ErrorDisplay
          title="Failed to Load Leagues"
          message={error}
          onRetry={fetchLeagues}
          isRetrying={loading}
        />
      )}

      {!loading && !error && leagues.length === 0 && (
        <div className="empty-state">
          <h3>No leagues found</h3>
          <p>
            {searchQuery
              ? `No leagues match "${searchQuery}"`
              : 'There are no leagues available at the moment.'}
          </p>
          {searchQuery && (
            <button
              className="btn btn-secondary"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {!loading && !error && leagues.length > 0 && (
        <>
          <div className="leagues-grid">
            {leagues.map((league) => (
              <div
                key={league.id}
                className="league-card"
                onClick={() => handleLeagueClick(league.id)}
              >
                <div className="league-card-header">
                  <h3 className="league-name">{league.name}</h3>
                  <span className={`badge ${getPrivacyBadgeClass(league.privacy)}`}>
                    {getPrivacyBadgeText(league.privacy)}
                  </span>
                </div>
                
                <p className="league-description">{league.description}</p>
                
                <div className="league-stats">
                  <div className="stat">
                    <span className="stat-label">Teams:</span>
                    <span className="stat-value">
                      {league.team_count} / {league.max_teams}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Draft:</span>
                    <span className="stat-value">{league.draft_method}</span>
                  </div>
                </div>
                
                <div className="league-card-footer">
                  <span className="league-code">Code: {league.code}</span>
                  <span className="view-details">View Details →</span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={handlePreviousPage}
                disabled={page === 1}
              >
                Previous
              </button>
              
              <div className="page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`btn ${page === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handlePageClick(pageNum)}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              
              <button
                className="btn btn-secondary"
                onClick={handleNextPage}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}

          <div className="results-info">
            Showing {leagues.length} of {total} leagues
          </div>
        </>
      )}
    </div>
    </>
  );
}
