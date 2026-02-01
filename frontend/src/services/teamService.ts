import { apiClient as api } from './api';
import type { MyTeam } from '../types';

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