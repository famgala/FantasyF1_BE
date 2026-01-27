import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getErrorLogs,
  getSystemHealth,
  ErrorLog,
  SystemHealth,
} from "../../services/adminService";
import "./AdminLogsPage.scss";

/**
 * Admin Logs Page Component
 *
 * Displays system error logs and monitoring information for admin users.
 * Includes filtering by level, module, endpoint, and user ID.
 */
const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Filter state
  const [module, setModule] = useState<string>("");
  const [level, setLevel] = useState<string>("all");
  const [endpoint, setEndpoint] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  /**
   * Load logs and health data
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [logsResponse, healthData] = await Promise.all([
        getErrorLogs({
          level: level !== "all" ? (level as "debug" | "info" | "warning" | "error" | "critical") : undefined,
          module: module || undefined,
          endpoint: endpoint || undefined,
          userId: userId ? parseInt(userId, 10) : undefined,
          limit: logsPerPage,
          offset: (currentPage - 1) * logsPerPage,
        }),
        getSystemHealth(),
      ]);
      setLogs(logsResponse.logs);
      setTotalLogs(logsResponse.total);
      setHealth(healthData);
    } catch (err) {
      console.error("Failed to load logs:", err);
      setError("Failed to load error logs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [level, module, endpoint, userId, currentPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Toggle row expansion for stack trace
   */
  const toggleRowExpansion = (logId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  /**
   * Export logs to CSV
   */
  const exportToCSV = () => {
    const headers = ["ID", "Timestamp", "Level", "Module", "Message", "Endpoint", "User ID"];
    const csvContent = [
      headers.join(","),
      ...logs.map((log) =>
        [
          log.id,
          log.timestamp,
          log.level,
          log.module || "",
          `"${log.message.replace(/"/g, '""')}"`,
          log.endpoint || "",
          log.userId || "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `error_logs_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Export logs to JSON
   */
  const exportToJSON = () => {
    const jsonContent = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `error_logs_${new Date().toISOString().split("T")[0]}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Get level badge class
   */
  const getLevelClass = (lvl: string): string => {
    switch (lvl) {
      case "critical":
        return "admin-logs__level--critical";
      case "error":
        return "admin-logs__level--error";
      case "warning":
        return "admin-logs__level--warning";
      case "info":
        return "admin-logs__level--info";
      default:
        return "";
    }
  };

  /**
   * Get status class for health indicator
   */
  const getStatusClass = (status: string): string => {
    switch (status) {
      case "healthy":
        return "admin-logs__health-status--healthy";
      case "degraded":
        return "admin-logs__health-status--degraded";
      case "down":
        return "admin-logs__health-status--down";
      default:
        return "";
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  /**
   * Calculate total pages
   */
  const totalPages = Math.ceil(totalLogs / logsPerPage);

  /**
   * Reset filters
   */
  const resetFilters = () => {
    setModule("");
    setLevel("all");
    setEndpoint("");
    setUserId("");
    setCurrentPage(1);
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="admin-logs admin-logs--loading">
        <div className="admin-logs__loader">
          <div className="admin-logs__spinner" />
          <p>Loading error logs...</p>
        </div>
      </div>
    );
  }

  if (error && logs.length === 0) {
    return (
      <div className="admin-logs admin-logs--error">
        <div className="admin-logs__error-content">
          <h2>Error Loading Logs</h2>
          <p>{error}</p>
          <button className="admin-logs__retry-button" onClick={loadData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-logs">
      <header className="admin-logs__header">
        <div className="admin-logs__header-content">
          <Link to="/admin" className="admin-logs__back-link">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="admin-logs__title">Error Logs & Monitoring</h1>
          <p className="admin-logs__subtitle">
            System error logs and health status
          </p>
        </div>
        <div className="admin-logs__header-actions">
          <button
            className="admin-logs__refresh-button"
            onClick={loadData}
            disabled={isLoading}
            aria-label="Refresh logs"
          >
            {isLoading ? "⏳" : "🔄"} Refresh
          </button>
        </div>
      </header>

      {/* System Health Section */}
      {health && (
        <section className="admin-logs__health-section">
          <h2 className="admin-logs__section-title">System Health</h2>
          <div className="admin-logs__health-grid">
            <div className="admin-logs__health-card">
              <div className="admin-logs__health-header">
                <span className="admin-logs__health-name">🌐 API Server</span>
                <span
                  className={`admin-logs__health-status ${getStatusClass(health.api)}`}
                >
                  {health.api}
                </span>
              </div>
              <div className="admin-logs__health-detail">
                Response: {health.responseTimes.api}ms
              </div>
            </div>

            <div className="admin-logs__health-card">
              <div className="admin-logs__health-header">
                <span className="admin-logs__health-name">🗄️ Database</span>
                <span
                  className={`admin-logs__health-status ${getStatusClass(health.database)}`}
                >
                  {health.database}
                </span>
              </div>
              <div className="admin-logs__health-detail">
                Response: {health.responseTimes.database}ms
              </div>
            </div>

            <div className="admin-logs__health-card">
              <div className="admin-logs__health-header">
                <span className="admin-logs__health-name">⚡ Redis Cache</span>
                <span
                  className={`admin-logs__health-status ${getStatusClass(health.redis)}`}
                >
                  {health.redis}
                </span>
              </div>
              <div className="admin-logs__health-detail">
                Response: {health.responseTimes.redis}ms
              </div>
            </div>

            <div className="admin-logs__health-card">
              <div className="admin-logs__health-header">
                <span className="admin-logs__health-name">⚙️ Celery Workers</span>
                <span
                  className={`admin-logs__health-status ${getStatusClass(health.celery)}`}
                >
                  {health.celery}
                </span>
              </div>
              <div className="admin-logs__health-detail">
                Background task processing
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters Section */}
      <section className="admin-logs__filters">
        <h2 className="admin-logs__section-title">Filter Logs</h2>
        <div className="admin-logs__filter-grid">
          <div className="admin-logs__filter-group">
            <label htmlFor="level" className="admin-logs__filter-label">
              Level
            </label>
            <select
              id="level"
              className="admin-logs__filter-select"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="admin-logs__filter-group">
            <label htmlFor="module" className="admin-logs__filter-label">
              Module
            </label>
            <input
              id="module"
              type="text"
              className="admin-logs__filter-input"
              placeholder="e.g., auth, league"
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="admin-logs__filter-group">
            <label htmlFor="endpoint" className="admin-logs__filter-label">
              Endpoint
            </label>
            <input
              id="endpoint"
              type="text"
              className="admin-logs__filter-input"
              placeholder="e.g., /api/v1/auth"
              value={endpoint}
              onChange={(e) => {
                setEndpoint(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="admin-logs__filter-group">
            <label htmlFor="userId" className="admin-logs__filter-label">
              User ID
            </label>
            <input
              id="userId"
              type="number"
              className="admin-logs__filter-input"
              placeholder="User ID"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="admin-logs__filter-actions">
            <button
              className="admin-logs__filter-reset"
              onClick={resetFilters}
              type="button"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </section>

      {/* Export Section */}
      <section className="admin-logs__export">
        <div className="admin-logs__export-info">
          <span className="admin-logs__log-count">
            Showing {logs.length} of {totalLogs} logs
          </span>
        </div>
        <div className="admin-logs__export-actions">
          <button
            className="admin-logs__export-button"
            onClick={exportToCSV}
            disabled={logs.length === 0}
          >
            📄 Export CSV
          </button>
          <button
            className="admin-logs__export-button"
            onClick={exportToJSON}
            disabled={logs.length === 0}
          >
            📋 Export JSON
          </button>
        </div>
      </section>

      {/* Logs Table */}
      <section className="admin-logs__table-section">
        {logs.length === 0 ? (
          <div className="admin-logs__empty">
            <span className="admin-logs__empty-icon">📭</span>
            <h3>No Logs Found</h3>
            <p>No error logs match your current filters.</p>
            <button
              className="admin-logs__reset-filters-button"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="admin-logs__table-container">
            <table className="admin-logs__table">
              <thead>
                <tr>
                  <th className="admin-logs__th admin-logs__th--expand"></th>
                  <th className="admin-logs__th">Timestamp</th>
                  <th className="admin-logs__th">Level</th>
                  <th className="admin-logs__th">Module</th>
                  <th className="admin-logs__th">Message</th>
                  <th className="admin-logs__th">Endpoint</th>
                  <th className="admin-logs__th">User ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr
                      className={`admin-logs__tr ${
                        expandedRows.has(log.id) ? "admin-logs__tr--expanded" : ""
                      }`}
                      onClick={() => log.stackTrace && toggleRowExpansion(log.id)}
                    >
                      <td className="admin-logs__td admin-logs__td--expand">
                        {log.stackTrace && (
                          <button
                            className="admin-logs__expand-button"
                            aria-label={
                              expandedRows.has(log.id)
                                ? "Collapse stack trace"
                                : "Expand stack trace"
                            }
                          >
                            {expandedRows.has(log.id) ? "▼" : "▶"}
                          </button>
                        )}
                      </td>
                      <td className="admin-logs__td admin-logs__td--timestamp">
                        {formatTimestamp(log.timestamp)}
                      </td>
                      <td className="admin-logs__td">
                        <span className={`admin-logs__level ${getLevelClass(log.level)}`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="admin-logs__td">
                        <code>{log.module || "-"}</code>
                      </td>
                      <td className="admin-logs__td admin-logs__td--message">
                        {log.message}
                      </td>
                      <td className="admin-logs__td admin-logs__td--endpoint">
                        <code>{log.endpoint || "-"}</code>
                      </td>
                      <td className="admin-logs__td admin-logs__td--user">
                        {log.userId || "-"}
                      </td>
                    </tr>
                    {expandedRows.has(log.id) && log.stackTrace && (
                      <tr className="admin-logs__stack-trace-row">
                        <td colSpan={7}>
                          <div className="admin-logs__stack-trace">
                            <h4>Stack Trace:</h4>
                            <pre>{log.stackTrace}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pagination */}
      {totalPages > 1 && (
        <section className="admin-logs__pagination">
          <button
            className="admin-logs__page-button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            ⏮️ First
          </button>
          <button
            className="admin-logs__page-button"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ◀️ Previous
          </button>
          <span className="admin-logs__page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="admin-logs__page-button"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next ▶️
          </button>
          <button
            className="admin-logs__page-button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last ⏭️
          </button>
        </section>
      )}
    </div>
  );
};

export default AdminLogsPage;
