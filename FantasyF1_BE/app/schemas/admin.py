"""Admin schemas for request/response validation."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class DailyDataPoint(BaseModel):
    """Schema for daily data point."""

    date: str
    count: int

    model_config = ConfigDict(from_attributes=True)


class PlatformStats(BaseModel):
    """Schema for platform statistics."""

    total_users: int
    active_users_7d: int
    total_leagues: int
    active_leagues: int
    completed_races: int
    upcoming_races: int
    registrations_by_day: list[DailyDataPoint]
    leagues_by_day: list[DailyDataPoint]

    model_config = ConfigDict(from_attributes=True)


class AdminUserBase(BaseModel):
    """Base schema for admin user."""

    id: int
    username: str
    email: str
    full_name: str | None
    role: Literal["user", "admin"]
    is_active: bool
    created_at: datetime
    teams_count: int

    model_config = ConfigDict(from_attributes=True)


class AdminUserUpdate(BaseModel):
    """Schema for updating admin user."""

    is_active: bool | None = None
    role: Literal["user", "admin"] | None = None


class AdminUserListResponse(BaseModel):
    """Schema for admin user list response."""

    users: list[AdminUserBase]
    total: int


class AdminLeagueBase(BaseModel):
    """Base schema for admin league."""

    id: int
    name: str
    code: str
    manager_id: int
    manager_username: str
    is_private: bool
    status: Literal["drafting", "active", "completed", "cancelled"]
    teams_count: int
    max_teams: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminLeagueUpdate(BaseModel):
    """Schema for updating admin league."""

    status: Literal["active", "cancelled"] | None = None


class AdminLeagueListResponse(BaseModel):
    """Schema for admin league list response."""

    leagues: list[AdminLeagueBase]
    total: int


class ErrorLog(BaseModel):
    """Schema for error log."""

    id: int
    timestamp: datetime
    level: Literal["debug", "info", "warning", "error", "critical"]
    message: str
    module: str | None = None
    function: str | None = None
    line_number: int | None = None
    endpoint: str | None = None
    method: str | None = None
    user_id: int | None = None
    request_id: str | None = None
    stack_trace: str | None = None
    additional_data: str | None = None

    model_config = ConfigDict(from_attributes=True)


class ErrorLogListResponse(BaseModel):
    """Schema for error log list response."""

    logs: list[ErrorLog]
    total: int


class SystemHealth(BaseModel):
    """Schema for system health status."""

    api: Literal["healthy", "degraded", "down"]
    database: Literal["healthy", "degraded", "down"]
    redis: Literal["healthy", "degraded", "down"]
    celery: Literal["healthy", "degraded", "down"]
    response_times: dict[str, int]

    model_config = ConfigDict(from_attributes=True)


class BroadcastNotificationRequest(BaseModel):
    """Schema for broadcast notification request."""

    type: Literal["system", "announcement", "alert"]
    title: str
    message: str
    link: str | None = None
    recipients: Literal["all"] | int | list[int]
    scheduled_at: datetime | None = None
