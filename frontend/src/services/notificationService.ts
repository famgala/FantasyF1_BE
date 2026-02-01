import { apiClient } from './api';
import type { Notification, NotificationFilters } from '../types';

class NotificationService {
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    return apiClient.get<Notification[]>('/notifications', {
      skip: filters?.skip,
      limit: filters?.limit,
      unread_only: filters?.unread_only,
      notification_type: filters?.notification_type,
    });
  }

  async getNotificationSummary(): Promise<{ unread_count: number }> {
    return apiClient.get<{ unread_count: number }>('/notifications/summary');
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
  }

  async markAsUnread(notificationId: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${notificationId}/unread`);
  }

  async markAllAsRead(): Promise<{ count: number }> {
    return apiClient.post<{ count: number }>('/notifications/read-all');
  }

  async deleteNotification(notificationId: string): Promise<void> {
    return apiClient.delete<void>(`/notifications/${notificationId}`);
  }
}

export const notificationService = new NotificationService();
