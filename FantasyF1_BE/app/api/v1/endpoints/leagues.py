"""Leagues API endpoints."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.race import Race
from app.models.user import User
from app.schemas.leaderboard import LeaderboardEntry, LeaderboardResponse
from app.schemas.league import (
    LeagueCreate,
    LeagueDetailResponse,
    LeagueListResponse,
    LeagueResponse,
    LeagueUpdate,
)
from app.schemas.league_role import MyRoleResponse, UserRole
from app.schemas.team import TeamResponse as LeagueTeamResponse
from app.services.fantasy_team_service import FantasyTeamService
from app.services.invitation_service import InvitationService
from app.services.leaderboard_service import LeaderboardService
from app.services.league_role_service import LeagueRoleService
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
    current_user: Annotated[User | None, Depends(get_current_user)] = None,
) -> LeagueDetailResponse:
    """Get league by ID with full details.

    For private leagues, only league members can access the details.
    """
    league = await LeagueService.get(db, league_id)

    # Check access control for private leagues
    if league.is_private and current_user:
        # If logged in, check if user is a member (has a team in the league)
        user_teams = await FantasyTeamService.get_user_teams(
            session=db,
            user_id=current_user.id,
            league_id=league_id,
        )
        if not user_teams and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a member to view this private league",
            )
    elif league.is_private and not current_user:
        # Anonymous users cannot access private leagues
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be logged in to view private leagues",
        )

    return LeagueDetailResponse.model_validate(league)


@router.get("/code/{code}", response_model=LeagueDetailResponse, status_code=status.HTTP_200_OK)
async def get_league_by_code(
    code: str,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User | None, Depends(get_current_user)] = None,
) -> LeagueDetailResponse:
    """Get league by join code.

    For private leagues, only league members can access the details.
    """
    league = await LeagueService.get_by_code(db, code)
    if not league:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="League not found")

    # Check access control for private leagues
    if league.is_private and current_user:
        # If logged in, check if user is a member (has a team in the league)
        user_teams = await FantasyTeamService.get_user_teams(
            session=db,
            user_id=current_user.id,
            league_id=league.id,
        )
        if not user_teams and not current_user.is_superuser:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a member to view this private league",
            )
    elif league.is_private and not current_user:
        # Anonymous users cannot access private leagues
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You must be logged in to view private leagues",
        )

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


@router.get("/{league_id}/members", status_code=status.HTTP_200_OK)
async def list_league_members(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],  # noqa: ARG001
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> dict[str, Any]:
    """List all members (teams) in a league."""
    await LeagueService.get(db, league_id)

    # Get all teams in the league
    teams = await FantasyTeamService.get_user_teams(session=db, user_id=None, league_id=league_id)

    total = len(teams)
    items = teams[skip : skip + limit]

    # Extract unique user IDs from teams
    members_data = []
    for team in items:
        members_data.append(
            {
                "user_id": team.user_id,
                "team_id": team.id,
                "team_name": team.name,
                "joined_at": team.created_at,
            }
        )

    return {
        "items": members_data,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.get("/{league_id}/teams", status_code=status.HTTP_200_OK)
async def list_league_teams(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],  # noqa: ARG001
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> dict[str, Any]:
    """List all teams in a league."""
    # Verify league exists
    await LeagueService.get(db, league_id)

    # Get all teams in the league
    teams = await FantasyTeamService.get_user_teams(session=db, user_id=None, league_id=league_id)

    total = len(teams)
    items = [LeagueTeamResponse.model_validate(t) for t in teams[skip : skip + limit]]

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post(
    "/{league_id}/join",
    response_model=LeagueTeamResponse,
    status_code=status.HTTP_201_CREATED,
)
async def join_league(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    team_name: str = Query(
        ...,
        min_length=3,
        max_length=100,
        description="Team name",
    ),
    invite_code: str
    | None = Query(
        None,
        description="Invite code for private leagues",
    ),
) -> LeagueTeamResponse:
    """Join a league by creating a team in it.

    For public leagues: Anyone can join
    For private leagues: Must provide valid invite code or have pending invitation

    This endpoint creates a new team for the user in the specified league,
    effectively joining the league.
    """
    league = await LeagueService.get(db, league_id)

    # Check if league is private
    if league.is_private:
        # Check if user has a valid invite code
        code_valid = False
        if invite_code and league.code:
            code_valid = invite_code == league.code

        # Check if user has a pending invitation
        has_invitation = False
        if invite_code and not code_valid:
            try:
                invitation = await InvitationService.get_by_code(db, invite_code)
                if invitation and invitation.league_id == league_id:
                    has_invitation = True
            except Exception:
                has_invitation = False

        if not code_valid and not has_invitation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid invite code. Please get a valid invite code "
                "from the league creator.",
            )

    # Check if user already has a team in this league
    existing_teams = await FantasyTeamService.get_user_teams(
        session=db,
        user_id=current_user.id,
        league_id=league_id,
    )

    if existing_teams:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a team in this league",
        )

    # Check if league is full
    all_teams = await FantasyTeamService.get_user_teams(
        session=db, user_id=None, league_id=league_id
    )
    if len(all_teams) >= league.max_teams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"League is full (max {league.max_teams} teams)",
        )

    from app.core.exceptions import ConflictError, NotFoundError

    try:
        team = await FantasyTeamService.create_team(
            session=db,
            user_id=current_user.id,
            league_id=league_id,
            name=team_name,
        )

        # If user joined via invite code, invalidate the invitation
        if invite_code and league.is_private:
            try:
                invitation = await InvitationService.get_by_code(db, invite_code)
                if invitation and invitation.status == "pending":
                    await InvitationService.accept_invitation(
                        db=db,
                        invitation=invitation,
                        user_id=current_user.id,
                        team_name=team_name,
                    )
            except Exception:
                pass  # Silently fail if invitation update fails

        return LeagueTeamResponse.model_validate(team)
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


@router.get(
    "/{league_id}/leaderboard",
    response_model=LeaderboardResponse,
    status_code=status.HTTP_200_OK,
)
async def get_leaderboard(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],  # noqa: ARG001
    race_id: int | None = Query(None, description="Optional race ID for race-specific leaderboard"),
    use_cache: bool = Query(True, description="Whether to use cached data"),
    skip: int = Query(default=0, ge=0, description="Number of entries to skip"),
    limit: int = Query(
        default=100, ge=1, le=100, description="Maximum number of entries to return"
    ),
) -> LeaderboardResponse:
    """Get the leaderboard for a league.

    Returns sorted standings with tie-breaking based on:
    1. Total points (primary)
    2. Number of wins (secondary)
    3. Number of podiums (tertiary)
    4. Alphabetical team name (final)

    Args:
        league_id: League ID
        db: Database session
        current_user: Current authenticated user
        race_id: Optional race ID for race-specific leaderboard
        use_cache: Whether to use cached data if available
        skip: Number of entries to skip for pagination
        limit: Maximum number of entries to return

    Returns:
        Leaderboard response with entries sorted by rank

    Raises:
        HTTPException: If league not found
    """
    from sqlalchemy import select

    from app.core.exceptions import NotFoundError

    # Get league
    try:
        league = await LeagueService.get(db, league_id)
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found",
        ) from e

    # Get race if specified
    race_name = None
    if race_id:
        result = await db.execute(select(Race).where(Race.id == race_id))
        race = result.scalar_one_or_none()
        if not race:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Race not found",
            )
        race_name = race.name

    # Get leaderboard
    entries_dict = await LeaderboardService.get_leaderboard(
        db=db,
        league_id=league_id,
        race_id=race_id,
        use_cache=use_cache,
    )

    # Apply pagination
    total_entries = len(entries_dict)
    paginated_entries_dict = entries_dict[skip : skip + limit]

    # Convert to LeaderboardEntry objects
    entries = [LeaderboardEntry(**entry) for entry in paginated_entries_dict]

    return LeaderboardResponse(
        league_id=league_id,
        league_name=league.name,
        race_id=race_id,
        race_name=race_name,
        entries=entries,
        total_entries=total_entries,
    )


@router.get("/{league_id}/my-role", response_model=MyRoleResponse, status_code=status.HTTP_200_OK)
async def get_my_role(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MyRoleResponse:
    """Get the current user's role in a league.

    Returns the user's role (creator, co_manager, or member) or null if not a member.
    """
    # Verify league exists
    await LeagueService.get(db, league_id)

    # Get user's role
    user_role = await LeagueRoleService.get_user_role(db, league_id, current_user.id)

    role_enum: UserRole | None = None
    if user_role and user_role.role:
        try:
            role_enum = UserRole(user_role.role)
        except ValueError:
            role_enum = None

    return MyRoleResponse(
        role=role_enum,
        league_id=league_id,
        user_id=current_user.id,
    )


@router.delete("/{league_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_league(
    league_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """Leave a league by deleting your team in it.

    This endpoint finds and deletes the user's team in the specified league.
    """
    # Verify league exists
    await LeagueService.get(db, league_id)

    # Find user's team in this league
    teams = await FantasyTeamService.get_user_teams(
        session=db,
        user_id=current_user.id,
        league_id=league_id,
    )

    if not teams:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a team in this league",
        )

    # Delete the team (first/only team since one per user per league)
    team = teams[0]
    await FantasyTeamService.delete_team(
        session=db,
        team_id=team.id,
        user_id=current_user.id,
    )
