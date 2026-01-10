"""Schema definitions for League model."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse


class LeagueBase(BaseModel):
    """Base schema for League with shared fields."""

    name: str = Field(..., max_length=255)
    description: str | None = Field(None, max_length=1000)
    max_teams: int = Field(default=10, ge=2, le=50, description="Maximum number of teams")
    is_private: bool = Field(default=False, description="Whether league is private")
    draft_method: str = Field(default="sequential", max_length=50)


class LeagueCreate(LeagueBase):
    """Schema for creating a new League."""

    pass


class LeagueUpdate(BaseModel):
    """Schema for updating an existing League."""

    name: str | None = Field(None, max_length=255)
    description: str | None = Field(None, max_length=1000)
    max_teams: int | None = Field(None, ge=2, le=50)
    is_private: bool | None = None
    draft_method: str | None = Field(None, max_length=50)


class LeagueResponse(LeagueBase):
    """Schema for League response."""

    id: int
    code: str = Field(..., max_length=10)
    creator_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config for ORM mode."""

        from_attributes = True


class LeagueDetailResponse(LeagueResponse):
    """Schema for League detail response with creator info."""

    creator: UserResponse | None = None
    team_count: int = Field(default=0, description="Number of teams in league")


class LeagueListResponse(BaseModel):
    """Schema for paginated list of leagues."""

    leagues: list[LeagueResponse]
    total: int
    skip: int
    limit: int


class LeagueJoinRequest(BaseModel):
    """Schema for joining a league."""

    code: str = Field(..., max_length=10)
