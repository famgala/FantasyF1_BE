import api from "./api";

export interface League {
  id: string;
  name: string;
  code: string;
  description: string;
  is_private: boolean;
  max_teams: number;
  current_teams: number;
  draft_method: string;
  scoring_system: string;
  creator_id: string;
  manager_id?: string;
  manager_username?: string;
  created_at: string;
  updated_at: string;
  invite_link?: string;
  team_count?: number;
}

export interface CreateLeagueRequest {
  name: string;
  description?: string;
  is_private: boolean;
  max_teams: number;
  draft_method: string;
  scoring_system: string;
}

export interface CreateLeagueResponse {
  id: string;
  code: string;
  invite_link: string;
  created_at: string;
}

export interface SearchLeaguesParams {
  search?: string;
  is_private?: boolean;
  min_teams?: number;
  max_teams?: number;
  draft_method?: string;
  scoring_system?: string;
  limit?: number;
  offset?: number;
}

export interface JoinLeagueRequest {
  league_id: string;
  team_name: string;
}

export interface JoinLeagueResponse {
  constructor_id: string;
  team_name: string;
  league_id: string;
}

export const createLeague = async (
  data: CreateLeagueRequest,
): Promise<CreateLeagueResponse> => {
  const response = await api.post<CreateLeagueResponse>("/leagues", data);
  return response.data;
};

export const searchLeagues = async (
  params: SearchLeaguesParams,
): Promise<League[]> => {
  const response = await api.get<League[]>("/leagues", { params });
  return response.data;
};

export const getLeagueById = async (id: string): Promise<League> => {
  const response = await api.get<League>(`/leagues/${id}`);
  return response.data;
};

export interface LeagueTeam {
  id: string;
  name: string;
  user_id: string;
  username?: string;
  total_points: number;
  is_manager: boolean;
}

export const getLeagueTeams = async (leagueId: string): Promise<LeagueTeam[]> => {
  const response = await api.get<LeagueTeam[]>(`/leagues/${leagueId}/teams`);
  return response.data;
};

export interface DraftStatus {
  league_id: string;
  race_id: number;
  draft_method: string;
  is_draft_complete: boolean;
  total_teams: number;
  total_picks_made: number;
  current_round: number;
  current_position: number;
  current_team: {
    id: string;
    name: string;
    user_id: string;
  } | null;
  next_pick: {
    fantasy_team_id: string;
    pick_round: number;
    draft_position: number;
  } | null;
}

export const getDraftStatus = async (
  leagueId: string,
  raceId: number,
): Promise<DraftStatus> => {
  const response = await api.get<DraftStatus>(`/drafts/${leagueId}/draft-status`, {
    params: { race_id: raceId },
  });
  return response.data;
};

export const joinLeague = async (
  data: JoinLeagueRequest,
): Promise<JoinLeagueResponse> => {
  const response = await api.post<JoinLeagueResponse>("/leagues/join", data);
  return response.data;
};

export const inviteCodeCheck = async (code: string): Promise<League | null> => {
  try {
    const response = await api.get<League>("/leagues", { params: { code } });
    return response.data[0] || null;
  } catch (error) {
    return null;
  }
};

export interface Race {
  id: number;
  name: string;
  circuit: string;
  country: string;
  race_date: string;
  qualifying_date: string;
  status: string;
}

export const getUpcomingRace = async (): Promise<Race | null> => {
  try {
    const response = await api.get<Race[]>("/races", { params: { status: "upcoming" } });
    // Return the first upcoming race
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    return null;
  }
};

export const getCurrentRace = async (): Promise<Race | null> => {
  try {
    const response = await api.get<Race[]>("/races", { params: { status: "current" } });
    return response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    return null;
  }
};

export interface ConstructorLeaderboardEntry {
  id: string;
  team_name: string;
  username: string;
  is_manager: boolean;
  total_points: number;
  rank: number;
  rank_change: "up" | "down" | "same" | number;
}

export interface LeaderboardRaceEntry {
  id: number;
  name: string;
  round_number: number;
  is_completed: boolean;
}

export interface LeaderboardResponse {
  league_id: string;
  league_name: string;
  league_code: string;
  is_manager: boolean;
  constructors: ConstructorLeaderboardEntry[];
  races: LeaderboardRaceEntry[];
  overall_totals: ConstructorLeaderboardEntry[];
  current_race_id: number | null;
}

