"""Schema definitions for Race Result model."""

from datetime import datetime

from pydantic import BaseModel, Field


class RaceResultBase(BaseModel):
    """Base schema for Race Result with shared fields."""

    race_id: int = Field(..., description="ID of the race")
    driver_external_id: int = Field(..., description="External ID of the driver from Jolpica API")
    driver_name: str = Field(..., max_length=255, description="Driver's name")
    position: int = Field(..., ge=0, le=20, description="Final finishing position (1-20, 0 for DNF)")
    grid_position: int | None = Field(None, ge=1, le=20, description="Starting position on the grid")
    laps_completed: int | None = Field(None, ge=0, description="Number of laps completed")
    points_earned: int = Field(default=0, ge=0, description="F1 championship points earned")
    fastest_lap: bool = Field(default=False, description="Whether driver recorded the fastest lap")
    fastest_lap_time: float | None = Field(None, description="Fastest lap time in seconds")
    time_diff: float | None = Field(None, description="Time difference to winner in seconds")
    time_diff_str: str | None = Field(None, max_length=20, description="String representation of time difference")
    dnf: bool = Field(default=False, description="Whether driver did not finish")
    dnf_reason: str | None = Field(None, max_length=255, description="Reason for DNF")
    dns: bool = Field(default=False, description="Whether driver did not start")
    dsq: bool = Field(default=False, description="Whether driver was disqualified")


class RaceResultResponse(RaceResultBase):
    """Schema for Race Result response."""

    id: int
    created_at: datetime
    updated_at: datetime

    # Computed fields
    position_change: int | None = Field(None, description="Positions gained (+) or lost (-) from grid to finish")

    class Config:
        """Pydantic config for ORM mode."""

        from_attributes = True


class RaceResultListResponse(BaseModel):
    """Schema for list of race results."""

    results: list[RaceResultResponse]
    race_id: int
    race_name: str
    total_results: int
