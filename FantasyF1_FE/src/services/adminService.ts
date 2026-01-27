/**
 * Admin Service
 * 
 * Service layer for admin dashboard functionality including
 * statistics, user management, league management, and system monitoring.
 */

import api from "./api";

/**
 * Platform Statistics Interface
 */
export interface PlatformStats {
  totalUsers: number;
  activeUsers7d: number;
  totalLeagues: number;
  activeLeagues: number;
  completedRaces: number;
  upcomingRaces: number;
  registrationsByDay: { date: string; count: number }[];
  leaguesByDay: { date: string; count: number }[];
}

/**
 * Admin User Interface
 */
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
  teamsCount: number;
}

/**
 * Admin League Interface
 */
export interface AdminLeague {
  id: number;
  name: string;
  code: string;
  manager: {
    id: number;
    username: string;
  };
  isPrivate: boolean;
  status: "drafting" | "active" | "completed" | "cancelled";
  teamsCount: number;
  maxTeams: number;
  createdAt: string;
}

/**
 * Error Log Interface
 */
export interface ErrorLog {
  id: number;
  timestamp: string;
  type: "validation" | "auth" | "server" | "database" | "external";
  severity: "error" | "warning" | "critical";
  message: string;
  endpoint: string;
  userId?: number;
  stackTrace?: string;
}

/**
 * System Health Interface
 */
export interface SystemHealth {
  api: "healthy" | "degraded" | "down";
  database: "healthy" | "degraded" | "down";
  redis: "healthy" | "degraded" | "down";
  celery: "healthy" | "degraded" | "down";
  responseTimes: {
    api: number;
    database: number;
    redis: number;
  };
}

/**
 * Broadcast Notification Request Interface
 */
export interface BroadcastNotificationRequest {
  type: "system" | "announcement" | "alert";
  title: string;
  message: string;
  link?: string;
  recipients: "all" | number | number[];
  scheduledAt?: string;
}

/**
 * Fetches platform statistics for admin dashboard
 */
export const getPlatformStats = async (): Promise<PlatformStats> => {
  try {
    // In production, this would call the actual API
    // const response = await api.get("/admin/stats");
    // return response.data;

    // Mock data for development
    return {
      totalUsers: 1247,
      activeUsers7d: 523,
      totalLeagues: 89,
      activeLeagues: 67,
      completedRaces: 5,
      upcomingRaces: 19,
      registrationsByDay: generateMockDailyData(30, 10, 50),
      leaguesByDay: generateMockDailyData(30, 1, 5),
    };
  } catch (error) {
    console.error("Failed to fetch platform stats:", error);
    throw error;
  }
};

/**
 * Fetches all users for admin management
 */
