"""Admin schemas for admin-related operations."""

from typing import TypedDict

from pydantic import BaseModel


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
