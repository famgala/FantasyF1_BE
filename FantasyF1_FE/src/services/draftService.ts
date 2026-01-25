import api from "./api";

/**
 * Driver information for draft selection
 */
export interface Driver {
  id: number;
  name: string;
  number: number;
  team: string;
  team_code: string;
  country: string;
  price: number;
  total_points: number;
  average_points: number;
  recent_results: {
    race_id: number;
    race_name: string;
    position: number;
    points: number;
  }[];
}

/**
 * Constructor pick information
 */
export interface ConstructorPick {
  constructor_id: number;
  constructor_name: string;
  user_id: number;
  username: string;
  pick_number: 1 | 2;
  driver: Driver;
  timestamp: string;
}

/**
 * Draft order constructor
 */
export interface DraftOrderConstructor {
  constructor_id: number;
  constructor_name: string;
  user_id: number;
  username: string;
  picks: ConstructorPick[];
  is_current_picker: boolean;
}

/**
 * Draft participant with selected driver
 */
export interface DraftParticipant {
  user_id: number;
  username: string;
  team_name: string;
  selected_driver: {
    number: number;
    name: string;
    team: string;
  } | null;
}

/**
 * Draft status information
 */
export interface DraftStatus {
  status: "UPCOMING" | "OPEN" | "CLOSED" | "COMPLETE";
  opens_at: string | null;
  closes_at: string | null;
  current_picker: DraftOrderConstructor | null;
  is_my_turn: boolean;
  my_picks: ConstructorPick[];
}

/**
 * Draft room data
 */
export interface DraftRoomData {
  race_id: number;
  race_name: string;
  circuit: string;
  race_date: string;
  league_id: number;
  league_name: string;
  draft_order: DraftOrderConstructor[];
  available_drivers: Driver[];
  drafted_drivers: ConstructorPick[];
  status: DraftStatus;
}

/**
 * Fetch draft room data
 */
export const getDraftRoom = async (
  leagueId: number,
  raceId: number
): Promise<DraftRoomData> => {
  const response = await api.get(
    `/leagues/${leagueId}/races/${raceId}/draft`
  );
  return response.data;
};

/**
 * Make a driver pick
 */
export const makePick = async (
  leagueId: number,
  raceId: number,
  driverId: number
): Promise<ConstructorPick> => {
  const response = await api.post(
    `/leagues/${leagueId}/races/${raceId}/picks`,
    { driver_id: driverId }
  );
  return response.data;
};

/**
 * Get draft status
 */
export const getDraftStatus = async (
  leagueId: number,
  raceId: number
): Promise<DraftStatus> => {
  const response = await api.get(
    `/leagues/${leagueId}/races/${raceId}/draft/status`
  );
  return response.data;
};

/**
 * Get draft history (completed drafts)
 */
export const getDraftHistory = async (
  leagueId: number,
  raceId: number
): Promise<ConstructorPick[]> => {
  const response = await api.get(
    `/leagues/${leagueId}/races/${raceId}/draft/history`
  );
  return response.data;
};
