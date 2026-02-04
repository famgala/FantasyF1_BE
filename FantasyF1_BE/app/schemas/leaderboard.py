"""Schemas for leaderboard responses."""

from pydantic import BaseModel, ConfigDict, Field


class LeaderboardEntry(BaseModel):
    """Represents a single entry in the league leaderboard."""

    rank: int = Field(..., description="Position in the leaderboard")
    team_id: int = Field(..., description="Team ID")
    team_name: str = Field(..., description="Team name")
    user_id: int = Field(..., description="User ID")
    username: str = Field(..., description="Username")
    total_points: int = Field(..., description="Total points earned")
    wins: int = Field(default=0, description="Number of wins")
    podiums: int = Field(default=0, description="Number of podium finishes")
    is_tied: bool = Field(default=False, description="Whether this position is tied")

    model_config = ConfigDict(from_attributes=True)


class LeaderboardResponse(BaseModel):
    """Leaderboard response."""

    league_id: int = Field(..., description="League ID")
    league_name: str = Field(..., description="League name")
    race_id: int | None = Field(None, description="Race ID if race-specific leaderboard")
    race_name: str | None = Field(None, description="Race name if race-specific leaderboard")
    entries: list[LeaderboardEntry] = Field(..., description="Leaderboard entries sorted by rank")
    total_entries: int = Field(..., description="Total number of entries")

    model_config = ConfigDict(from_attributes=True)


class UserRankResponse(BaseModel):
    """Response for a single user's rank in a leaderboard."""

    league_id: int = Field(..., description="League ID")
    league_name: str = Field(..., description="League name")
    rank: int = Field(..., description="User's rank position")
    entry: LeaderboardEntry = Field(..., description="User's leaderboard entry")
    is_tied: bool = Field(..., description="Whether the user's position is tied")
    total_entries: int = Field(..., description="Total number of entries in leaderboard")

    model_config = ConfigDict(from_attributes=True)
