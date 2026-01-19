"""
Teams API endpoints for fantasy team management.
"""


from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ConflictError, NotFoundError
from app.models.user import User
from app.schemas.team import (
    TeamCreate,
    TeamDetailResponse,
    TeamListResponse,
    TeamPickCreate,
    TeamPickResponse,
    TeamResponse,
    TeamUpdate,
)
from app.services.fantasy_team_service import FantasyTeamService

router = APIRouter()


@router.post("/", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
async def create_team(
    team_in: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    """
    Create a new fantasy team.

    - **team_name**: Name of the fantasy team (3-50 characters)
    - **league_id**: Optional league ID to join
    """
    if not team_in.league_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="league_id is required to create a team",
        )

    try:
        team = await FantasyTeamService.create_team(
            session=db,
            user_id=current_user.id,
            league_id=team_in.league_id,
            name=team_in.team_name,
        )
        return TeamResponse.model_validate(team)
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        ) from e
    except (NotFoundError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.get("/", response_model=TeamListResponse)
async def list_teams(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of records to return"),
    league_id: int | None = Query(None, description="Filter by league ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamListResponse:
    """
    List fantasy teams.

    - **skip**: Number of records to skip (default: 0)
    - **limit**: Number of records to return (default: 100, max: 100)
    - **league_id**: Optional filter by league ID
    """
    # Get user's teams (optionally filtered by league)
    teams = await FantasyTeamService.get_user_teams(
        session=db,
        user_id=current_user.id,
        league_id=league_id,
    )

    total = len(teams)
    items = [TeamResponse.model_validate(t) for t in teams[skip : skip + limit]]

    return TeamListResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        size=limit,
    )


@router.get("/my-teams", response_model=TeamListResponse)
async def list_my_teams(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=100, description="Number of records to return"),
    league_id: int | None = Query(None, description="Filter by league ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamListResponse:
    """
    List current user's fantasy teams.

    - **skip**: Number of records to skip (default: 0)
    - **limit**: Number of records to return (default: 100, max: 100)
    - **league_id**: Optional filter by league ID
    """
    teams = await FantasyTeamService.get_user_teams(
        session=db,
        user_id=current_user.id,
        league_id=league_id,
    )
    total = len(teams)
    items = [TeamResponse.model_validate(t) for t in teams[skip : skip + limit]]

    return TeamListResponse(
        items=items,
        total=total,
        page=skip // limit + 1,
        size=limit,
    )


@router.get("/{team_id}", response_model=TeamDetailResponse)
async def get_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamDetailResponse:
    """
    Get a fantasy team by ID with picks.

    - **team_id**: ID of the team
    """
    team = await FantasyTeamService.get_team(
        session=db,
        team_id=team_id,
        user_id=current_user.id if not current_user.is_superuser else None,
    )

    picks = await FantasyTeamService.get_team_picks(session=db, team_id=team_id)

    pick_responses = [TeamPickResponse.model_validate(p) for p in picks]

    return TeamDetailResponse(
        **TeamResponse.model_validate(team).model_dump(),
        picks=pick_responses,
    )


@router.patch("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_in: TeamUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamResponse:
    """
    Update a fantasy team.

    - **team_id**: ID of the team
    - **team_name**: New team name (optional)
    """
    team = await FantasyTeamService.get_team(
        session=db,
        team_id=team_id,
        user_id=current_user.id if not current_user.is_superuser else None,
    )

    if team_in.team_name:
        team.name = team_in.team_name
        await db.commit()
        await db.refresh(team)

    return TeamResponse.model_validate(team)


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_team(
    team_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a fantasy team.

    - **team_id**: ID of the team
    """
    await FantasyTeamService.delete_team(
        session=db,
        team_id=team_id,
        user_id=current_user.id if not current_user.is_superuser else None,
    )


@router.get("/{team_id}/picks", response_model=list[TeamPickResponse])
async def list_team_picks(
    team_id: int,
    race_id: int | None = Query(None, description="Filter by race ID"),
    pick_type: str | None = Query(None, description="Filter by pick type (driver or constructor)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TeamPickResponse]:
    """
    List all picks for a fantasy team.

    - **team_id**: ID of the team
    - **race_id**: Optional filter by race ID
    - **pick_type**: Optional filter by pick type (driver or constructor)
    """
    # Verify team exists and user has access
    await FantasyTeamService.get_team(
        session=db,
        team_id=team_id,
        user_id=current_user.id if not current_user.is_superuser else None,
    )

    picks = await FantasyTeamService.get_team_picks(
        session=db,
        team_id=team_id,
        race_id=race_id,
        pick_type=pick_type,
    )
    return [TeamPickResponse.model_validate(p) for p in picks]


@router.post(
    "/{team_id}/picks", response_model=TeamPickResponse, status_code=status.HTTP_201_CREATED
)
async def add_team_pick(
    team_id: int,
    pick_in: TeamPickCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TeamPickResponse:
    """
    Add a driver or constructor to a fantasy team.

    - **team_id**: ID of the team
    - **entity_id**: ID of the driver or constructor to add
    - **pick_type**: Type of pick ('driver' or 'constructor')
    - **race_id**: Optional race ID for race-specific picks (required for this MVP)
    """
    # Verify team ownership
    await FantasyTeamService.get_team(
        session=db,
        team_id=team_id,
        user_id=current_user.id if not current_user.is_superuser else None,
    )

    # Check if race_id is provided
    if not pick_in.race_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="race_id is required for picks",
        )

    # Check if pick_type is valid
    if pick_in.pick_type not in ["driver", "constructor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="pick_type must be 'driver' or 'constructor'",
        )

    try:
        if pick_in.pick_type == "driver":
            pick = await FantasyTeamService.add_driver_pick(
                session=db,
                team_id=team_id,
                driver_id=pick_in.entity_id,
                race_id=pick_in.race_id,
                pick_number=1,  # Default to first pick slot
            )
        else:  # constructor
            pick = await FantasyTeamService.add_constructor_pick(
                session=db,
                team_id=team_id,
                constructor_id=pick_in.entity_id,
                race_id=pick_in.race_id,
            )
        return TeamPickResponse.model_validate(pick)
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e


@router.delete("/{team_id}/picks/{pick_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_team_pick(
    team_id: int,
    pick_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a pick from a fantasy team.

    - **team_id**: ID of the team
    - **pick_id**: ID of the pick to remove
    """
    # Verify team ownership
    await FantasyTeamService.get_team(
        session=db,
        team_id=team_id,
        user_id=current_user.id if not current_user.is_superuser else None,
    )

    try:
        await FantasyTeamService.remove_pick(
            session=db,
            pick_id=pick_id,
            team_id=team_id,
        )
    except (NotFoundError, ValueError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
