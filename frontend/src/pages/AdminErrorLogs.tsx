import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { adminService } from '../services/adminService';
import { PageLoader } from '../components/PageLoader';
import { ErrorDisplay } from '../components/ErrorDisplay';
import { MobileNav } from '../components/MobileNav';
import { LoadingSpinner } from '../components/LoadingSpinner';
import type { ErrorLog, ErrorLogFilters } from '../types/admin';

const SEVERITY_COLORS = {
  error: 'severity-error',
  warning: 'severity-warning',
  info: 'severity-info',
};

const STATUS_BADGES = {
  resolved: 'status-resolved',
  unresolved: 'status-unresolved',
};

interface ErrorDetailModalProps {
  error: ErrorLog | null;
  onClose: () => void;
  onResolve: (notes?: string) => void;
  onUnresolve: () => void;
  isUpdating: boolean;
}

const ErrorDetailModal: React.FC<ErrorDetailModalProps> = ({
  error,
  onClose,
  onResolve,
  onUnresolve,
  isUpdating,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');

  if (!error) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Error Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="error-detail-section">
            <div className="error-detail-header">
              <span className={`severity-badge ${SEVERITY_COLORS[error.severity]}`}>
                {error.severity.toUpperCase()}
              </span>
              <span className={`status-badge ${STATUS_BADGES[error.status]}`}>
                {error.status}
              </span>
            </div>

            <div className="error-detail-info">
              <p><strong>Timestamp:</strong> {new Date(error.timestamp).toLocaleString()}</p>
              <p><strong>Error Type:</strong> {error.error_type}</p>
              <p><strong>Message:</strong> {error.message}</p>
              {error.endpoint && <p><strong>Endpoint:</strong> {error.endpoint}</p>}
              {error.user_id && <p><strong>User ID:</strong> {error.user_id}</p>}
            </div>

            {error.stack_trace && (
              <div className="error-detail-block">
                <h4>Stack Trace</h4>
                <pre className="code-block">{error.stack_trace}</pre>
              </div>
            )}

            {error.request_data && (
              <div className="error-detail-block">
                <h4>Request Data</h4>
                <pre className="code-block">{JSON.stringify(error.request_data, null, 2)}</pre>
              </div>
            )}

            {error.response_data && (
              <div className="error-detail-block">
                <h4>Response Data</h4>
                <pre className="code-block">{JSON.stringify(error.response_data, null, 2)}</pre>
              </div>
            )}

            {error.resolved_by && (
              <div className="error-detail-resolution">
                <h4>Resolution</h4>
                <p><strong>Resolved by:</strong> {error.resolved_by}</p>
                <p><strong>Resolved at:</strong> {new Date(error.resolved_at!).toLocaleString()}</p>
                {error.resolution_notes && (
                  <p><strong>Notes:</strong> {error.resolution_notes}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          {error.status === 'unresolved' ? (
            <>
              <div className="resolution-input">
                <label htmlFor="resolution-notes">Resolution Notes (optional):</label>
                <textarea
                  id="resolution-notes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Enter notes about how this error was resolved..."
                  rows={2}
                />
              </div>
              <button
                className="btn btn-success"
                onClick={() => onResolve(resolutionNotes)}
                disabled={isUpdating}
              >
                {isUpdating ? <LoadingSpinner size="sm" color="white" /> : '✓ Mark as Resolved'}
              </button>
            </>
          ) : (
            <button
              className="btn btn-warning"
              onClick={onUnresolve}
              disabled={isUpdating}
            >
              {isUpdating ? <LoadingSpinner size="sm" /> : '↺ Mark as Unresolved'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminErrorLogs: React.FC = () => {
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState<ErrorLogFilters>(({
    page,
    page_size: pageSize,
  }));

  // Check if user is superuser
  useEffect(() => {
    if (user && !user.is_superuser) {
      showError('Access Denied', 'You do not have permission to access this page');
      navigate('/dashboard');
    }
  }, [user, navigate, showError]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminService.getErrorLogs({
        ...filters,
        page,
        page_size: pageSize,
      });
      setLogs(response.logs);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      const message = 'Failed to load error logs';
      setError(message);
      showError('Error', message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, showError]);

  useEffect(() => {
    if (user?.is_superuser) {
      fetchLogs();
    }
  }, [user, fetchLogs]);

  const handleFilterChange = (key: keyof ErrorLogFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page on filter change
  };

  const handleResolve = async (notes?: string) => {
    if (!selectedError) return;

    setIsUpdating(true);
    try {
      await adminService.resolveError(selectedError.id, { resolution_notes: notes });
      showSuccess('Success', 'Error marked as resolved');
      setSelectedError(null);
      fetchLogs();
    } catch (err) {
      showError('Error', 'Failed to resolve error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUnresolve = async () => {
    if (!selectedError) return;

    setIsUpdating(true);
    try {
      await adminService.unresolveError(selectedError.id);
      showSuccess('Success', 'Error marked as unresolved');
      setSelectedError(null);
      fetchLogs();
    } catch (err) {
      showError('Error', 'Failed to unresolve error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all logs for export (without pagination)
      const response = await adminService.getErrorLogs({
        ...filters,
        page: 1,
        page_size: 1000, // Get a large batch for export
      });

      // Convert to CSV
      const headers = ['Timestamp', 'Severity', 'Status', 'Error Type', 'Message', 'Endpoint', 'User ID'];
      const rows = response.logs.map((log) => [
        log.timestamp,
        log.severity,
        log.status,
        log.error_type,
        log.message,
        log.endpoint || '',
        log.user_id || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showSuccess('Success', 'Error logs exported successfully');
    } catch (err) {
      showError('Error', 'Failed to export error logs');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({ page: 1, page_size: pageSize });
    setPage(1);
  };

  if (loading && logs.length === 0) {
    return <PageLoader message="Loading error logs..." />;
  }

  if (error && logs.length === 0) {
    return (
      <ErrorDisplay
        title="Failed to Load Error Logs"
        message={error}
        onRetry={fetchLogs}
      />
    );
  }

  return (
    <div className="page-container">
      <nav className="page-nav">
        <div className="nav-brand">
          <h1>FantasyF1 Admin</h1>
        </div>
        <div className="nav-links">
          <a href="/admin" className="nav-link">← Back to Admin</a>
          <a href="/dashboard" className="nav-link">Dashboard</a>
        </div>
      </nav>

      <MobileNav />

      <main className="page-content">
        <div className="admin-header">
          <div className="admin-title-section">
            <h1 className="page-title">Error Logs</h1>
            <p className="page-subtitle">View and manage system error logs</p>
          </div>
          <div className="admin-actions">
            <button
              className="btn btn-secondary"
              onClick={handleExport}
              disabled={isExporting || logs.length === 0}
            >
              {isExporting ? <LoadingSpinner size="sm" /> : '📥 Export CSV'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="severity-filter">Severity</label>
              <select
                id="severity-filter"
                value={filters.severity || ''}
                onChange={(e) => handleFilterChange('severity', e.target.value || undefined)}
              >
                <option value="">All</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="status-filter">Status</label>
              <select
                id="status-filter"
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value === 'all' ? undefined : e.target.value)}
              >
                <option value="all">All</option>
                <option value="unresolved">Unresolved</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="error-type-filter">Error Type</label>
              <input
                id="error-type-filter"
                type="text"
                placeholder="Filter by error type..."
                value={filters.error_type || ''}
                onChange={(e) => handleFilterChange('error_type', e.target.value || undefined)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="endpoint-filter">Endpoint</label>
              <input
                id="endpoint-filter"
                type="text"
                placeholder="Filter by endpoint..."
                value={filters.endpoint || ''}
                onChange={(e) => handleFilterChange('endpoint', e.target.value || undefined)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="user-id-filter">User ID</label>
              <input
                id="user-id-filter"
                type="text"
                placeholder="Filter by user ID..."
                value={filters.user_id || ''}
                onChange={(e) => handleFilterChange('user_id', e.target.value || undefined)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="start-date-filter">Start Date</label>
              <input
                id="start-date-filter"
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="end-date-filter">End Date</label>
              <input
                id="end-date-filter"
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
              />
            </div>
          </div>

          <div className="filters-actions">
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="results-info">
          <p>Showing {logs.length} of {total} error logs</p>
        </div>

        {/* Error Logs Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Error Type</th>
                <th>Message</th>
                <th>Endpoint</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedError(log)}
                  className="clickable-row"
                >
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    <span className={`severity-badge ${SEVERITY_COLORS[log.severity]}`}>
                      {log.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${STATUS_BADGES[log.status]}`}>
                      {log.status}
                    </span>
                  </td>
                  <td>{log.error_type}</td>
                  <td className="message-cell" title={log.message}>
                    {log.message.length > 60 ? `${log.message.substring(0, 60)}...` : log.message}
                  </td>
                  <td>{log.endpoint || '-'}</td>
                  <td>{log.user_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {logs.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">🐛</div>
            <h2>No Error Logs Found</h2>
            <p>No errors match your current filters.</p>
            <button className="btn btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <span className="pagination-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      {/* Error Detail Modal */}
      {selectedError && (
        <ErrorDetailModal
          error={selectedError}
          onClose={() => setSelectedError(null)}
          onResolve={handleResolve}
          onUnresolve={handleUnresolve}
          isUpdating={isUpdating}
        />
      )}
    </div>
  );
};

export default AdminErrorLogs;
