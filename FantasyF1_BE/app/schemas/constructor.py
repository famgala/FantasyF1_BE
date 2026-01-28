"""Schema definitions for Constructor model."""

from datetime import datetime

from pydantic import BaseModel, Field


class ConstructorBase(BaseModel):
    """Base schema for Constructor with shared fields."""

    team_name: str = Field(..., max_length=100, description="Full F1 team name")
    team_code: str = Field(..., max_length=10, description="Short team code")


class ConstructorCreate(ConstructorBase):
    """Schema for creating a new Constructor from external API."""

    engine: str | None = Field(None, max_length=50)
    chassis: str | None = Field(None, max_length=50)
    nationality: str | None = Field(None, max_length=50)
    year: int | None = Field(None, description="Season year")
    world_wins: int = Field(default=0, ge=0, description="Historical win count")
    world_championships: int = Field(default=0, ge=0, description="World championships won")
    current_points: int = Field(default=0, ge=0, description="Current season points")


class ConstructorUpdate(BaseModel):
    """Schema for updating an existing Constructor."""

    engine: str | None = Field(None, max_length=50)
    chassis: str | None = Field(None, max_length=50)
    current_points: int | None = Field(None, ge=0)


class ConstructorResponse(ConstructorBase):
    """Schema for Constructor response."""

    id: int
    engine: str | None
    chassis: str | None
    nationality: str | None
    year: int | None
    world_wins: int
    world_championships: int
    current_points: int
    created_at: datetime
    updated_at: datetime

    class Config:
        """Pydantic config for ORM mode."""

        from_attributes = True


class ConstructorListResponse(BaseModel):
    """Schema for paginated list of constructors."""

    constructors: list[ConstructorResponse]
    total: int
    skip: int
    limit: int
