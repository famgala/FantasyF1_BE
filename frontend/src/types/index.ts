// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  full_name: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface UpdateProfileRequest {
  email?: string;
  full_name?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// League Types
export interface League {
  id: string;
  name: string;
  description: string;
  code: string;
  creator_id: string;
  max_teams: number;
  privacy: 'public' | 'private';
  draft_method: 'random' | 'sequential' | 'snake';
  draft_close_condition: string;
  scoring_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LeagueWithTeamCount extends League {
  team_count: number;
}

export interface GetLeaguesRequest {
  page?: number;
  page_size?: number;
  privacy?: 'public' | 'private';
}

export interface CreateLeagueRequest {
  name: string;
  description?: string;
  max_teams: number;
  privacy: 'public' | 'private';
  draft_method: 'random' | 'sequential' | 'snake';
  draft_close_condition: string;
  scoring_settings?: Record<string, any>;
}

export interface JoinLeagueRequest {
  team_name: string;
}

export interface UpdateLeagueRequest {
  name?: string;
  description?: string;
  max_teams?: number;
  is_private?: boolean;
  draft_method?: 'random' | 'sequential' | 'snake';
  draft_close_condition?: 'race_start' | 'manual' | 'time_limit';
  scoring_settings?: Record<string, any>;
}

export interface MyLeague {
  id: string;
  name: string;
  description: string;
  code: string;
  creator_id: string;
  max_teams: number;
  privacy: 'public' | 'private';
  draft_method: 'random' | 'sequential' | 'snake';
  draft_close_condition: string;
  scoring_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  team_count: number;
  my_team_id: string;
  my_team_name: string;
  my_team_rank: number;
  my_team_points: number;
}

export interface ScoringSettings {
  // Add specific scoring settings as needed
  // This is a placeholder for future expansion
  [key: string]: any;
}

export interface LeagueMember {
  user_id: string;
  username: string;
  full_name: string;
  role: 'creator' | 'co_manager' | 'member';
  joined_at: string;
}

// Team Types
export interface FantasyTeam {
  id: string;
  name: string;
  league_id: string;
  user_id: string;
  total_points: number;
  budget: number;
  budget_remaining: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MyTeam {
  id: string;
  name: string;
  league_id: string;
  league_name: string;
  total_points: number;
  budget_remaining: number;
  is_active: boolean;
  created_at: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  league_id: string;
  league_name: string;
  user_id: string;
  username: string;
  total_points: number;
  budget: number;
  budget_remaining: number;
  is_active: boolean;
  can_delete: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamPick {
  id: string;
  team_id: string;
  driver_id: string;
  driver_name: string;
  driver_number: number;
  driver_team: string;
  driver_price: number;
  points_earned: number;
  race_id: string;
  race_name: string;
  race_date: string;
  race_round: number;
  race_status: 'upcoming' | 'ongoing' | 'completed';
  created_at: string;
}

export interface UpdateTeamNameRequest {
  name: string;
}

export interface AddPickRequest {
  race_id: string;
  driver_ids: string[];
}

// Driver Types
export interface Driver {
  id: string;
  code: string;
  number: number;
  name: string;
  team: string;
  country: string;
  price: number;
  total_points: number;
  average_points: number;
  is_active: boolean;
}

export interface GetDriversRequest {
  page?: number;
  page_size?: number;
  team?: string;
  sort_by?: 'name' | 'points' | 'price' | 'number';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedDriversResponse extends PaginatedResponse<Driver> {}

// Race Types
export interface Race {
  id: string;
  name: string;
  circuit: string;
  country: string;
  date: string;
  round_number: number;
  status: 'upcoming' | 'ongoing' | 'completed';
  winning_constructor?: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

// Invitation Types
export interface Invitation {
  id: string;
  league_id: string;
  league_name: string;
  inviter_id: string;
  inviter_username: string;
  invitee_email?: string;
  invitee_username?: string;
  invitee_user_id?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  created_at: string;
  expires_at: string;
}

// Send Invitation Request Types
export interface EmailInvitationRequest {
  email: string;
  message?: string;
}

export interface UsernameInvitationRequest {
  username: string;
  message?: string;
}

export interface UserIdInvitationRequest {
  user_id: string;
  message?: string;
}

export interface CodeInvitationRequest {
  message?: string;
}

export interface SentInvitation {
  id: string;
  league_id: string;
  inviter_id: string;
  invitee_email?: string;
  invitee_username?: string;
  invitee_user_id?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  invite_code?: string;
  created_at: string;
  expires_at: string;
}

export interface ReceivedInvitation {
  id: string;
  league_id: string;
  league_name: string;
  inviter_id: string;
  inviter_username: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  created_at: string;
  expires_at: string;
}

export interface AcceptInvitationRequest {
  team_name: string;
}

export interface RejectInvitationRequest {
  reason?: string;
}

// Draft Types
export interface DraftPick {
  id: string;
  league_id: string;
  team_id: string;
  team_name: string;
  driver_id: string;
  driver_name: string;
  round: number;
  pick_number: number;
  is_auto_pick: boolean;
  created_at: string;
}

export interface DraftStatus {
  league_id: string;
  race_id: number;
  draft_method: 'random' | 'sequential' | 'snake';
  is_draft_complete: boolean;
  total_teams: number;
  total_picks_made: number;
  current_round: number;
  current_position: number;
  current_team?: {
    id: string;
    name: string;
    user_id: string;
  };
  next_pick?: {
    fantasy_team_id: string;
    pick_round: number;
    draft_position: number;
  };
}

export interface DraftOrderTeam {
  draft_order_number: number;
  team_id: string;
  team_name: string;
  user_id: string;
}

export interface DraftOrder {
  league_id: string;
  race_id: number;
  draft_method: 'random' | 'sequential' | 'snake';
  draft_orders: DraftOrderTeam[];
}

export interface CreateDraftOrderRequest {
  race_id: number;
  draft_method: 'random' | 'sequential' | 'snake';
}

export interface AvailableDriver {
  id: string;
  code: string;
  number: number;
  name: string;
  team: string;
  country: string;
  price: number;
  total_points: number;
  average_points: number;
  is_active: boolean;
  is_drafted?: boolean;
}

export interface MakeDraftPickRequest {
  driver_id: string;
}

export interface DraftPickResponse {
  id: string;
  league_id: string;
  team_id: string;
  team_name: string;
  driver_id: string;
  driver_name: string;
  round: number;
  pick_number: number;
  is_auto_pick: boolean;
  created_at: string;
}

// Constructor Types
export interface Constructor {
  id: string;
  name: string;
  code: string;
  engine: string;
  nationality: string;
  points: number;
  wins: number;
  championships: number;
  is_active: boolean;
  created_at: string;
}

export interface ConstructorWithDrivers extends Constructor {
  drivers: Driver[];
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}

// Form Types
export interface FormFieldError {
  field: string;
  message: string;
}

// Axios Types (re-export for convenience)
export type { AxiosInstance } from 'axios';
