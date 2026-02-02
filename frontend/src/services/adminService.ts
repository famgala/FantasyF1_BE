import { apiClient } from './api';
import type {
  AdminStats,
  ErrorLog,
  ErrorLogFilters,
  ErrorLogListResponse,
  ResolveErrorRequest,
  HealthStatus,
  AdminUserFilters,
  AdminUserListResponse,
  AdminUser,
  UpdateUserRequest,
  UserDetail,
} from '../types/admin';

const BASE_URL = '/admin';

export const adminService = {
  // Statistics
  async getStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>(`${BASE_URL}/stats`);
  },

  // Error Logs
  async getErrorLogs(filters: ErrorLogFilters = {}): Promise<ErrorLogListResponse> {
    const params = new URLSearchParams();
    
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.error_type) params.append('error_type', filters.error_type);
    if (filters.endpoint) params.append('endpoint', filters.endpoint);
    if (filters.user_id) params.append('user_id', filters.user_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.page_size) params.append('page_size', String(filters.page_size));

    return apiClient.get<ErrorLogListResponse>(`${BASE_URL}/logs`, params);
  },

  async resolveError(logId: string, data: ResolveErrorRequest): Promise<ErrorLog> {
    return apiClient.put<ErrorLog>(`${BASE_URL}/logs/${logId}`, data);
  },

  async unresolveError(logId: string): Promise<ErrorLog> {
    return apiClient.put<ErrorLog>(`${BASE_URL}/logs/${logId}/unresolve`, {});
  },

  // System Health
  async getHealthStatus(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>(`${BASE_URL}/health`);
  },

  // User Management
  async getUsers(filters: AdminUserFilters = {}): Promise<AdminUserListResponse> {
    const params = new URLSearchParams();
    
    if (filters.search) params.append('search', filters.search);
    if (filters.is_active !== undefined) params.append('is_active', String(filters.is_active));
    if (filters.is_superuser !== undefined) params.append('is_superuser', String(filters.is_superuser));
    if (filters.page) params.append('page', String(filters.page));
    if (filters.page_size) params.append('page_size', String(filters.page_size));

    return apiClient.get<AdminUserListResponse>(`${BASE_URL}/users`, params);
  },

  async getUserById(userId: string): Promise<UserDetail> {
    return apiClient.get<UserDetail>(`${BASE_URL}/users/${userId}`);
  },

  async updateUser(userId: string, data: UpdateUserRequest): Promise<AdminUser> {
    return apiClient.patch<AdminUser>(`${BASE_URL}/users/${userId}`, data);
  },
};
