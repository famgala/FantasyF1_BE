import api from "./api";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  leagueId?: string;
  raceId?: string;
  draftId?: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unread: number;
}

export const notificationService = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(): Promise<NotificationResponse> {
    const response = await api.get("/notifications");
    return response.data;
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<number> {
    const response = await api.get("/notifications/unread-count");
    return response.data.count;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await api.patch("/notifications/mark-all-read");
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await api.delete(`/notifications/${notificationId}`);
  },

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    await api.delete("/notifications/clear-all");
  },

  /**
   * Subscribe to real-time notifications using WebSocket
   * This would typically return a WebSocket connection
   */
  subscribeToNotifications(
    onNotification: (notification: Notification) => void,
    onError?: (error: Error) => void
  ): WebSocket | null {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return null;
      }

      const wsUrl = `${(window as any).REACT_APP_WS_URL || (window as any).env?.REACT_APP_WS_URL || "ws://localhost:8000"}/notifications?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connection established for notifications");
      };

      ws.onmessage = (event) => {
        try {
          const notification = JSON.parse(event.data);
          onNotification(notification);
        } catch (error) {
          console.error("Error parsing notification:", error);
          if (onError) {
            onError(error as Error);
          }
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (onError) {
          onError(new Error("WebSocket connection error"));
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed for notifications");
      };

      return ws;
    } catch (error) {
      console.error("Error creating WebSocket connection:", error);
      if (onError) {
        onError(error as Error);
      }
      return null;
    }
  },

  /**
   * Unsubscribe from notifications
   */
  unsubscribe(webSocket: WebSocket | null): void {
    if (webSocket) {
      webSocket.close();
    }
  },
};
