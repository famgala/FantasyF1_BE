import { apiClient as api } from './api';
import type { Race, DraftOrder } from '../types';

/**
 * Get upcoming races for draft order creation
 */
export async function getUpcomingRaces(limit: number = 20): Promise<Race[]> {
  return api.get<Race[]>('/races/upcoming', {
    params: { limit },
  });
}

/**
 * Create draft order for a league and race
 */
export async function createDraftOrder(
  leagueId: string,
  raceId: number,
  draftMethod: string
): Promise<DraftOrder> {
  return api.post<DraftOrder>(`/drafts/${leagueId}/draft-order/create`, null, {
    params: {
      race_id: raceId,
      draft_method: draftMethod,
    },
  });
}

/**
 * Get draft order for a league
 */
export async function getDraftOrder(leagueId: string): Promise<DraftOrder> {
  return api.get<DraftOrder>(`/drafts/${leagueId}/draft-order`);
}
