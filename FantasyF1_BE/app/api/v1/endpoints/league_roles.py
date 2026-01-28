"""League roles API endpoints for co-manager support."""

from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.schemas.league_role import (
    LeagueRoleResponse,
    PromoteCoManagerRequest,
)
from app.services.fantasy_team_service import FantasyTeamService
from app.services.league_role_service import LeagueRoleService
from app.services.league_service import LeagueService

router = APIRouter()


@router.get("/{league_id}/roles", status_code=status.HTTP_200_OK)
async def list_league_roles(
    league_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100,
) -> dict[str, Any]:
    """List all roles in a league.

    Only league members can view roles.
    """
    # Check if user is a member
    is_member = await LeagueRoleService.is_member(db, league_id, current_user.id)
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member to view league roles",
        )

    roles = await LeagueRoleService.get_league_roles(
        session=db,
        league_id=league_id,
        skip=skip,
        limit=limit,
    )

    total = len(roles)
    items = [LeagueRoleResponse.model_validate(role) for role in roles[skip : skip + limit]]

    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit,
    }


@router.post("/{league_id}/roles/promote", status_code=status.HTTP_201_CREATED)
async def promote_to_co_manager(
    league_id: int,
    request: PromoteCoManagerRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LeagueRoleResponse:
    """Promote a user to co-manager role.

    Only the creator and co-managers can promote users.
    The promoted user must be a member of the league (must have a team).
    """
    # Verify league exists
    await LeagueService.get(db, league_id)

    # Check if user to promote is a member (has a team in the league)
    user_teams = await FantasyTeamService.get_user_teams(
        session=db,
        user_id=request.user_id,
        league_id=league_id,
    )

    if not user_teams:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot promote a user who is not a member of the league",
        )

    try:
        role = await LeagueRoleService.promote_to_co_manager(
            session=db,
            league_id=league_id,
            user_id=request.user_id,
            promoter_id=current_user.id,
        )
        return LeagueRoleResponse.model_validate(role)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.post("/{league_id}/roles/demote/{user_id}", status_code=status.HTTP_200_OK)
async def demote_to_member(
    league_id: int,
    user_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LeagueRoleResponse:
    """Demote a co-manager to member role.

    Only the creator can demote co-managers.
    """
    # Verify league exists
    await LeagueService.get(db, league_id)

    try:
        role = await LeagueRoleService.demote_to_member(
            session=db,
            league_id=league_id,
            user_id=user_id,
            demoter_id=current_user.id,
        )
        return LeagueRoleResponse.model_validate(role)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        ) from e


@router.get("/{league_id}/my-role", status_code=status.HTTP_200_OK)
async def get_my_role(
    league_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> LeagueRoleResponse | None:
    """Get current user's role in a league."""
    role = await LeagueRoleService.get_user_role(
        session=db,
        league_id=league_id,
        user_id=current_user.id,
    )

    if not role:
        # User is not a member of the league
        return None

    return LeagueRoleResponse.model_validate(role)
