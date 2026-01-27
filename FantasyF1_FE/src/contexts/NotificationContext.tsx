import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { notificationService, type Notification } from "../services/notificationService";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  // Toast management
  activeToasts: Notification[];
  addToast: (notification: Notification) => void;
  removeToast: (toastId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  isAuthenticated: boolean;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  isAuthenticated,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

  // Fetch all notifications
  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await notificationService.getNotifications();
      setNotifications(response.notifications);
    } catch (err) {
      setError("Failed to load notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, [isAuthenticated]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError("Failed to mark notification as read");
      console.error("Error marking notification as read:", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      setError("Failed to mark all notifications as read");
      console.error("Error marking all notifications as read:", err);
    }
  }, []);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        setNotifications((prevCurrent) =>
          prevCurrent.filter((n) => n.id !== notificationId)
        );
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (err) {
      setError("Failed to delete notification");
      console.error("Error deleting notification:", err);
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      setError("Failed to clear notifications");
      console.error("Error clearing notifications:", err);
    }
  }, []);

  // Setup WebSocket connection for real-time updates
  useEffect(() => {
    if (!isAuthenticated) {
      if (websocket) {
        notificationService.unsubscribe(websocket);
        setWebsocket(null);
      }
      return;
    }

    const ws = notificationService.subscribeToNotifications(
      (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        
        // Optional: Play notification sound or show browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: "/favicon.ico",
          });
        }
      },
      (err) => {
        console.error("WebSocket error:", err);
        setError("Real-time notification updates unavailable");
      }
    );

    setWebsocket(ws || null);

    // Request notification permission if not granted
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Cleanup on unmount or when auth state changes
    return () => {
      if (ws) {
        notificationService.unsubscribe(ws);
      }
    };
  }, [isAuthenticated]);

  // Initial data fetch
  useEffect(() => {
    if (isAuthenticated) {
      refreshNotifications();
      refreshUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [isAuthenticated, refreshNotifications, refreshUnreadCount]);

  // Add a toast notification
  const addToast = useCallback((notification: Notification) => {
    setActiveToasts((prev) => [...prev, notification]);
  }, []);

  // Remove a toast notification
  const removeToast = useCallback((toastId: string) => {
    setActiveToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshNotifications,
    refreshUnreadCount,
    activeToasts,
    addToast,
    removeToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
