import { apiClient as api } from './api';
import type { MyTeam, TeamDetail, TeamPick, UpdateTeamNameRequest, AddPickRequest, Driver } from '../types';

/**
 * Get all teams for the current user
 */
export async function getMyTeams(sort: string = 'alphabetical'): Promise<MyTeam[]> {
  return api.get<MyTeam[]>('/teams/my-teams', {
    params: {
      sort,
    },
  });
}

/**
 * Get detailed information about a specific team
 */
export async function getTeamDetail(teamId: string): Promise<TeamDetail> {
  return api.get<TeamDetail>(`/teams/${teamId}`);
}

/**
 * Get all picks for a specific team
 */
export async function getTeamPicks(teamId: string): Promise<TeamPick[]> {
  return api.get<TeamPick[]>(`/teams/${teamId}/picks`);
}

/**
 * Update team name
 */
export async function updateTeamName(teamId: string, data: UpdateTeamNameRequest): Promise<TeamDetail> {
  return api.put<TeamDetail>(`/teams/${teamId}`, data);
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string): Promise<void> {
  return api.delete<void>(`/teams/${teamId}`);
}

/**
 * Add picks to a team for a specific race
 */
export async function addTeamPick(teamId: string, data: AddPickRequest): Promise<TeamPick[]> {
  return api.post<TeamPick[]>(`/teams/${teamId}/picks`, data);
}

/**
 * Get available drivers for a race (with optional filters)
 */
export async function getAvailableDrivers(filters?: {
  team?: string;
  search?: string;
  sort?: string;
}): Promise<Driver[]> {
  return api.get<Driver[]>('/drivers', {
    params: filters,
  });
}

/**
 * Remove a pick from a team
 */
export async function removePick(teamId: string, pickId: string): Promise<void> {
  return api.delete<void>(`/teams/${teamId}/picks/${pickId}`);
}
