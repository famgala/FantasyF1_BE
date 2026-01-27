import api from "./api";

/**
 * Scoring Service
 * Handles all scoring-related API operations
 */

export interface DriverScoring {
  driver_id: number;
  driver_name: string;
  driver_number: number;
  team: string;
  finishing_position: number;
  points_earned: number;
  is_dnf: boolean;
}

export interface RaceScore {
  race_id: number;
  race_name: string;
  round_number: number;
  race_date: string;
  drivers: DriverScoring[];
  total_points: number;
}

export interface ScoringData {
  constructor_id: number;
  constructor_name: string;
  user_id: number;
  username: string;
  season_total_points: number;
  race_scores: RaceScore[];
}

export interface LeagueComparisonScoring {
  constructor_id: number;
  constructor_name: string;
  username: string;
  season_total_points: number;
  race_scores: RaceScore[];
}

/**
 * Fetch scoring data for a constructor
 * @param constructorId - The ID of the constructor to fetch scoring for
 * @returns Promise containing the scoring data
 */
export const getConstructorScoring = async (constructorId: number): Promise<ScoringData> => {
  const response = await api.get<ScoringData>(`/constructors/${constructorId}/scoring`);
  return response.data;
};

/**
 * Fetch scoring comparison for a league
 * @param leagueId - The ID of the league to fetch scoring comparison for
 * @returns Promise containing the scoring comparison data for all constructors in the league
 */
export const getLeagueScoringComparison = async (leagueId: number): Promise<LeagueComparisonScoring[]> => {
  const response = await api.get<LeagueComparisonScoring[]>(`/leagues/${leagueId}/scoring`);
  return response.data;
};

/**
 * Fetch scoring rules and explanation
 * @returns Promise containing the scoring rules
 */
export const getScoringRules = async (): Promise<{
  scoring_system: string;
  position_points: { position: number; points: number }[];
  dnf_points: number;
  explanation: string;
}> => {
  const response = await api.get(`/scoring/rules`);
  return response.data;
};
