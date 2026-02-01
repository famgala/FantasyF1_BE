import { apiClient as api } from './api';
import type { Race, RaceListResponse, GetRacesRequest } from '../types';

/**
 * Get all races with optional filtering
 */
export async function getRaces(request: GetRacesRequest = {}): Promise<RaceListResponse> {
  const { skip = 0, limit = 100, status, country } = request;
  return api.get<RaceListResponse>('/races', {
    params: { skip, limit, status, country },
  });
}

/**
 * Get upcoming races sorted by date
 */
export async function getUpcomingRaces(limit: number = 20): Promise<Race[]> {
  return api.get<Race[]>('/races/upcoming', {
    params: { limit },
  });
}

/**
 * Get past/completed races sorted by date (most recent first)
 */
export async function getPastRaces(limit: number = 20): Promise<Race[]> {
  return api.get<Race[]>('/races/past', {
    params: { limit },
  });
}

/**
 * Get race by ID
 */
export async function getRaceById(raceId: number): Promise<Race> {
  return api.get<Race>(`/races/${raceId}`);
}
