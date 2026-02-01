import { apiClient } from './api';
import type {
  EmailInvitationRequest,
  UsernameInvitationRequest,
  UserIdInvitationRequest,
  CodeInvitationRequest,
  SentInvitation,
  AcceptInvitationRequest,
  RejectInvitationRequest,
} from '../types';

const BASE_URL = '/invitations';

export interface InvitationListResponse {
  items: SentInvitation[];
  total: number;
  skip: number;
  limit: number;
}

export const invitationService = {
  /**
   * Send an invitation by email
   */
  sendEmailInvitation: async (
    leagueId: string,
    data: EmailInvitationRequest
  ): Promise<SentInvitation> => {
    return await apiClient.post<SentInvitation>(`${BASE_URL}/leagues/${leagueId}/invites/email`, data);
  },

  /**
   * Send an invitation by username
   */
  sendUsernameInvitation: async (
    leagueId: string,
    data: UsernameInvitationRequest
  ): Promise<SentInvitation> => {
    return await apiClient.post<SentInvitation>(`${BASE_URL}/leagues/${leagueId}/invites/username`, data);
  },

  /**
   * Send an invitation by user ID
   */
  sendUserIdInvitation: async (
    leagueId: string,
    data: UserIdInvitationRequest
  ): Promise<SentInvitation> => {
    return await apiClient.post<SentInvitation>(`${BASE_URL}/leagues/${leagueId}/invites/user-id`, data);
  },

  /**
   * Create an invite code for the league
   */
  sendCodeInvitation: async (
    leagueId: string,
    data: CodeInvitationRequest
  ): Promise<SentInvitation> => {
    return await apiClient.post<SentInvitation>(`${BASE_URL}/leagues/${leagueId}/invites/code`, data);
  },

  /**
   * Get all invitations for a league
   */
  getLeagueInvitations: async (
    leagueId: string,
    status?: string
  ): Promise<InvitationListResponse> => {
    const params: Record<string, string> = {};
    if (status) {
      params.status = status;
    }
    return await apiClient.get<InvitationListResponse>(`${BASE_URL}/leagues/${leagueId}/invitations`, params);
  },

  /**
   * Cancel an invitation
   */
  cancelInvitation: async (invitationId: string): Promise<void> => {
    await apiClient.delete<void>(`${BASE_URL}/invitations/${invitationId}`);
  },

  /**
   * Get received invitations for the current user
   */
  getReceivedInvitations: async (): Promise<InvitationListResponse> => {
    return await apiClient.get<InvitationListResponse>(`${BASE_URL}/received`);
  },

  /**
   * Accept an invitation
   */
  acceptInvitation: async (
    invitationId: string,
    data: AcceptInvitationRequest
  ): Promise<void> => {
    await apiClient.post<void>(`${BASE_URL}/${invitationId}/accept`, data);
  },

  /**
   * Reject an invitation
   */
  rejectInvitation: async (
    invitationId: string,
    data?: RejectInvitationRequest
  ): Promise<void> => {
    await apiClient.post<void>(`${BASE_URL}/${invitationId}/reject`, data || {});
  },
};

export default invitationService;
