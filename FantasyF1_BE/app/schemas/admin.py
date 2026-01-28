"""Admin schemas for admin-related operations."""

from datetime import datetime

from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class DailyStat(TypedDict):
    """Daily statistic entry.

    Attributes:
        date: Date in YYYY-MM-DD format
        count: Count for that date
    """

    date: str
    count: int


class AdminStatsResponse(BaseModel):
    """Admin statistics response.

    Attributes:
        total_users: Total number of users in the system
        active_users_7d: Number of users active in the last 7 days
        total_leagues: Total number of leagues
        active_leagues: Number of active leagues
        completed_races: Number of completed races
        upcoming_races: Number of upcoming races
        registrations_by_day: User registrations per day for last 30 days
        leagues_by_day: League creations per day for last 30 days
    """

    total_users: int
    active_users_7d: int
    total_leagues: int
    active_leagues: int
    completed_races: int
    upcoming_races: int
    registrations_by_day: list[DailyStat]
    leagues_by_day: list[DailyStat]

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_users": 150,
                "active_users_7d": 45,
                "total_leagues": 32,
                "active_leagues": 28,
                "completed_races": 12,
                "upcoming_races": 8,
                "registrations_by_day": [
                    {"date": "2026-01-01", "count": 5},
                    {"date": "2026-01-02", "count": 3},
                ],
                "leagues_by_day": [
                    {"date": "2026-01-01", "count": 2},
                    {"date": "2026-01-02", "count": 1},
                ],
            }
        }
    }


class ErrorLogResponse(BaseModel):
    """Error log response.

    Attributes:
        id: Error log ID
        timestamp: When the error occurred
        error_type: Type/category of the error
        message: Error message
        endpoint: API endpoint where error occurred
        user_id: ID of user who encountered error
        stack_trace: Full stack trace
        severity: Error severity level
        request_data: Request payload
        response_data: Response data
        ip_address: Client IP address
        user_agent: Client user agent
        resolved: Whether error has been resolved
        resolved_at: When error was resolved
        resolved_by: ID of admin who resolved
        notes: Resolution notes
    """

    id: int
    timestamp: datetime
    error_type: str
    message: str
    endpoint: str | None = None
    user_id: int | None = None
    stack_trace: str | None = None
    severity: str
    request_data: dict[str, object] | None = None
    response_data: dict[str, object] | None = None
    ip_address: str | None = None
    user_agent: str | None = None
    resolved: bool
    resolved_at: datetime | None = None
    resolved_by: int | None = None
    notes: str | None = None

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": 1,
                "timestamp": "2026-01-27T10:00:00Z",
                "error_type": "ValidationError",
                "message": "Invalid input data",
                "endpoint": "/api/v1/leagues/create",
                "user_id": 123,
                "stack_trace": "Traceback (most recent call last)...",
                "severity": "error",
                "request_data": {"name": "Test"},
                "response_data": {"error": "Invalid"},
                "ip_address": "192.168.1.1",
                "user_agent": "Mozilla/5.0...",
                "resolved": False,
                "resolved_at": None,
                "resolved_by": None,
                "notes": None,
            }
        },
    }


class ErrorLogUpdate(BaseModel):
    """Error log update request.

    Attributes:
        resolved: Whether error is resolved
        notes: Resolution notes
    """

    resolved: bool = Field(..., description="Mark error as resolved/unresolved")
    notes: str | None = Field(None, description="Resolution notes or comments")

    model_config = {
        "json_schema_extra": {
            "example": {
                "resolved": True,
                "notes": "Fixed by updating validation logic",
            }
        }
    }


class ErrorLogsResponse(BaseModel):
    """Paginated error logs response.

    Attributes:
        items: List of error logs
        total: Total number of error logs
        page: Current page number
        page_size: Number of items per page
        total_pages: Total number of pages
    """

    items: list[ErrorLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class HealthStatusResponse(BaseModel):
    """System health status response.

    Attributes:
        api_status: API health status (healthy/degraded/unhealthy)
        api_response_time_ms: API response time in milliseconds
        database_status: Database connection status (healthy/degraded/unhealthy)
        database_response_time_ms: Database response time in milliseconds
        redis_status: Redis cache status (healthy/degraded/unhealthy)
        redis_response_time_ms: Redis response time in milliseconds
        celery_status: Celery task queue status (healthy/degraded/unhealthy)
        celery_response_time_ms: Celery response time in milliseconds
        overall_status: Overall system health (healthy/degraded/unhealthy)
        timestamp: When the health check was performed
    """

    api_status: str = Field(..., description="API service health status")
    api_response_time_ms: float = Field(..., description="API response time in milliseconds")
    database_status: str = Field(..., description="Database connection status")
    database_response_time_ms: float = Field(
        ..., description="Database response time in milliseconds"
    )
    redis_status: str = Field(..., description="Redis cache status")
    redis_response_time_ms: float = Field(..., description="Redis response time in milliseconds")
    celery_status: str = Field(..., description="Celery task queue status")
    celery_response_time_ms: float = Field(..., description="Celery response time in milliseconds")
    overall_status: str = Field(..., description="Overall system health status")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow, description="Health check timestamp"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "api_status": "healthy",
                "api_response_time_ms": 12.5,
                "database_status": "healthy",
                "database_response_time_ms": 8.3,
                "redis_status": "healthy",
                "redis_response_time_ms": 2.1,
                "celery_status": "healthy",
                "celery_response_time_ms": 5.7,
                "overall_status": "healthy",
                "timestamp": "2026-01-27T23:45:00Z",
            }
        }
    }
