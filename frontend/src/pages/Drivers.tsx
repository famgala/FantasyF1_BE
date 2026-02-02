import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDrivers, searchDrivers } from '../services/driverService';
import type { Driver, GetDriversRequest } from '../types';
import { MobileNav } from '../components/MobileNav';

export default function Drivers() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'price' | 'number'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset to first page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch drivers
  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (debouncedQuery.trim()) {
        // Use search endpoint
        const searchResults = await searchDrivers(debouncedQuery);
        setDrivers(searchResults);
        setTotalPages(1);
        setTotal(searchResults.length);
      } else {
        // Use regular drivers endpoint with filters
        const params: GetDriversRequest = {
          page,
          page_size: 20,
          team: teamFilter || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
        };
        response = await getDrivers(params);
        setDrivers(response.items);
        setTotalPages(response.total_pages);
        setTotal(response.total);
        
        // Extract unique teams for filter dropdown
        const teams = [...new Set(response.items.map(d => d.team))].sort();
        setAvailableTeams(teams);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load drivers');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, teamFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleTeamFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTeamFilter(e.target.value);
    setPage(1);
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as 'name' | 'points' | 'price' | 'number');
    setPage(1);
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as 'asc' | 'desc');
    setPage(1);
  };

  const handleDriverClick = (driverId: string) => {
    // Placeholder for driver detail page (US-027)
    navigate(`/drivers/${driverId}`);
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

  return (
    <>
      <MobileNav />
      <div className="drivers-container">
      <div className="page-header">
        <h1>F1 Drivers</h1>
        <p>View all Formula 1 drivers and their statistics</p>
      </div>

      <div className="search-filters">
        <div className="search-bar">
          <input
            type="text"
            className="form-control"
            placeholder="Search drivers by name, number, or code..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filter-bar">
          <label htmlFor="team-filter">Team:</label>
          <select
            id="team-filter"
            className="form-control"
            value={teamFilter}
            onChange={handleTeamFilterChange}
          >
            <option value="">All Teams</option>
            {availableTeams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-bar">
          <label htmlFor="sort-by">Sort By:</label>
          <select
            id="sort-by"
            className="form-control"
            value={sortBy}
            onChange={handleSortByChange}
          >
            <option value="name">Name</option>
            <option value="points">Total Points</option>
            <option value="price">Price</option>
            <option value="number">Number</option>
          </select>
        </div>

        <div className="filter-bar">
          <label htmlFor="sort-order">Order:</label>
          <select
            id="sort-order"
            className="form-control"
            value={sortOrder}
            onChange={handleSortOrderChange}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading drivers...</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {!loading && !error && drivers.length === 0 && (
        <div className="empty-state">
          <h3>No drivers found</h3>
          <p>
            {searchQuery
              ? `No drivers match "${searchQuery}"`
              : teamFilter
              ? `No drivers found for team "${teamFilter}"`
              : 'There are no drivers available at the moment.'}
          </p>
          {(searchQuery || teamFilter) && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSearchQuery('');
                setTeamFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {!loading && !error && drivers.length > 0 && (
        <>
          <div className="drivers-grid">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="driver-card"
                onClick={() => handleDriverClick(driver.id)}
              >
                <div className="driver-card-header">
                  <div className="driver-number-badge">
                    #{driver.number}
                  </div>
                  <span className="driver-code">{driver.code}</span>
                </div>
                
                <h3 className="driver-name">{driver.name}</h3>
                <p className="driver-team">{driver.team}</p>
                <p className="driver-country">{driver.country}</p>
                
                <div className="driver-stats">
                  <div className="stat">
                    <span className="stat-label">Price:</span>
                    <span className="stat-value">${driver.price.toFixed(1)}M</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total Points:</span>
                    <span className="stat-value">{driver.total_points.toFixed(1)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Avg Points:</span>
                    <span className="stat-value">{driver.average_points.toFixed(1)}</span>
                  </div>
                </div>
                
                <div className="driver-card-footer">
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
            Showing {drivers.length} of {total} drivers
          </div>
        </>
      )}
    </div>
    </>
  );
}
