/**
 * Create Notification Form Component
 * 
 * Form for creating and broadcasting system notifications.
 * Supports different recipient types: all users, specific league, or specific users.
 * Allows scheduling notifications for future delivery.
 */

import { useState } from "react";
import { sendBroadcastNotification } from "../../../services/adminService";
import "./CreateNotificationForm.scss";

interface CreateNotificationFormProps {
  onNotificationCreated: () => void;
}

export const CreateNotificationForm = ({ onNotificationCreated }: CreateNotificationFormProps) => {
  const [formData, setFormData] = useState({
    type: "system" as "system" | "announcement" | "alert",
    title: "",
    message: "",
    link: "",
    recipientType: "all" as "all" | "league" | "users",
    leagueId: "",
    userIds: "",
    scheduledAt: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.message.trim()) {
        throw new Error("Message is required");
      }
      if (formData.recipientType === "league" && !formData.leagueId) {
        throw new Error("League ID is required when sending to a specific league");
      }
      if (formData.recipientType === "users" && !formData.userIds) {
        throw new Error("User IDs are required when sending to specific users");
      }

      // Prepare recipients
      let recipients: "all" | number | number[] = "all";
      if (formData.recipientType === "league") {
        recipients = parseInt(formData.leagueId, 10);
      } else if (formData.recipientType === "users") {
        recipients = formData.userIds
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id));
      }

      // Build notification request
      const notificationRequest = {
        type: formData.type,
        title: formData.title.trim(),
        message: formData.message.trim(),
        link: formData.link.trim() || undefined,
        recipients,
        scheduledAt: formData.scheduledAt || undefined,
      };

      // Send notification
      await sendBroadcastNotification(notificationRequest);

      setSubmitSuccess(true);
      setTimeout(() => {
        onNotificationCreated();
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to send notification");
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getPreviewData = () => ({
    type: formData.type,
    title: formData.title || "Notification Title",
    message: formData.message || "Your notification message will appear here.",
    link: formData.link,
  });

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case "system":
        return "#3b82f6"; // blue
      case "announcement":
        return "#10b981"; // green
      case "alert":
        return "#ef4444"; // red
      default:
        return "#3b82f6";
    }
  };

  return (
    <div className="create-notification-form">
      <div className="form-layout">
        <div className="form-main">
          <h2>Create New Notification</h2>
          <form onSubmit={handleSubmit}>
            {/* Notification Type */}
            <div className="form-group">
              <label htmlFor="type">Notification Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-control"
                aria-label="Select notification type"
              >
                <option value="system">System Update</option>
                <option value="announcement">Announcement</option>
                <option value="alert">Alert</option>
              </select>
              <span className="form-hint">
                System: Blue icon | Announcement: Green icon | Alert: Red icon
              </span>
            </div>

            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter notification title"
                maxLength={100}
                aria-label="Notification title"
                required
              />
              <span className="form-hint">
                {formData.title.length}/100 characters
              </span>
            </div>

            {/* Message */}
            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter notification message"
                rows={5}
                maxLength={500}
                aria-label="Notification message"
                required
              />
              <span className="form-hint">
                {formData.message.length}/500 characters
              </span>
            </div>

            {/* Link (Optional) */}
            <div className="form-group">
              <label htmlFor="link">Link (Optional)</label>
              <input
                type="url"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                className="form-control"
                placeholder="https://example.com"
                aria-label="Optional link URL"
              />
              <span className="form-hint">
                Provide a link if users should be redirected to a specific page
              </span>
            </div>

            {/* Recipient Type */}
            <div className="form-group">
              <label htmlFor="recipientType">Recipients *</label>
              <select
                id="recipientType"
                name="recipientType"
                value={formData.recipientType}
                onChange={handleInputChange}
                className="form-control"
                aria-label="Select recipients"
              >
                <option value="all">All Users</option>
                <option value="league">Specific League</option>
                <option value="users">Specific Users</option>
              </select>
            </div>

            {/* League ID (conditional) */}
            {formData.recipientType === "league" && (
              <div className="form-group">
                <label htmlFor="leagueId">League ID *</label>
                <input
                  type="number"
                  id="leagueId"
                  name="leagueId"
                  value={formData.leagueId}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Enter league ID"
                  aria-label="League ID"
                  required
                />
              </div>
            )}

            {/* User IDs (conditional) */}
            {formData.recipientType === "users" && (
              <div className="form-group">
                <label htmlFor="userIds">User IDs *</label>
                <textarea
                  id="userIds"
                  name="userIds"
                  value={formData.userIds}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Enter user IDs separated by commas (e.g., 1, 2, 3)"
                  rows={3}
                  aria-label="User IDs"
                  required
                />
                <span className="form-hint">
                  Separate multiple user IDs with commas
                </span>
              </div>
            )}

            {/* Schedule Date (Optional) */}
            <div className="form-group">
              <label htmlFor="scheduledAt">Schedule for Later (Optional)</label>
              <input
                type="datetime-local"
                id="scheduledAt"
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleInputChange}
                className="form-control"
                aria-label="Schedule date and time"
              />
              <span className="form-hint">
                    Leave empty to send immediately
                  </span>
            </div>

            {/* Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowPreview(!showPreview)}
                aria-label="Toggle preview"
              >
                {showPreview ? "Hide Preview" : "Preview Notification"}
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || submitSuccess}
                aria-label={isSubmitting ? "Sending notification..." : "Send notification"}
              >
                {isSubmitting ? "Sending..." : submitSuccess ? "Sent!" : "Send Notification"}
              </button>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="error-message" role="alert">
                {submitError}
              </div>
            )}

            {/* Success Message */}
            {submitSuccess && (
              <div className="success-message" role="status">
                Notification sent successfully!
              </div>
            )}
          </form>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="form-preview">
            <h3>Preview</h3>
            <div
              className="preview-card"
              style={{
                borderColor: getNotificationTypeColor(formData.type),
              }}
            >
              <div className="preview-header">
                <div
                  className="preview-type-indicator"
                  style={{
                    backgroundColor: getNotificationTypeColor(formData.type),
                  }}
                />
                <span className="preview-type">
                  {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
                </span>
              </div>
              <div className="preview-title">
                {formData.title || "Notification Title"}
              </div>
              <div className="preview-message">
                {formData.message || "Your notification message will appear here."}
              </div>
              {formData.link && (
                <div className="preview-link">
                  <span className="link-icon">🔗</span>
                  <a href={formData.link} target="_blank" rel="noopener noreferrer">
                    {formData.link}
                  </a>
                </div>
              )}
              <div className="preview-footer">
                <div className="preview-recipients">
                  <strong>To:</strong> {formData.recipientType === "all" ? "All Users" : "Selected"}
                </div>
                <div className="preview-timestamp">
                  {formData.scheduledAt
                    ? `Scheduled: ${new Date(formData.scheduledAt).toLocaleString()}`
                    : "Sending immediately"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
