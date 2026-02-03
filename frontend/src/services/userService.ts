import { apiClient } from './api';
import type { User } from '../types';

export interface UpdateProfileRequest {
  email?: string;
  full_name?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UserSearchResult {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
}

export interface UserPreferences {
  // Email notification preferences
  notify_race_completed: boolean;
  notify_draft_turn: boolean;
  notify_league_invitations: boolean;
  notify_team_updates: boolean;

  // Display preferences
  theme_preference: string;
  language_preference: string;
  timezone_preference: string;

  // Privacy settings
  profile_visibility: string;
  show_email_to_league_members: boolean;

  // Auto-pick preferences
  auto_pick_enabled: boolean;
  auto_pick_strategy: string;
}

export const userService = {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/users/me');
  },

  /**
   * Update user profile (email and/or full_name)
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return apiClient.put<User>('/users/me', data);
  },

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return apiClient.put<void>('/users/me/change-password', data);
  },

  /**
   * Search users by username or email
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserSearchResult[]> {
    return apiClient.get<UserSearchResult[]>(`/users/search/?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreferences> {
    return apiClient.get<UserPreferences>('/users/me/preferences');
  },

  /**
   * Update user preferences
   */
  async updateUserPreferences(data: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiClient.put<UserPreferences>('/users/me/preferences', data);
  },
};