export const getLeaderboard = async (
  leagueId: string,
  raceId?: number,
): Promise<LeaderboardResponse> => {
  const params = raceId ? { race_id: raceId } : {};
  const response = await api.get<LeaderboardResponse>(`/leagues/${leagueId}/leaderboard`, { params });
  return response.data;
};

export interface LeagueSettings {
  id: string;
  name: string;
  code: string;
  description: string;
  max_teams: number;
  current_teams: number;
  is_private: boolean;
  created_at: string;
}

export interface LeagueMember {
  id: string;
  username: string;
  email: string;
  role: "manager" | "co_manager" | "member";
  team_name: string;
  joined_at: string;
}

export interface UpdateLeagueSettingsRequest {
  description?: string;
  max_teams?: number;
  is_private?: boolean;
}

export const getLeagueSettings = async (leagueId: string): Promise<LeagueSettings> => {
  const response = await api.get<LeagueSettings>(`/leagues/${leagueId}/settings`);
  return response.data;
};

export const updateLeagueSettings = async (
  leagueId: string,
  data: UpdateLeagueSettingsRequest,
): Promise<LeagueSettings> => {
  const response = await api.patch<LeagueSettings>(`/leagues/${leagueId}`, data);
  return response.data;
};

export const getLeagueMembers = async (leagueId: string): Promise<LeagueMember[]> => {
  const response = await api.get<LeagueMember[]>(`/leagues/${leagueId}/members`);
  return response.data;
};

export const removeLeagueMember = async (leagueId: string, memberId: string): Promise<void> => {
  await api.delete(`/leagues/${leagueId}/members/${memberId}`);
};

export const updateMemberRole = async (
  leagueId: string,
  memberId: string,
  role: "manager" | "co_manager" | "member",
): Promise<void> => {
  await api.patch(`/leagues/${leagueId}/members/${memberId}/role`, { role });
};

export const deleteLeague = async (leagueId: string): Promise<void> => {
  await api.delete(`/leagues/${leagueId}`);
};

// League Invitation System
export interface LeagueInvite {
  id: string;
  league_id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInviteRequest {
  email: string;
}

export interface CreateInviteResponse {
  invite_id: string;
  email: string;
  token: string;
  expires_at: string;
}

export interface BulkInviteRequest {
  emails: string[];
}

export const createInvite = async (
  leagueId: string,
  data: CreateInviteRequest,
): Promise<CreateInviteResponse> => {
  const response = await api.post<CreateInviteResponse>(
    `/leagues/${leagueId}/invites`,
    data,
  );
  return response.data;
};

export const createBulkInvites = async (
  leagueId: string,
  data: BulkInviteRequest,
): Promise<CreateInviteResponse[]> => {
  const response = await api.post<CreateInviteResponse[]>(
    `/leagues/${leagueId}/invites/bulk`,
    data,
  );
  return response.data;
};

export const getLeagueInvites = async (leagueId: string): Promise<LeagueInvite[]> => {
  const response = await api.get<LeagueInvite[]>(`/leagues/${leagueId}/invites`);
  return response.data;
};

export const getPendingInvites = async (leagueId: string): Promise<LeagueInvite[]> => {
  const response = await api.get<LeagueInvite[]>(`/leagues/${leagueId}/invites`, {
    params: { status: "pending" },
  });
  return response.data;
};

export const revokeInvite = async (leagueId: string, inviteId: string): Promise<void> => {
  await api.delete(`/leagues/${leagueId}/invites/${inviteId}`);
};

export interface AcceptInviteRequest {
  team_name: string;
}

export const acceptInvite = async (
  token: string,
  data: AcceptInviteRequest,
): Promise<JoinLeagueResponse> => {
  const response = await api.post<JoinLeagueResponse>(
    `/leagues/invites/${token}/accept`,
    data,
  );
  return response.data;
};

export const declineInvite = async (token: string): Promise<void> => {
  await api.post(`/leagues/invites/${token}/decline`);
};

export const checkInviteToken = async (token: string): Promise<LeagueInvite | null> => {
  try {
    const response = await api.get<LeagueInvite>(`/leagues/invites/${token}`);
    return response.data;
  } catch (error) {
    return null;
  }
};
