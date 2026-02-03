import { apiClient as api } from './api';
import type { Race, DraftOrder, DraftStatus, DraftPick, AvailableDriver, MakeDraftPickRequest, DraftPickResponse } from '../types';

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

/**
 * Get available drivers for draft
 */
export async function getAvailableDrivers(
  leagueId: string,
  raceId: number
): Promise<AvailableDriver[]> {
  return api.get<AvailableDriver[]>(`/drafts/${leagueId}/available-drivers`, {
    params: { race_id: raceId },
  });
}

/**
 * Make a draft pick
 */
export async function makeDraftPick(
  leagueId: string,
  raceId: number,
  request: MakeDraftPickRequest
): Promise<DraftPickResponse> {
  return api.post<DraftPickResponse>(`/drafts/${leagueId}/draft-picks`, request, {
    params: { race_id: raceId },
  });
}
