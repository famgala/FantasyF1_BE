import { apiClient as api } from './api';
import type { League, PaginatedResponse, CreateLeagueRequest } from '../types';

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
