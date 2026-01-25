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
  manager_id: string;
  manager_username: string;
  created_at: string;
  invite_link: string;
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
