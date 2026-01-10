"""Schema definitions for Race model."""

from datetime import datetime

from pydantic import BaseModel, Field


class RaceBase(BaseModel):
    """Base schema for Race with shared fields."""

    external_id: int
    name: str = Field(..., max_length=255)
    circuit_name: str = Field(..., max_length=255)
    country: str = Field(..., max_length=100)
    round_number: int = Field(..., ge=1, le=24)
    race_date: datetime
    status: str = Field(default="upcoming", max_length=50)


class RaceCreate(RaceBase):
    """Schema for creating a new Race.

    Used when syncing races from external API.
    """

    pass


class RaceUpdate(BaseModel):
    """Schema for updating an existing Race."""

    status: str | None = Field(None, max_length=50)
    race_date: datetime | None = None


class RaceResponse(RaceBase):
    """Schema for Race response."""

    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config for ORM mode."""

        from_attributes = True


class RaceListResponse(BaseModel):
    """Schema for paginated list of races."""

    races: list[RaceResponse]
    total: int
    skip: int
    limit: int