export const getAdminUsers = async (params?: {
  search?: string;
  role?: "user" | "admin";
  status?: "active" | "inactive";
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUser[]; total: number }> => {
  try {
    // In production: const response = await api.get("/admin/users", { params });
    
    // Mock data
    const users: AdminUser[] = [
      {
        id: 1,
        username: "admin_user",
        email: "admin@fantasyf1.com",
        fullName: "Admin User",
        role: "admin",
        isActive: true,
        createdAt: "2025-01-01T00:00:00Z",
        lastLogin: "2026-01-26T10:30:00Z",
        teamsCount: 3,
      },
      {
        id: 2,
        username: "john_doe",
        email: "john@example.com",
        fullName: "John Doe",
        role: "user",
        isActive: true,
        createdAt: "2025-02-15T00:00:00Z",
        lastLogin: "2026-01-25T14:20:00Z",
        teamsCount: 2,
      },
      {
        id: 3,
        username: "jane_smith",
        email: "jane@example.com",
        fullName: "Jane Smith",
        role: "user",
        isActive: false,
        createdAt: "2025-03-20T00:00:00Z",
        lastLogin: "2026-01-10T09:15:00Z",
        teamsCount: 1,
      },
    ];

    return { users, total: users.length };
  } catch (error) {
    console.error("Failed to fetch admin users:", error);
    throw error;
  }
};

/**
 * Updates user status (activate/deactivate)
 */
export const updateUserStatus = async (
  userId: number,
  isActive: boolean
): Promise<void> => {
  try {
    // await api.patch(`/admin/users/${userId}`, { isActive });
    console.log(`User ${userId} status updated to ${isActive}`);
  } catch (error) {
    console.error("Failed to update user status:", error);
    throw error;
  }
};

/**
 * Updates user role
 */
export const updateUserRole = async (
  userId: number,
  role: "user" | "admin"
): Promise<void> => {
  try {
    // await api.patch(`/admin/users/${userId}`, { role });
    console.log(`User ${userId} role updated to ${role}`);
  } catch (error) {
    console.error("Failed to update user role:", error);
    throw error;
  }
};

/**
 * Fetches all leagues for admin management
 */
export const getAdminLeagues = async (params?: {
  search?: string;
  privacy?: "public" | "private";
  status?: "drafting" | "active" | "completed" | "cancelled";
  limit?: number;
  offset?: number;
}): Promise<{ leagues: AdminLeague[]; total: number }> => {
  try {
    // In production: const response = await api.get("/admin/leagues", { params });
    
    // Mock data
    const leagues: AdminLeague[] = [
      {
        id: 1,
        name: "F1 Champions League",
        code: "F1CL2026",
        manager: { id: 1, username: "admin_user" },
        isPrivate: false,
        status: "active",
        teamsCount: 12,
        maxTeams: 20,
        createdAt: "2025-12-01T00:00:00Z",
      },
      {
        id: 2,
        name: "Office Fantasy F1",
        code: "OFF123",
        manager: { id: 2, username: "john_doe" },
        isPrivate: true,
        status: "drafting",
        teamsCount: 8,
        maxTeams: 10,
        createdAt: "2026-01-15T00:00:00Z",
      },
    ];

    return { leagues, total: leagues.length };
  } catch (error) {
    console.error("Failed to fetch admin leagues:", error);
    throw error;
  }
};

/**
 * Updates league status
 */
export const updateLeagueStatus = async (
  leagueId: number,
  status: "active" | "cancelled"
): Promise<void> => {
  try {
    // await api.patch(`/admin/leagues/${leagueId}`, { status });
    console.log(`League ${leagueId} status updated to ${status}`);
  } catch (error) {
    console.error("Failed to update league status:", error);
    throw error;
  }
};

/**
 * Deletes a league
 */
export const deleteLeague = async (leagueId: number): Promise<void> => {
  try {
    // await api.delete(`/admin/leagues/${leagueId}`);
    console.log(`League ${leagueId} deleted`);
  } catch (error) {
    console.error("Failed to delete league:", error);
    throw error;
  }
};

/**
 * Fetches error logs for admin monitoring
 */
export const getErrorLogs = async (params?: {
  startDate?: string;
  endDate?: string;
  type?: string;
  severity?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: ErrorLog[]; total: number }> => {
  try {
    // In production: const response = await api.get("/admin/logs", { params });
    
    // Mock data
    const logs: ErrorLog[] = [
      {
        id: 1,
        timestamp: "2026-01-26T15:30:00Z",
        type: "validation",
        severity: "warning",
        message: "Invalid email format in registration",
        endpoint: "/api/v1/auth/register",
        userId: 0,
      },
      {
        id: 2,
        timestamp: "2026-01-26T14:45:00Z",
        type: "auth",
        severity: "error",
        message: "Failed login attempt - invalid credentials",
        endpoint: "/api/v1/auth/login",
        userId: 5,
      },
      {
        id: 3,
        timestamp: "2026-01-26T12:20:00Z",
        type: "database",
        severity: "critical",
        message: "Connection timeout to primary database",
        endpoint: "/api/v1/leagues",
        stackTrace: "ConnectionError: timeout after 30000ms...",
      },
    ];

    return { logs, total: logs.length };
  } catch (error) {
    console.error("Failed to fetch error logs:", error);
    throw error;
  }
};

/**
 * Fetches system health status
 */
export const getSystemHealth = async (): Promise<SystemHealth> => {
  try {
    // In production: const response = await api.get("/admin/health");
    
    // Mock data
    return {
      api: "healthy",
      database: "healthy",
      redis: "healthy",
      celery: "healthy",
      responseTimes: {
        api: 45,
        database: 12,
        redis: 3,
      },
    };
  } catch (error) {
    console.error("Failed to fetch system health:", error);
    throw error;
  }
};

/**
 * Triggers race data sync from external API
 */
export const triggerRaceSync = async (raceId?: number): Promise<void> => {
  try {
    // await api.post("/admin/sync/races", { raceId });
    console.log(`Race sync triggered${raceId ? ` for race ${raceId}` : ""}`);
  } catch (error) {
    console.error("Failed to trigger race sync:", error);
    throw error;
  }
};

/**
 * Sends a broadcast notification
 */
export const sendBroadcastNotification = async (
  notification: BroadcastNotificationRequest
): Promise<void> => {
  try {
    // await api.post("/admin/notifications/broadcast", notification);
    console.log("Broadcast notification sent:", notification);
  } catch (error) {
    console.error("Failed to send broadcast notification:", error);
    throw error;
  }
};

/**
 * Admin Race Interface
 */
export interface AdminRace {
  id: number;
  name: string;
  circuit: string;
  country: string;
  city: string;
  round: number;
  raceDate: string;
  qualifyingDate: string;
  laps: number;
  status: "upcoming" | "completed" | "cancelled";
  syncStatus: "synced" | "pending" | "failed" | "never";
  lastSyncAt: string | null;
}

/**
 * Sync History Entry Interface
 */
export interface SyncHistoryEntry {
  id: number;
  raceId: number | null;
  raceName: string | null;
  syncType: "race" | "results" | "drivers" | "all";
  status: "success" | "failed" | "in_progress";
  startedAt: string;
  completedAt: string | null;
  recordsProcessed: number;
  errorMessage: string | null;
  triggeredBy: string;
}

/**
 * Admin Driver Interface
 */
export interface AdminDriver {
  id: number;
  firstName: string;
  lastName: string;
  code: string;
  number: number | null;
  team: string;
  country: string;
  status: "active" | "reserve" | "retired";
  price: number;
  totalPoints: number;
  averagePoints: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Celery Task Interface
 */
export interface CeleryTask {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "failed" | "scheduled";
  scheduledFor: string | null;
  lastRunAt: string | null;
  lastResult: string | null;
  interval: string | null;
  isEnabled: boolean;
}

/**
 * Fetches all races for admin management
 */
export const getAdminRaces = async (params?: {
  year?: number;
  status?: "upcoming" | "completed" | "cancelled";
}): Promise<AdminRace[]> => {
  try {
    // In production: const response = await api.get("/admin/races", { params });
    
    // Mock data
    const races: AdminRace[] = [
      {
        id: 1,
        name: "Bahrain Grand Prix",
        circuit: "Bahrain International Circuit",
        country: "Bahrain",
        city: "Sakhir",
        round: 1,
        raceDate: "2026-03-15T15:00:00Z",
        qualifyingDate: "2026-03-14T15:00:00Z",
        laps: 57,
        status: "upcoming",
        syncStatus: "synced",
        lastSyncAt: "2026-01-25T10:00:00Z",
      },
      {
        id: 2,
        name: "Saudi Arabian Grand Prix",
        circuit: "Jeddah Corniche Circuit",
        country: "Saudi Arabia",
        city: "Jeddah",
        round: 2,
        raceDate: "2026-03-22T17:00:00Z",
        qualifyingDate: "2026-03-21T17:00:00Z",
        laps: 50,
        status: "upcoming",
        syncStatus: "synced",
        lastSyncAt: "2026-01-25T10:00:00Z",
      },
      {
        id: 3,
        name: "Australian Grand Prix",
        circuit: "Albert Park Circuit",
        country: "Australia",
        city: "Melbourne",
        round: 3,
        raceDate: "2026-03-29T05:00:00Z",
        qualifyingDate: "2026-03-28T06:00:00Z",
        laps: 58,
        status: "upcoming",
        syncStatus: "pending",
        lastSyncAt: null,
      },
    ];

    return races;
  } catch (error) {
    console.error("Failed to fetch admin races:", error);
    throw error;
  }
};

/**
 * Updates a race's details
 */
export const updateAdminRace = async (
  raceId: number,
  data: Partial<Pick<AdminRace, "raceDate" | "qualifyingDate" | "status">>
): Promise<void> => {
  try {
    // await api.patch(`/admin/races/${raceId}`, data);
    console.log(`Race ${raceId} updated:`, data);
  } catch (error) {
    console.error("Failed to update race:", error);
    throw error;
  }
};

/**
 * Fetches sync history
 */
export const getSyncHistory = async (params?: {
  raceId?: number;
  syncType?: string;
  status?: string;
  limit?: number;
}): Promise<SyncHistoryEntry[]> => {
  try {
    // In production: const response = await api.get("/admin/sync/history", { params });
    
    // Mock data
    const history: SyncHistoryEntry[] = [
      {
        id: 1,
        raceId: 1,
        raceName: "Bahrain Grand Prix",
        syncType: "race",
        status: "success",
        startedAt: "2026-01-25T10:00:00Z",
        completedAt: "2026-01-25T10:00:15Z",
        recordsProcessed: 1,
        errorMessage: null,
        triggeredBy: "admin_user",
      },
      {
        id: 2,
        raceId: null,
        raceName: null,
        syncType: "drivers",
        status: "success",
        startedAt: "2026-01-25T09:00:00Z",
        completedAt: "2026-01-25T09:00:45Z",
        recordsProcessed: 20,
        errorMessage: null,
        triggeredBy: "scheduled",
      },
      {
        id: 3,
        raceId: 2,
        raceName: "Saudi Arabian Grand Prix",
        syncType: "results",
        status: "failed",
        startedAt: "2026-01-24T12:00:00Z",
        completedAt: "2026-01-24T12:00:30Z",
        recordsProcessed: 0,
        errorMessage: "Race results not yet available",
        triggeredBy: "admin_user",
      },
    ];

    return history;
  } catch (error) {
    console.error("Failed to fetch sync history:", error);
    throw error;
  }
};

/**
 * Triggers sync for a specific race or all races
 */
export const triggerSync = async (params: {
  raceId?: number;
  syncType: "race" | "results" | "drivers" | "all";
}): Promise<{ taskId: string }> => {
  try {
    // const response = await api.post("/admin/sync", params);
    // return response.data;
    console.log("Sync triggered:", params);
    return { taskId: `task_${Date.now()}` };
  } catch (error) {
    console.error("Failed to trigger sync:", error);
    throw error;
  }
};

/**
 * Fetches all drivers for admin management
 */
export const getAdminDrivers = async (params?: {
  search?: string;
  status?: "active" | "reserve" | "retired";
  team?: string;
}): Promise<AdminDriver[]> => {
  try {
    // In production: const response = await api.get("/admin/drivers", { params });
    
    // Mock data
    const drivers: AdminDriver[] = [
      {
        id: 1,
        firstName: "Max",
        lastName: "Verstappen",
        code: "VER",
        number: 1,
        team: "Red Bull Racing",
        country: "Netherlands",
        status: "active",
        price: 30.5,
        totalPoints: 575,
        averagePoints: 23.0,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2026-01-25T10:00:00Z",
      },
      {
        id: 2,
        firstName: "Lewis",
        lastName: "Hamilton",
        code: "HAM",
        number: 44,
        team: "Ferrari",
        country: "United Kingdom",
        status: "active",
        price: 28.0,
        totalPoints: 480,
        averagePoints: 19.2,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2026-01-25T10:00:00Z",
      },
      {
        id: 3,
        firstName: "Liam",
        lastName: "Lawson",
        code: "LAW",
        number: 30,
        team: "Red Bull Racing",
        country: "New Zealand",
        status: "active",
        price: 15.0,
        totalPoints: 120,
        averagePoints: 8.0,
        createdAt: "2025-01-01T00:00:00Z",
        updatedAt: "2026-01-25T10:00:00Z",
      },
    ];

    return drivers;
  } catch (error) {
    console.error("Failed to fetch admin drivers:", error);
    throw error;
  }
};

/**
 * Updates a driver's details
 */
export const updateAdminDriver = async (
  driverId: number,
  data: Partial<Pick<AdminDriver, "price" | "status" | "team">>
): Promise<void> => {
  try {
    // await api.patch(`/admin/drivers/${driverId}`, data);
    console.log(`Driver ${driverId} updated:`, data);
  } catch (error) {
    console.error("Failed to update driver:", error);
    throw error;
  }
};

/**
 * Adds a new driver (reserve call-up)
 */
export const addAdminDriver = async (data: {
  firstName: string;
  lastName: string;
  code: string;
  number: number | null;
  team: string;
  country: string;
  status: "active" | "reserve";
  price: number;
}): Promise<AdminDriver> => {
  try {
    // const response = await api.post("/admin/drivers", data);
    // return response.data;
    console.log("New driver added:", data);
    return {
      id: Date.now(),
      ...data,
      totalPoints: 0,
      averagePoints: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to add driver:", error);
    throw error;
  }
};

/**
 * Fetches Celery task status
 */
export const getCeleryTasks = async (): Promise<CeleryTask[]> => {
  try {
    // In production: const response = await api.get("/admin/tasks");
    
    // Mock data
    const tasks: CeleryTask[] = [
      {
        id: "sync_race_data",
        name: "Sync Race Data",
        status: "scheduled",
        scheduledFor: "2026-01-27T08:00:00Z",
        lastRunAt: "2026-01-26T08:00:00Z",
        lastResult: "Success: 24 races synced",
        interval: "Daily at 8:00 AM EST",
        isEnabled: true,
      },
      {
        id: "sync_race_results",
        name: "Sync Race Results",
        status: "scheduled",
        scheduledFor: null,
        lastRunAt: "2026-01-20T20:30:00Z",
        lastResult: "Success: Results for Round 0 synced",
        interval: "After each race",
        isEnabled: true,
      },
      {
        id: "update_driver_stats",
        name: "Update Driver Statistics",
        status: "success",
        scheduledFor: "2026-01-27T00:00:00Z",
        lastRunAt: "2026-01-26T00:00:00Z",
        lastResult: "Success: 20 drivers updated",
        interval: "Daily at midnight",
        isEnabled: true,
      },
      {
        id: "calculate_fantasy_scores",
        name: "Calculate Fantasy Scores",
        status: "scheduled",
        scheduledFor: null,
        lastRunAt: "2026-01-20T20:45:00Z",
        lastResult: "Success: Scores calculated for 89 leagues",
        interval: "After race results sync",
        isEnabled: true,
      },
      {
        id: "send_draft_reminders",
        name: "Send Draft Reminders",
        status: "scheduled",
        scheduledFor: "2026-03-09T08:00:00Z",
        lastRunAt: null,
        lastResult: null,
        interval: "Monday before each race",
        isEnabled: true,
      },
    ];

    return tasks;
  } catch (error) {
    console.error("Failed to fetch Celery tasks:", error);
    throw error;
  }
};

/**
 * Toggles a Celery task's enabled state
 */
export const toggleCeleryTask = async (
  taskId: string,
  isEnabled: boolean
): Promise<void> => {
  try {
    // await api.patch(`/admin/tasks/${taskId}`, { isEnabled });
    console.log(`Task ${taskId} toggled to ${isEnabled}`);
  } catch (error) {
    console.error("Failed to toggle task:", error);
    throw error;
  }
};

/**
 * Manually runs a Celery task
 */
export const runCeleryTask = async (taskId: string): Promise<{ success: boolean }> => {
  try {
    // const response = await api.post(`/admin/tasks/${taskId}/run`);
    // return response.data;
    console.log(`Task ${taskId} manually triggered`);
    return { success: true };
  } catch (error) {
    console.error("Failed to run task:", error);
    throw error;
  }
};

/**
 * Helper function to generate mock daily data
 */
function generateMockDailyData(
  days: number,
  minCount: number,
  maxCount: number
): { date: string; count: number }[] {
  const data: { date: string; count: number }[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split("T")[0],
      count: Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount,
    });
  }

  return data;
}

export default {
  getPlatformStats,
  getAdminUsers,
  updateUserStatus,
  updateUserRole,
  getAdminLeagues,
  updateLeagueStatus,
  deleteLeague,
  getErrorLogs,
  getSystemHealth,
  triggerRaceSync,
  sendBroadcastNotification,
};
