"""Schema definitions for ActivityLog model."""

from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

from app.models.activity_log import ActivityType
from app.schemas.user import UserResponse


class ActivityLogBase(BaseModel):
    """Base schema for ActivityLog with shared fields."""

    league_id: int = Field(..., description="ID of the league")
    activity_type: Annotated[
        ActivityType,
        Field(..., description="Type of activity"),
    ]
    title: str = Field(..., max_length=200, description="Short title of activity")
    message: str = Field(..., description="Detailed description")
    reference_id: int | None = Field(None, description="Optional reference ID")
    reference_type: str | None = Field(None, max_length=50, description="Type of reference")


class ActivityLogCreate(ActivityLogBase):
    """Schema for creating a new ActivityLog."""

    user_id: int | None = Field(None, description="ID of user who performed the action")


class ActivityLogResponse(ActivityLogBase):
    """Schema for ActivityLog response."""

    id: int
    user_id: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActivityLogDetailResponse(ActivityLogResponse):
    """Schema for ActivityLog response with user details."""

    user: UserResponse | None = None


class ActivityLogListResponse(BaseModel):
    """Schema for paginated list of activity logs."""

    activities: list[ActivityLogResponse]
    total: int
    skip: int
    limit: int


class ActivityLogFilter(BaseModel):
    """Schema for filtering activity logs."""

    activity_type: ActivityType | None = Field(None, description="Filter by activity type")
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=50, ge=1, le=100)
