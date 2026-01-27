import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getAdminRaces,
  getSyncHistory,
  triggerSync,
  getAdminDrivers,
  updateAdminDriver,
  addAdminDriver,
  updateAdminRace,
  getCeleryTasks,
  toggleCeleryTask,
  runCeleryTask,
  AdminRace,
  SyncHistoryEntry,
  AdminDriver,
  CeleryTask,
} from "../../services/adminService";
import "./AdminRaceManagementPage.scss";

/**
 * AdminRaceManagementPage Component
 * 
 * Admin tools for managing race data, driver data, and Celery tasks.
 * - Manually trigger race data sync from Jolpica API
 * - View sync history and status
 * - Edit race details (dates, status)
 * - Manage driver data (add reserve drivers, update prices)
 * - View Celery task status for scheduled jobs
 */
const AdminRaceManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"races" | "drivers" | "tasks">("races");
  const [races, setRaces] = useState<AdminRace[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [tasks, setTasks] = useState<CeleryTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingRaceId, setSyncingRaceId] = useState<number | null>(null);
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<AdminDriver | null>(null);
  const [editingRace, setEditingRace] = useState<AdminRace | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New driver form state
  const [newDriver, setNewDriver] = useState({
    firstName: "",
    lastName: "",
    code: "",
    number: "",
    team: "",
    country: "",
    status: "reserve" as "active" | "reserve",
    price: "",
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "races") {
        const [racesData, historyData] = await Promise.all([
          getAdminRaces(),
          getSyncHistory(),
        ]);
        setRaces(racesData);
        setSyncHistory(historyData);
      } else if (activeTab === "drivers") {
        const driversData = await getAdminDrivers();
        setDrivers(driversData);
      } else if (activeTab === "tasks") {
        const tasksData = await getCeleryTasks();
        setTasks(tasksData);
      }
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRace = async (raceId?: number) => {
    setSyncingRaceId(raceId || -1);
    try {
      await triggerSync({ raceId, syncType: "race" });
      showSuccess(raceId ? "Race sync triggered successfully" : "All races sync triggered successfully");
      // Refresh data after a short delay
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      setError("Failed to trigger sync. Please try again.");
    } finally {
      setSyncingRaceId(null);
    }
  };

  const handleSyncResults = async (raceId: number) => {
    setSyncingRaceId(raceId);
    try {
      await triggerSync({ raceId, syncType: "results" });
      showSuccess("Results sync triggered successfully");
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      setError("Failed to trigger results sync. Please try again.");
    } finally {
      setSyncingRaceId(null);
    }
  };

  const handleSyncDrivers = async () => {
    setSyncingRaceId(-2);
    try {
      await triggerSync({ syncType: "drivers" });
      showSuccess("Drivers sync triggered successfully");
      setTimeout(() => loadData(), 1000);
    } catch (err) {
      setError("Failed to trigger drivers sync. Please try again.");
    } finally {
      setSyncingRaceId(null);
    }
  };

  const handleUpdateRace = async (race: AdminRace) => {
    try {
      await updateAdminRace(race.id, {
        raceDate: race.raceDate,
        qualifyingDate: race.qualifyingDate,
        status: race.status,
      });
      showSuccess("Race updated successfully");
      setEditingRace(null);
      loadData();
    } catch (err) {
      setError("Failed to update race. Please try again.");
    }
  };

  const handleUpdateDriver = async (driver: AdminDriver) => {
    try {
      await updateAdminDriver(driver.id, {
        price: driver.price,
        status: driver.status,
        team: driver.team,
      });
      showSuccess("Driver updated successfully");
      setEditingDriver(null);
      loadData();
    } catch (err) {
      setError("Failed to update driver. Please try again.");
    }
  };

  const handleAddDriver = async () => {
    if (!newDriver.firstName || !newDriver.lastName || !newDriver.code || !newDriver.team || !newDriver.price) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      await addAdminDriver({
        firstName: newDriver.firstName,
        lastName: newDriver.lastName,
        code: newDriver.code.toUpperCase(),
        number: newDriver.number ? parseInt(newDriver.number) : null,
        team: newDriver.team,
        country: newDriver.country,
        status: newDriver.status,
        price: parseFloat(newDriver.price),
      });
      showSuccess("Driver added successfully");
      setShowAddDriverModal(false);
      setNewDriver({
        firstName: "",
        lastName: "",
        code: "",
        number: "",
        team: "",
        country: "",
        status: "reserve",
        price: "",
      });
      loadData();
    } catch (err) {
      setError("Failed to add driver. Please try again.");
    }
  };

  const handleToggleTask = async (taskId: string, isEnabled: boolean) => {
    try {
      await toggleCeleryTask(taskId, !isEnabled);
      showSuccess(`Task ${isEnabled ? "disabled" : "enabled"} successfully`);
      loadData();
    } catch (err) {
      setError("Failed to toggle task. Please try again.");
    }
  };

  const handleRunTask = async (taskId: string) => {
    try {
      await runCeleryTask(taskId);
      showSuccess("Task triggered successfully");
      loadData();
    } catch (err) {
      setError("Failed to run task. Please try again.");
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  const getSyncStatusBadge = (status: AdminRace["syncStatus"]) => {
    const badges: Record<string, string> = {
      synced: "badge--success",
      pending: "badge--warning",
      failed: "badge--error",
      never: "badge--neutral",
    };
    return badges[status] || "badge--neutral";
  };

  const getTaskStatusBadge = (status: CeleryTask["status"]) => {
    const badges: Record<string, string> = {
      pending: "badge--warning",
      running: "badge--info",
      success: "badge--success",
      failed: "badge--error",
      scheduled: "badge--neutral",
    };
    return badges[status] || "badge--neutral";
  };

  const getSyncHistoryStatusBadge = (status: SyncHistoryEntry["status"]) => {
    const badges: Record<string, string> = {
      success: "badge--success",
      failed: "badge--error",
      in_progress: "badge--info",
    };
    return badges[status] || "badge--neutral";
  };

  return (
    <div className="admin-race-management">
      <div className="admin-race-management__header">
        <div className="admin-race-management__breadcrumb">
          <Link to="/admin">Admin Dashboard</Link>
          <span>/</span>
          <span>Race & Data Management</span>
        </div>
        <h1>Race & Data Management</h1>
        <p>Manage race data, drivers, and scheduled tasks</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="admin-race-management__alert admin-race-management__alert--success">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="admin-race-management__alert admin-race-management__alert--error">
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="admin-race-management__tabs">
        <button
          className={`tab ${activeTab === "races" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("races")}
        >
          Races
        </button>
        <button
          className={`tab ${activeTab === "drivers" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("drivers")}
        >
          Drivers
        </button>
        <button
          className={`tab ${activeTab === "tasks" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          Scheduled Tasks
        </button>
      </div>

      {loading ? (
        <div className="admin-race-management__loading">
          <div className="spinner"></div>
          <p>Loading data...</p>
        </div>
      ) : (
        <div className="admin-race-management__content">
          {/* Races Tab */}
          {activeTab === "races" && (
            <div className="races-section">
              <div className="section-header">
                <h2>Race Management</h2>
                <button
                  className="btn btn--primary"
                  onClick={() => handleSyncRace()}
                  disabled={syncingRaceId === -1}
                >
                  {syncingRaceId === -1 ? "Syncing..." : "Sync All Races"}
                </button>
              </div>

              <div className="races-table">
                <table>
                  <thead>
                    <tr>
                      <th>Round</th>
                      <th>Race</th>
                      <th>Circuit</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Sync Status</th>
                      <th>Last Sync</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {races.map((race) => (
                      <tr key={race.id}>
                        <td>{race.round}</td>
                        <td>
                          <strong>{race.name}</strong>
                          <span className="text-muted">{race.country}</span>
                        </td>
                        <td>{race.circuit}</td>
                        <td>{new Date(race.raceDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge badge--${race.status}`}>
                            {race.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getSyncStatusBadge(race.syncStatus)}`}>
                            {race.syncStatus}
                          </span>
                        </td>
                        <td className="text-muted">{formatDate(race.lastSyncAt)}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn btn--small btn--outline"
                              onClick={() => handleSyncRace(race.id)}
                              disabled={syncingRaceId === race.id}
                            >
                              {syncingRaceId === race.id ? "..." : "Sync"}
                            </button>
                            <button
                              className="btn btn--small btn--outline"
                              onClick={() => handleSyncResults(race.id)}
                              disabled={syncingRaceId === race.id}
                            >
                              Results
                            </button>
                            <button
                              className="btn btn--small btn--outline"
                              onClick={() => setEditingRace(race)}
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Sync History */}
              <div className="sync-history">
                <h3>Sync History</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Race</th>
                      <th>Status</th>
                      <th>Records</th>
                      <th>Triggered By</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncHistory.map((entry) => (
                      <tr key={entry.id}>
                        <td>{formatDate(entry.startedAt)}</td>
                        <td className="capitalize">{entry.syncType}</td>
                        <td>{entry.raceName || "All"}</td>
                        <td>
                          <span className={`badge ${getSyncHistoryStatusBadge(entry.status)}`}>
                            {entry.status.replace("_", " ")}
                          </span>
                        </td>
                        <td>{entry.recordsProcessed}</td>
                        <td>{entry.triggeredBy}</td>
                        <td className="text-muted">
                          {entry.errorMessage || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Drivers Tab */}
          {activeTab === "drivers" && (
            <div className="drivers-section">
              <div className="section-header">
                <h2>Driver Management</h2>
                <div className="section-header__actions">
                  <button
                    className="btn btn--outline"
                    onClick={handleSyncDrivers}
                    disabled={syncingRaceId === -2}
                  >
                    {syncingRaceId === -2 ? "Syncing..." : "Sync Drivers"}
                  </button>
                  <button
                    className="btn btn--primary"
                    onClick={() => setShowAddDriverModal(true)}
                  >
                    Add Driver
                  </button>
                </div>
              </div>

              <div className="drivers-table">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Driver</th>
                      <th>Code</th>
                      <th>Team</th>
                      <th>Country</th>
                      <th>Status</th>
                      <th>Price</th>
                      <th>Points</th>
                      <th>Avg</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map((driver) => (
                      <tr key={driver.id}>
                        <td>{driver.number || "—"}</td>
                        <td>
                          <strong>{driver.firstName} {driver.lastName}</strong>
                        </td>
                        <td>{driver.code}</td>
                        <td>{driver.team}</td>
                        <td>{driver.country}</td>
                        <td>
                          <span className={`badge badge--${driver.status}`}>
                            {driver.status}
                          </span>
                        </td>
                        <td>${driver.price.toFixed(1)}M</td>
                        <td>{driver.totalPoints}</td>
                        <td>{driver.averagePoints.toFixed(1)}</td>
                        <td>
                          <button
                            className="btn btn--small btn--outline"
                            onClick={() => setEditingDriver(driver)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="tasks-section">
              <div className="section-header">
                <h2>Celery Scheduled Tasks</h2>
                <button className="btn btn--outline" onClick={loadData}>
                  Refresh
                </button>
              </div>

              <div className="tasks-grid">
                {tasks.map((task) => (
                  <div key={task.id} className={`task-card ${!task.isEnabled ? "task-card--disabled" : ""}`}>
                    <div className="task-card__header">
                      <h3>{task.name}</h3>
                      <span className={`badge ${getTaskStatusBadge(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="task-card__body">
                      <div className="task-info">
                        <span className="label">Interval:</span>
                        <span>{task.interval || "Manual"}</span>
                      </div>
                      <div className="task-info">
                        <span className="label">Next Run:</span>
                        <span>{task.scheduledFor ? formatDate(task.scheduledFor) : "—"}</span>
                      </div>
                      <div className="task-info">
                        <span className="label">Last Run:</span>
                        <span>{task.lastRunAt ? formatDate(task.lastRunAt) : "Never"}</span>
                      </div>
                      {task.lastResult && (
                        <div className="task-info task-info--result">
                          <span className="label">Last Result:</span>
                          <span>{task.lastResult}</span>
                        </div>
                      )}
                    </div>
                    <div className="task-card__actions">
                      <button
                        className="btn btn--small btn--outline"
                        onClick={() => handleRunTask(task.id)}
                      >
                        Run Now
                      </button>
                      <button
                        className={`btn btn--small ${task.isEnabled ? "btn--danger" : "btn--success"}`}
                        onClick={() => handleToggleTask(task.id, task.isEnabled)}
                      >
                        {task.isEnabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Race Modal */}
      {editingRace && (
        <div className="modal-overlay" onClick={() => setEditingRace(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Edit Race</h2>
              <button className="modal__close" onClick={() => setEditingRace(null)}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label>Race Name</label>
                <input type="text" value={editingRace.name} disabled />
              </div>
              <div className="form-group">
                <label>Race Date</label>
                <input
                  type="datetime-local"
                  value={editingRace.raceDate.slice(0, 16)}
                  onChange={(e) =>
                    setEditingRace({ ...editingRace, raceDate: e.target.value + ":00Z" })
                  }
                />
              </div>
              <div className="form-group">
                <label>Qualifying Date</label>
                <input
                  type="datetime-local"
                  value={editingRace.qualifyingDate.slice(0, 16)}
                  onChange={(e) =>
                    setEditingRace({ ...editingRace, qualifyingDate: e.target.value + ":00Z" })
                  }
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editingRace.status}
                  onChange={(e) =>
                    setEditingRace({
                      ...editingRace,
                      status: e.target.value as AdminRace["status"],
                    })
                  }
                >
                  <option value="upcoming">Upcoming</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setEditingRace(null)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={() => handleUpdateRace(editingRace)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Driver Modal */}
      {editingDriver && (
        <div className="modal-overlay" onClick={() => setEditingDriver(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Edit Driver</h2>
              <button className="modal__close" onClick={() => setEditingDriver(null)}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-group">
                <label>Driver Name</label>
                <input
                  type="text"
                  value={`${editingDriver.firstName} ${editingDriver.lastName}`}
                  disabled
                />
              </div>
              <div className="form-group">
                <label>Team</label>
                <input
                  type="text"
                  value={editingDriver.team}
                  onChange={(e) =>
                    setEditingDriver({ ...editingDriver, team: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Price (M)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editingDriver.price}
                  onChange={(e) =>
                    setEditingDriver({ ...editingDriver, price: parseFloat(e.target.value) })
                  }
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={editingDriver.status}
                  onChange={(e) =>
                    setEditingDriver({
                      ...editingDriver,
                      status: e.target.value as AdminDriver["status"],
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="reserve">Reserve</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setEditingDriver(null)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={() => handleUpdateDriver(editingDriver)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddDriverModal && (
        <div className="modal-overlay" onClick={() => setShowAddDriverModal(false)}>
          <div className="modal modal--large" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>Add New Driver</h2>
              <button className="modal__close" onClick={() => setShowAddDriverModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal__body">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={newDriver.firstName}
                    onChange={(e) => setNewDriver({ ...newDriver, firstName: e.target.value })}
                    placeholder="e.g., Oscar"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={newDriver.lastName}
                    onChange={(e) => setNewDriver({ ...newDriver, lastName: e.target.value })}
                    placeholder="e.g., Piastri"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Code (3 letters) *</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={newDriver.code}
                    onChange={(e) => setNewDriver({ ...newDriver, code: e.target.value })}
                    placeholder="e.g., PIA"
                  />
                </div>
                <div className="form-group">
                  <label>Number</label>
                  <input
                    type="number"
                    value={newDriver.number}
                    onChange={(e) => setNewDriver({ ...newDriver, number: e.target.value })}
                    placeholder="e.g., 81"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Team *</label>
                  <input
                    type="text"
                    value={newDriver.team}
                    onChange={(e) => setNewDriver({ ...newDriver, team: e.target.value })}
                    placeholder="e.g., McLaren"
                  />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    value={newDriver.country}
                    onChange={(e) => setNewDriver({ ...newDriver, country: e.target.value })}
                    placeholder="e.g., Australia"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={newDriver.status}
                    onChange={(e) =>
                      setNewDriver({ ...newDriver, status: e.target.value as "active" | "reserve" })
                    }
                  >
                    <option value="reserve">Reserve</option>
                    <option value="active">Active</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Price (M) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDriver.price}
                    onChange={(e) => setNewDriver({ ...newDriver, price: e.target.value })}
                    placeholder="e.g., 15.0"
                  />
                </div>
              </div>
            </div>
            <div className="modal__footer">
              <button className="btn btn--outline" onClick={() => setShowAddDriverModal(false)}>
                Cancel
              </button>
              <button className="btn btn--primary" onClick={handleAddDriver}>
                Add Driver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRaceManagementPage;
