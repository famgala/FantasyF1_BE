import api from "./api";

export interface RaceResultDriver {
  id: number;
  name: string;
  number: number;
  team_name: string;
}

export interface RaceResult {
  position: number;
  driver: RaceResultDriver;
  grid_position: number;
  laps_completed: number;
  points_earned: number;
  fastest_lap: boolean;
  time_delta?: string;
  time?: string;
  dnf_status?: string;
  dnf_reason?: string;
}

export interface RaceResultsResponse {
  race_id: number;
  race_name: string;
  circuit_name: string;
  date: string;
  results: RaceResult[];
  total_laps: number;
}

/**
 * Get race results for a specific race
 * @param raceId - The ID of the race
 * @returns Promise with race results data
 */
export const getRaceResults = async (raceId: string): Promise<RaceResultsResponse> => {
  try {
    const response = await api.get<{ data: RaceResultsResponse }>(`/api/v1/races/${raceId}/results`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching race results:", error);
    throw error;
  }
};

export default {
  getRaceResults,
};
