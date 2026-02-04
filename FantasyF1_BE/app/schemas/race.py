"""Schema definitions for Race model."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
    winning_constructor_id: int | None = Field(None, description="Constructor ID of race winner")


class RaceResponse(RaceBase):
    """Schema for Race response."""

    id: int
    fp1_date: datetime | None = Field(None, description="Practice session 1 date/time")
    fp2_date: datetime | None = Field(None, description="Practice session 2 date/time")
    fp3_date: datetime | None = Field(None, description="Practice session 3 date/time")
    qualifying_date: datetime | None = Field(None, description="Qualifying session date/time")
    winning_constructor_id: int | None = Field(None, description="Constructor ID of race winner")
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RaceListResponse(BaseModel):
    """Schema for paginated list of races."""

    races: list[RaceResponse]
    total: int
    skip: int
    limit: int
