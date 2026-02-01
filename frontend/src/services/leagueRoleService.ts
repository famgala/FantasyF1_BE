import { apiClient as api } from './api';
import type { LeagueMember } from '../types';

/**
 * Get all league members with their roles
 */
export async function getLeagueRoles(leagueId: string): Promise<LeagueMember[]> {
  return api.get<LeagueMember[]>(`/league-roles/${leagueId}/roles`);
}

/**
 * Promote a member to co-manager (creator only)
 */
export async function promoteToCoManager(leagueId: string, userId: string): Promise<LeagueMember> {
  return api.put<LeagueMember>(`/league-roles/${leagueId}/promote/${userId}`);
}

/**
 * Demote a co-manager to member (creator only)
 */
export async function demoteToMember(leagueId: string, userId: string): Promise<LeagueMember> {
  return api.put<LeagueMember>(`/league-roles/${leagueId}/demote/${userId}`);
}