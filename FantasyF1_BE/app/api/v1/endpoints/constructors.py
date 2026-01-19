"""Read-only Constructors API endpoints for F1 team data."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.schemas.constructor import ConstructorListResponse, ConstructorResponse
from app.services.constructor_service import ConstructorService

router = APIRouter()


@router.get("", response_model=ConstructorListResponse, status_code=status.HTTP_200_OK)
async def get_constructors(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
    year: int | None = Query(default=None),
    nationality: str | None = Query(default=None),
) -> ConstructorListResponse:
    """Get all F1 constructors with optional filtering and pagination."""
    constructors = await ConstructorService.get_all(
        db, skip=skip, limit=limit, year=year, nationality=nationality
    )
    total = await ConstructorService.count(db, year=year, nationality=nationality)
    return ConstructorListResponse(
        constructors=[ConstructorResponse.model_validate(c) for c in constructors],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{constructor_id}",
    response_model=ConstructorResponse,
    status_code=status.HTTP_200_OK,
)
async def get_constructor(
    constructor_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConstructorResponse:
    """Get constructor by ID."""
    constructor = await ConstructorService.get(db, constructor_id)
    return ConstructorResponse.model_validate(constructor)


@router.get(
    "/code/{team_code}",
    response_model=ConstructorResponse,
    status_code=status.HTTP_200_OK,
)
async def get_constructor_by_code(
    team_code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ConstructorResponse:
    """Get constructor by team code (e.g., FER, MER, RBR)."""
    constructor = await ConstructorService.get_by_code(db, team_code)
    if constructor is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Constructor not found")
    return ConstructorResponse.model_validate(constructor)
