import { apiClient as api } from './api';
import type { League, PaginatedResponse, CreateLeagueRequest, JoinLeagueRequest, LeagueMember, FantasyTeam, UpdateLeagueRequest, MyLeague, MyRoleResponse } from '../types';

export interface GetLeaguesRequest {
  page?: number;
  page_size?: number;
  privacy?: 'public' | 'private';
}

export interface LeagueWithTeamCount extends League {
  team_count: number;
}

/**
 * Get paginated list of leagues
 */
export async function getLeagues(
  params: GetLeaguesRequest = {}
): Promise<PaginatedResponse<LeagueWithTeamCount>> {
  return api.get<PaginatedResponse<LeagueWithTeamCount>>('/leagues', {
    params: {
      page: params.page || 1,
      page_size: params.page_size || 20,
      ...(params.privacy && { privacy: params.privacy }),
    },
  });
}

/**
 * Search leagues by name
 */
export async function searchLeagues(
  query: string,
  page: number = 1,
  page_size: number = 20
): Promise<PaginatedResponse<LeagueWithTeamCount>> {
  return api.get<PaginatedResponse<LeagueWithTeamCount>>('/leagues/search', {
    params: {
      q: query,
      page,
      page_size,
    },
  });
}

/**
 * Get league by ID
 */
export async function getLeagueById(leagueId: string): Promise<League> {
  return api.get<League>(`/leagues/${leagueId}`);
}

/**
 * Get league by code
 */
export async function getLeagueByCode(code: string): Promise<League> {
  return api.get<League>(`/leagues/code/${code}`);
}

/**
 * Create a new league
 */
export async function createLeague(data: CreateLeagueRequest): Promise<League> {
  return api.post<League>('/leagues', data);
}

/**
 * Get league members
 */
export async function getLeagueMembers(leagueId: string): Promise<LeagueMember[]> {
  return api.get<LeagueMember[]>(`/leagues/${leagueId}/members`);
}

/**
 * Get league teams
 */
export async function getLeagueTeams(leagueId: string): Promise<FantasyTeam[]> {
  return api.get<FantasyTeam[]>(`/leagues/${leagueId}/teams`);
}

/**
 * Join a league by its ID
 */
export async function joinLeague(leagueId: string, data: JoinLeagueRequest): Promise<FantasyTeam> {
  return api.post<FantasyTeam>(`/leagues/${leagueId}/join`, data);
}

/**
 * Update an existing league
 */
export async function updateLeague(leagueId: string, data: UpdateLeagueRequest): Promise<League> {
  return api.patch<League>(`/leagues/${leagueId}`, data);
}

/**
 * Leave a league
 */
export async function leaveLeague(leagueId: string): Promise<void> {
  return api.delete<void>(`/leagues/${leagueId}/leave`);
}

/**
 * Delete a league (creator only)
 */
export async function deleteLeague(leagueId: string): Promise<void> {
  return api.delete<void>(`/leagues/${leagueId}`);
}

/**
 * Get all leagues that the current user is a member of
 */
export async function getMyLeagues(sort: string = 'alphabetical'): Promise<MyLeague[]> {
  return api.get<MyLeague[]>('/leagues/my-leagues', {
    params: {
      sort,
    },
  });
}

/**
 * Get the current user's role in a league
 */
export async function getMyRole(leagueId: string): Promise<MyRoleResponse> {
  return api.get<MyRoleResponse>(`/leagues/${leagueId}/my-role`);
}
