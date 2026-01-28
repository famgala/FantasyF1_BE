"""Schemas for notification operations."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class NotificationType(str, Enum):
    """Types of notifications."""

    RACE_FINISHED = "race_finished"
    DRAFT_UPDATE = "draft_update"
    PICK_TURN = "pick_turn"
    LEAGUE_INVITE = "league_invite"
    TEAM_UPDATE = "team_update"
    POINTS_UPDATED = "points_updated"
    SYSTEM = "system"


class NotificationBase(BaseModel):
    """Base notification schema."""

    type: NotificationType = Field(..., description="Type of notification")
    title: str = Field(..., max_length=200, description="Notification title")
    message: str = Field(..., description="Notification message content")
    link: str | None = Field(None, max_length=500, description="Optional link for notification")
    metadata: str | None = Field(None, description="Additional metadata as JSON")


class NotificationCreate(NotificationBase):
    """Schema for creating a notification."""

    user_id: int = Field(..., description="User ID to send notification to")


class NotificationUpdate(BaseModel):
    """Schema for updating a notification."""

    is_read: bool = Field(..., description="Read status")
    read_at: datetime | None = Field(None, description="Read timestamp")


class NotificationResponse(NotificationBase):
    """Schema for notification response."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Notification ID")
    user_id: int = Field(..., description="User ID")
    is_read: bool = Field(..., description="Read status")
    created_at: datetime = Field(..., description="Creation timestamp")
    read_at: datetime | None = Field(None, description="Read timestamp")


class NotificationListResponse(BaseModel):
    """Schema for paginated notification list response."""

    notifications: list[NotificationResponse] = Field(..., description="List of notifications")
    total: int = Field(..., description="Total number of notifications")
    unread_count: int = Field(..., description="Number of unread notifications")


class MarkAsReadRequest(BaseModel):
    """Schema for marking notification as read."""

    is_read: bool = Field(default=True, description="Mark as read or unread")
