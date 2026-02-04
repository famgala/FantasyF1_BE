import { apiClient } from './api';
import type { Constructor, ConstructorWithDrivers, PaginatedResponse } from '../types';

export interface GetConstructorsRequest {
  page?: number;
  page_size?: number;
  sort_by?: 'name' | 'points' | 'wins' | 'championships';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedConstructorsResponse extends PaginatedResponse<Constructor> {}

/**
 * Fetch paginated list of constructors with optional sorting
 */
export async function getConstructors(params?: GetConstructorsRequest): Promise<PaginatedConstructorsResponse> {
  return apiClient.get<PaginatedConstructorsResponse>('/constructors', params);
}

/**
 * Get a single constructor by ID
 */
export async function getConstructor(constructorId: string): Promise<ConstructorWithDrivers> {
  return apiClient.get<ConstructorWithDrivers>(`/constructors/${constructorId}`);
}

/**
 * Get constructor standings
 */
export async function getConstructorStandings(): Promise<Constructor[]> {
  return apiClient.get<Constructor[]>('/constructors/standings');
}
