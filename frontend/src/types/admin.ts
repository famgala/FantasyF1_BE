// Admin Types

export interface AdminStats {
  total_users: number;
  active_users_7d: number;
  total_leagues: number;
  active_leagues: number;
  completed_races: number;
  upcoming_races: number;
  user_registrations_by_day: DailyStat[];
  league_creations_by_day: DailyStat[];
}

export interface DailyStat {
  date: string;
  count: number;
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  error_type: string;
  message: string;
  endpoint?: string;
  user_id?: string;
  severity: 'error' | 'warning' | 'info';
  status: 'resolved' | 'unresolved';
  stack_trace?: string;
  request_data?: Record<string, any>;
  response_data?: Record<string, any>;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface ErrorLogFilters {
  severity?: 'error' | 'warning' | 'info';
  status?: 'all' | 'resolved' | 'unresolved';
  error_type?: string;
  endpoint?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}

export interface ErrorLogListResponse {
  logs: ErrorLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ResolveErrorRequest {
  resolution_notes?: string;
}

export interface HealthStatus {
  overall_status: 'healthy' | 'degraded' | 'unhealthy';
  last_checked: string;
  components: {
    api: ComponentHealth;
    database: ComponentHealth;
    redis: ComponentHealth;
    celery: ComponentHealth;
  };
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  response_time_ms: number;
  message?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  team_count: number;
  league_count: number;
}

export interface AdminUserFilters {
  search?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  page?: number;
  page_size?: number;
}

export interface AdminUserListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface UpdateUserRequest {
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UserActivity {
  activity_type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface UserDetail extends AdminUser {
  activity: UserActivity[];
}
