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
};