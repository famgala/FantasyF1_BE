"""Schemas for league role management."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class UserRole(str, Enum):
    """User roles in a league."""

    CREATOR = "creator"
    CO_MANAGER = "co_manager"
    MEMBER = "member"


class LeagueRoleBase(BaseModel):
    """Base schema for league role."""

    role: UserRole = Field(default=UserRole.MEMBER)


class LeagueRoleCreate(LeagueRoleBase):
    """Schema for creating a league role."""

    pass


class LeagueRoleUpdate(BaseModel):
    """Schema for updating a league role."""

    role: UserRole


class LeagueRoleResponse(LeagueRoleBase):
    """Schema for league role response."""

    id: int
    league_id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config."""

        from_attributes = True


class CoManagerRequest(BaseModel):
    """Schema for requesting to become a co-manager."""

    message: str | None = Field(None, max_length=500)


class PromoteCoManagerRequest(BaseModel):
    """Schema for promoting a user to co-manager."""

    user_id: int
    message: str | None = Field(None, max_length=500)
