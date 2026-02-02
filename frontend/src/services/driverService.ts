import { apiClient } from './api';
import type { Driver, PaginatedResponse, DriverPerformance } from '../types';

export interface GetDriversRequest {
  page?: number;
  page_size?: number;
  team?: string;
  sort_by?: 'name' | 'points' | 'price' | 'number';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedDriversResponse extends PaginatedResponse<Driver> {}

/**
 * Fetch paginated list of drivers with optional filtering and sorting
 */
export async function getDrivers(params?: GetDriversRequest): Promise<PaginatedDriversResponse> {
  return apiClient.get<PaginatedDriversResponse>('/drivers', params);
}

/**
 * Search drivers by name, number, or code
 */
export async function searchDrivers(query: string): Promise<Driver[]> {
  return apiClient.get<Driver[]>('/drivers/search', { q: query });
}

/**
 * Get a single driver by ID
 */
export async function getDriver(driverId: string): Promise<Driver> {
  return apiClient.get<Driver>(`/drivers/${driverId}`);
}

/**
 * Get performance data for a driver across all races
 */
export async function getDriverPerformance(driverId: string): Promise<DriverPerformance> {
  return apiClient.get<DriverPerformance>(`/drivers/${driverId}/performance`);
}
