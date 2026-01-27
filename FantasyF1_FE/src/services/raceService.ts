import api from "./api";
import { raceCache, getCachedData, createCacheKey } from "../utils/cache";

export interface Race {
  id: number;
  race_name: string;
  circuit_name: string;
  locality: string;
  country: string;
  round_number: number;
  race_date: string;
  qualifying_date?: string | null;
  laps: number;
  status: "upcoming" | "in_progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface RaceResult {
  id: number;
  race_id: number;
  driver_id: number;
  driver_name: string;
  driver_number: number;
  team_name: string;
  position: number;
  grid_position: number;
  laps_completed: number;
  points: number;
  time_delta?: string | null;
  fastest_lap: boolean;
  status: string;
  dnf_reason?: string | null;
}

class RaceService {
  /**
   * Get all races for a specific year
   */
  async getRacesByYear(year: number): Promise<Race[]> {
    try {
      const key = createCacheKey("/races", { year, sort: "race_date", order: "asc" });
      return getCachedData(
        raceCache,
        key,
        async () => {
          const response = await api.get<Race[]>(`/races`, {
            params: {
              year,
              sort: "race_date",
              order: "asc"
            }
          });
          return response.data;
        },
        600000 // 10 minutes TTL for race calendar
      );
    } catch (error) {
      console.error("Error fetching races:", error);
      throw error;
    }
  }

  /**
   * Get race by ID
   */
  async getRaceById(raceId: number): Promise<Race> {
    try {
      const key = createCacheKey(`/races/${raceId}`);
      return getCachedData(
        raceCache,
        key,
        async () => {
          const response = await api.get<Race>(`/races/${raceId}`);
          return response.data;
        },
        300000 // 5 minutes TTL for race details
      );
    } catch (error) {
      console.error("Error fetching race:", error);
      throw error;
    }
  }

  /**
   * Get race results by race ID
   */
  async getRaceResults(raceId: number): Promise<RaceResult[]> {
    try {
      const key = createCacheKey(`/races/${raceId}/results`);
      return getCachedData(
        raceCache,
        key,
        async () => {
          const response = await api.get<RaceResult[]>(`/races/${raceId}/results`);
          return response.data;
        },
        3600000 // 1 hour TTL for completed race results
      );
    } catch (error) {
      console.error("Error fetching race results:", error);
      throw error;
    }
  }

  /**
   * Get upcoming races
   */
  async getUpcomingRaces(limit: number = 5): Promise<Race[]> {
    try {
      const key = createCacheKey("/races", { status: "upcoming", sort: "race_date", order: "asc", limit });
      return getCachedData(
        raceCache,
        key,
        async () => {
          const response = await api.get<Race[]>(`/races`, {
            params: {
              status: "upcoming",
              sort: "race_date",
              order: "asc",
              limit
            }
          });
          return response.data;
        },
        180000 // 3 minutes TTL for upcoming races (changes frequently)
      );
    } catch (error) {
      console.error("Error fetching upcoming races:", error);
      throw error;
    }
  }

  /**
   * Get completed races
   */
  async getCompletedRaces(year: number, limit: number = 10): Promise<Race[]> {
    try {
      const key = createCacheKey("/races", { year, status: "completed", sort: "race_date", order: "desc", limit });
      return getCachedData(
        raceCache,
        key,
        async () => {
          const response = await api.get<Race[]>(`/races`, {
            params: {
              year,
              status: "completed",
              sort: "race_date",
              order: "desc",
              limit
            }
          });
          return response.data;
        },
        3600000 // 1 hour TTL for completed races
      );
    } catch (error) {
      console.error("Error fetching completed races:", error);
      throw error;
    }
  }
}

export const raceService = new RaceService();
export default raceService;
