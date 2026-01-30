"""Races API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_superuser, get_db
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.race import RaceListResponse, RaceResponse, RaceUpdate
from app.services.race_service import RaceService

router = APIRouter()


@router.get("", response_model=RaceListResponse, status_code=status.HTTP_200_OK)
async def list_races(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    status: str
    | None = Query(default=None, description="Filter by status (upcoming, completed, cancelled)"),
    country: str | None = Query(default=None, description="Filter by country"),
) -> RaceListResponse:
    """List all races with optional filtering."""
    races = await RaceService.get_all(db, skip=skip, limit=limit, status=status, country=country)
    total = await RaceService.count(db, status=status)
    return RaceListResponse(
        races=[RaceResponse.model_validate(r) for r in races],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/upcoming", response_model=RaceListResponse, status_code=status.HTTP_200_OK)
async def list_upcoming_races(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=10, ge=1, le=100, description="Maximum number of races to return"),
) -> RaceListResponse:
    """List upcoming races sorted by date."""
    races = await RaceService.get_upcoming(db, limit=limit)
    return RaceListResponse(
        races=[RaceResponse.model_validate(r) for r in races],
        total=len(races),
        skip=0,
        limit=limit,
    )


@router.get("/past", response_model=RaceListResponse, status_code=status.HTTP_200_OK)
async def list_past_races(
    db: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=10, ge=1, le=100, description="Maximum number of races to return"),
) -> RaceListResponse:
    """List past/completed races sorted by date (most recent first)."""
    races = await RaceService.get_completed(db, limit=limit)
    return RaceListResponse(
        races=[RaceResponse.model_validate(r) for r in races],
        total=len(races),
        skip=0,
        limit=limit,
    )


@router.get("/{race_id}", response_model=RaceResponse, status_code=status.HTTP_200_OK)
async def get_race(
    race_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RaceResponse:
    """Get race by ID."""
    race = await RaceService.get_by_id(db, race_id)
    if race is None:
        raise NotFoundError("Race not found")
    return RaceResponse.model_validate(race)


@router.patch("/{race_id}", response_model=RaceResponse, status_code=status.HTTP_200_OK)
async def update_race(
    race_id: int,
    race_update: RaceUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_superuser)],  # noqa: ARG001
) -> RaceResponse:
    """Update race (admin only)."""
    race = await RaceService.get_by_id(db, race_id)
    if race is None:
        raise NotFoundError("Race not found")
    updated = await RaceService.update(db, race, race_update)
    return RaceResponse.model_validate(updated)
