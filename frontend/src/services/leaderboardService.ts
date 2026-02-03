import { apiClient as api } from "./api";

export interface LeaderboardEntry {
  rank: number;
  team_id: number;
  team_name: string;
  user_id: number;
  username: string;
  total_points: number;
  wins: number;
  podiums: number;
  is_tied: boolean;
}

export interface LeaderboardResponse {
  league_id: number;
  league_name: string;
  race_id: number | null;
  race_name: string | null;
  entries: LeaderboardEntry[];
  total_entries: number;
}

export async function getLeaderboard(
  leagueId: string,
  raceId?: number,
  useCache: boolean = true
): Promise<LeaderboardResponse> {
  const params: Record<string, string | boolean> = { use_cache: useCache };
  if (raceId !== undefined) {
    params.race_id = raceId.toString();
  }

  return await api.get<LeaderboardResponse>(`/leagues/${leagueId}/leaderboard`, {
    params,
  });
}
