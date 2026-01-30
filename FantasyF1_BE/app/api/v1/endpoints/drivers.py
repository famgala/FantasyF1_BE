"""Drivers API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundError
from app.models.user import User
from app.schemas.driver import DriverListResponse, DriverResponse, DriverUpdate
from app.services.driver_service import DriverService

router = APIRouter()


@router.get("", response_model=DriverListResponse, status_code=status.HTTP_200_OK)
async def list_drivers(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> DriverListResponse:
    """List all drivers with optional filtering."""
    drivers = await DriverService.get_all(db, skip=skip, limit=limit)
    total = await DriverService.count(db)
    return DriverListResponse(
        drivers=[DriverResponse.model_validate(d) for d in drivers],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/search", response_model=DriverListResponse, status_code=status.HTTP_200_OK)
async def search_drivers(
    db: Annotated[AsyncSession, Depends(get_db)],
    query: str = Query(min_length=1),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> DriverListResponse:
    """Search drivers by name."""
    results = await DriverService.search(db, query, skip=skip, limit=limit)
    total = len(results)
    return DriverListResponse(
        drivers=[DriverResponse.model_validate(d) for d in results],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{driver_id}", response_model=DriverResponse, status_code=status.HTTP_200_OK)
async def get_driver(
    driver_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> DriverResponse:
    """Get driver by ID."""
    driver = await DriverService.get_by_id(db, driver_id)
    if driver is None:
        raise NotFoundError("Driver not found")
    return DriverResponse.model_validate(driver)


@router.patch("/{driver_id}", response_model=DriverResponse, status_code=status.HTTP_200_OK)
async def update_driver(
    driver_id: int,
    driver_update: DriverUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],  # noqa: ARG001
) -> DriverResponse:
    """Update driver (admin only - placeholder)."""
    driver = await DriverService.get_by_id(db, driver_id)
    if driver is None:
        raise NotFoundError("Driver not found")
    updated = await DriverService.update(db, driver, driver_update)
    return DriverResponse.model_validate(updated)
