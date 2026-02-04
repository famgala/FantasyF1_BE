"""Schema definitions for Driver model."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DriverBase(BaseModel):
    """Base schema for Driver with shared fields."""

    external_id: int
    name: str = Field(..., max_length=255)
    team_name: str = Field(..., max_length=255)
    number: int | None = None
    code: str | None = Field(None, max_length=3)
    country: str | None = Field(None, max_length=100)
    price: int = Field(default=0, ge=0, description="Price in millions")
    status: str = Field(default="active", max_length=50)


class DriverCreate(DriverBase):
    """Schema for creating a new Driver.

    Used when syncing drivers from external API.
    """

    pass


class DriverUpdate(BaseModel):
    """Schema for updating an existing Driver."""

    team_name: str | None = Field(None, max_length=255)
    number: int | None = None
    price: int | None = Field(None, ge=0)
    status: str | None = Field(None, max_length=50)
    total_points: int | None = Field(None, ge=0)
    average_points: float | None = Field(None, ge=0)


class DriverResponse(DriverBase):
    """Schema for Driver response."""

    id: int
    total_points: int = Field(default=0, ge=0)
    average_points: float = Field(default=0, ge=0)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DriverListResponse(BaseModel):
    """Schema for paginated list of drivers."""

    drivers: list[DriverResponse]
    total: int
    skip: int
    limit: int


class DriverRaceResult(BaseModel):
    """Schema for a single race result in driver performance."""

    race_id: int
    race_name: str
    round_number: int
    race_date: datetime
    position: int
    grid_position: int | None = None
    points_earned: int
    fastest_lap: bool
    dnf: bool
    dnf_reason: str | None = None


class DriverPerformanceStats(BaseModel):
    """Schema for driver performance statistics."""

    total_points: int
    avg_points_per_race: float
    races_finished: int
    races_count: int
    best_finish: int | None = None
    worst_finish: int | None = None
    podium_count: int
    dnf_count: int


class DriverPerformanceResponse(BaseModel):
    """Schema for driver performance response."""

    driver_id: int
    driver_name: str
    driver_code: str | None = None
    stats: DriverPerformanceStats
    race_results: list[DriverRaceResult]
