"""
Pydantic schemas for Team operations.
"""

from datetime import datetime

from pydantic import BaseModel, Field


class TeamPickBase(BaseModel):
    """Schema for team pick base fields."""

    driver_id: int | None = Field(None, description="ID of the driver")
    constructor_id: int | None = Field(None, description="ID of the constructor")
    pick_type: str = Field(..., description="Type of pick: 'driver' or 'constructor'")
    race_id: int | None = Field(None, description="Race ID if pick is race-specific")

    class Config:
        from_attributes = True


class TeamPickCreate(BaseModel):
    """Schema for creating a team pick."""

    entity_id: int = Field(..., description="ID of the driver or constructor")
    pick_type: str = Field(..., description="Type of pick: 'driver' or 'constructor'")
    race_id: int = Field(..., description="Race ID for the pick")


class TeamPickResponse(BaseModel):
    """Schema for team pick response."""

    id: int
    fantasy_team_id: int
    driver_id: int | None = None
    constructor_id: int | None = None
    pick_type: str
    points_earned: int = 0
    race_id: int | None = None
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamBase(BaseModel):
    """Schema for team base fields."""

    name: str = Field(..., min_length=3, max_length=100, description="Team name")

    class Config:
        from_attributes = True


class TeamCreate(BaseModel):
    """Schema for creating a team."""

    team_name: str = Field(..., min_length=3, max_length=100, description="Team name")
    league_id: int = Field(..., description="League ID to join")


class TeamUpdate(BaseModel):
    """Schema for updating a team."""

    team_name: str | None = Field(None, min_length=3, max_length=100, description="Team name")

    class Config:
        from_attributes = True


class TeamResponse(BaseModel):
    """Schema for team response."""

    id: int
    user_id: int
    league_id: int
    name: str
    total_points: int
    budget_remaining: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TeamDetailResponse(TeamResponse):
    """Schema for team detail response with picks."""

    picks: list[TeamPickResponse] = Field(default_factory=list)


class TeamListResponse(BaseModel):
    """Schema for team list response."""

    items: list[TeamResponse]
    total: int
    page: int
    size: int
