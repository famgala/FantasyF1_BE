import { apiClient as api } from './api';
import type { Race, DraftOrder, DraftStatus, DraftPick } from '../types';

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

/**
 * Get draft status for a league and race
 */
export async function getDraftStatus(
  leagueId: string,
  raceId: number
): Promise<DraftStatus> {
  return api.get<DraftStatus>(`/drafts/${leagueId}/draft-status`, {
    params: { race_id: raceId },
  });
}

/**
 * Get draft picks for a league and race
 */
export async function getDraftPicks(
  leagueId: string,
  raceId: number,
  teamId?: string
): Promise<{ draft_picks: DraftPick[] }> {
  return api.get<{ draft_picks: DraftPick[] }>(`/drafts/${leagueId}/draft-picks`, {
    params: { race_id: raceId, ...(teamId && { team_id: teamId }) },
  });
}
