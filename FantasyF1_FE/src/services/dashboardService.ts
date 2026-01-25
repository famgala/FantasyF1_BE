import api from './api';

export interface League {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_private: boolean;
  max_teams: number;
  draft_method: string;
  scoring_system: string;
}

export interface Constructor {
  id: number;
  team_name: string;
  league_id: number;
  user_id: number;
  total_points: number;
  rank: number;
}

export interface UserLeagueData {
  league: League;
  constructor: Constructor;
}

export interface Race {
  id: number;
  name: string;
  circuit_name: string;
  country: string;
  city: string;
  round_number: number;
  race_date_time: string;
  qualifying_date_time: string;
  laps: number;
  status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Activity {
  id: number;
  type: string;
  message: string;
  timestamp: string;
  league_id?: number;
}

export interface DashboardData {
  user: {
    username: string;
    email: string;
    full_name?: string;
    total_points: number;
    leagues_count: number;
    races_completed: number;
  };
  leagues: UserLeagueData[];
  upcoming_race: Race | null;
  recent_activities: Activity[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const response = await api.get<DashboardData>('/api/v1/users/me/dashboard');
  return response.data;
}

export async function getUserTeams(): Promise<UserLeagueData[]> {
  const response = await api.get<UserLeagueData[]>('/api/v1/teams');
  return response.data;
}

export async function getUpcomingRaces(count: number = 3): Promise<Race[]> {
  const response = await api.get<Race[]>('/api/v1/races', {
    params: { 
      status: 'upcoming',
      limit: count 
    }
  });
  return response.data;
}

export async function getRecentActivities(count: number = 10): Promise<Activity[]> {
  const response = await api.get<Activity[]>('/api/v1/users/me/activities', {
    params: { limit: count }
  });
  return response.data;
}
