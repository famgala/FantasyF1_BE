import { apiClient } from './api';
import type { ActivityLog, ActivityLogListResponse, ActivityType } from '../types';

export interface GetActivitiesParams {
  skip?: number;
  limit?: number;
  activity_type?: ActivityType;
}

class ActivityLogService {
  /**
   * Get activity feed for a league
   * @param leagueId - The league ID
   * @param params - Optional pagination and filter parameters
   * @returns List of activities with pagination info
   */
  async getLeagueActivities(
    leagueId: string,
    params?: GetActivitiesParams
  ): Promise<ActivityLogListResponse> {
    return apiClient.get<ActivityLogListResponse>(
      `/leagues/${leagueId}/activities`,
      {
        skip: params?.skip ?? 0,
        limit: params?.limit ?? 50,
        activity_type: params?.activity_type,
      }
    );
  }

  /**
   * Get a specific activity detail
   * @param leagueId - The league ID
   * @param activityId - The activity ID
   * @returns Activity details
   */
  async getActivityDetail(leagueId: string, activityId: string): Promise<ActivityLog> {
    return apiClient.get<ActivityLog>(`/leagues/${leagueId}/activities/${activityId}`);
  }
}

export const activityLogService = new ActivityLogService();
