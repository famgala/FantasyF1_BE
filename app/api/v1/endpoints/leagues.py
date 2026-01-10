"""Leagues API endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.league import (
    LeagueCreate,
    LeagueDetailResponse,
    LeagueListResponse,
    LeagueResponse,
    LeagueUpdate,
)
from app.services.league_service import LeagueService

router = APIRouter()


@router.get("/my-leagues", response_model=LeagueListResponse, status_code=status.HTTP_200_OK)
async def list_my_leagues(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> LeagueListResponse:
    """List leagues created by current user."""
    leagues = await LeagueService.get_by_creator(db, current_user.id, skip=skip, limit=limit)
    total = await LeagueService.count_by_creator(db, current_user.id)
    return LeagueListResponse(
        leagues=[LeagueResponse.model_validate(lg) for lg in leagues],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("", response_model=LeagueListResponse, status_code=status.HTTP_200_OK)
async def list_leagues(
    db: Annotated[AsyncSession, Depends(get_db)],
    search: str | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    current_user: Annotated[User | None, Depends(get_current_user)] = None,  # noqa: ARG001
) -> LeagueListResponse:
    """List all leagues with optional search."""
    if search:
        leagues = await LeagueService.search(db, search, skip=skip, limit=limit)
        total = len(leagues)
    else:
        leagues = await LeagueService.get_all(db, skip=skip, limit=limit)
        total = await LeagueService.count(db)
    return LeagueListResponse(
        leagues=[LeagueResponse.model_validate(lg) for lg in leagues],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/search", response_model=LeagueListResponse, status_code=status.HTTP_200_OK)
async def search_leagues(
    db: Annotated[AsyncSession, Depends(get_db)],
    query: str = Query(min_length=1),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: Annotated[User | None, Depends(get_current_user)] = None,  # noqa: ARG001
) -> LeagueListResponse:
    """Search leagues by name."""
    leagues = await LeagueService.search(db, query, skip=skip, limit=limit)
    total = len(leagues)
    return LeagueListResponse(
        leagues=[LeagueResponse.model_validate(lg) for lg in leagues],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get("/{league_id}", response_model=LeagueDetailResponse, status_code=status.HTTP_200_OK)
async def get_league(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user)] = None,  # noqa: ARG001
) -> LeagueDetailResponse:
    """Get league by ID with full details."""
    league = await LeagueService.get(db, league_id)
    return LeagueDetailResponse.model_validate(league)


@router.get("/code/{code}", response_model=LeagueDetailResponse, status_code=status.HTTP_200_OK)
async def get_league_by_code(
    code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user)] = None,  # noqa: ARG001
) -> LeagueDetailResponse:
    """Get league by join code."""
    league = await LeagueService.get_by_code(db, code)
    if not league:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="League not found")
    return LeagueDetailResponse.model_validate(league)


@router.post("", response_model=LeagueResponse, status_code=status.HTTP_201_CREATED)
async def create_league(
    league_create: LeagueCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LeagueResponse:
    """Create a new league."""
    league = await LeagueService.create(db, league_create, current_user.id)
    return LeagueResponse.model_validate(league)


@router.patch("/{league_id}", response_model=LeagueResponse, status_code=status.HTTP_200_OK)
async def update_league(
    league_id: int,
    league_update: LeagueUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> LeagueResponse:
    """Update league (creator only)."""
    league = await LeagueService.get(db, league_id)
    if league.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league creator can update",
        )
    updated = await LeagueService.update(db, league, league_update)
    return LeagueResponse.model_validate(updated)


@router.delete("/{league_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_league(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """Delete league (creator only)."""
    league = await LeagueService.get(db, league_id)
    if league.creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league creator can delete",
        )
    await LeagueService.delete(db, league)
