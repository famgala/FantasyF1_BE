"""Schema definitions for Driver model."""

from datetime import datetime

from pydantic import BaseModel, Field


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

    class Config:
        """Pydantic config for ORM mode."""

        from_attributes = True


class DriverListResponse(BaseModel):
    """Schema for paginated list of drivers."""

    drivers: list[DriverResponse]
    total: int
    skip: int
    limit: int
