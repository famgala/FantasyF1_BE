import React from "react";
import { useNotifications } from "../../../contexts/NotificationContext";
import { NotificationToast } from "../NotificationToast";
import "./NotificationContainer.scss";

export const NotificationContainer: React.FC = () => {
  const { activeToasts, removeToast } = useNotifications();

  const handleNotificationClick = (notificationId: string) => {
    // Handle notification click (e.g., navigation or action)
    removeToast(notificationId);
  };

  return (
    <div className="notification-container" role="region" aria-label="Notification toasts">
      {activeToasts.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeToast(notification.id)}
          onClick={() => handleNotificationClick(notification.id)}
        />
      ))}
    </div>
  );
};
