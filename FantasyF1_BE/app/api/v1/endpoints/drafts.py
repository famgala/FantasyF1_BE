"""Draft API endpoints for F1 Fantasy game.

This module provides endpoints for managing the draft process,
including draft order, picks, and draft status.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.driver import Driver
from app.models.fantasy_team import FantasyTeam
from app.models.league import League
from app.models.user import User
from app.services.draft_service import DraftService

router = APIRouter()


@router.get("/{league_id}/draft-order", status_code=status.HTTP_200_OK)
async def get_draft_order(
    league_id: int,
    race_id: int = Query(..., description="Race ID for the draft"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # noqa: ARG001
) -> dict[str, Any]:
    """
    Get the draft order for a league and race.

    - **league_id**: ID of the league
    - **race_id**: ID of the race
    """
    # Verify league exists
    league_result = await db.execute(select(League).where(League.id == league_id))
    league = league_result.scalar_one_or_none()

    if not league:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"League {league_id} not found",
        )

    try:
        # Get draft order
        draft_order = await DraftService.get_draft_order(db, league_id=league_id, race_id=race_id)

        import json

        order_list = json.loads(draft_order.order_data)

        # Format response with team information
        order_data = []
        for i, team_id in enumerate(order_list):
            team_result = await db.execute(
                select(FantasyTeam.id, FantasyTeam.name, FantasyTeam.user_id).where(
                    FantasyTeam.id == team_id
                )
            )
            team = team_result.fetchone()

            order_data.append(
                {
                    "draft_order_number": i + 1,
                    "team_id": team_id,
                    "team_name": team[1] if team else "Unknown",
                    "user_id": team[2] if team else None,
                }
            )

        return {
            "league_id": league_id,
            "race_id": race_id,
            "draft_method": draft_order.draft_method,
            "draft_orders": order_data,
        }
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.post("/{league_id}/draft-order/create", status_code=status.HTTP_201_CREATED)
async def create_draft_order(
    league_id: int,
    race_id: int = Query(..., description="Race ID for the draft"),
    draft_method: str = Query(
        default="random", description="Draft method (random, sequential, snake)"
    ),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Create a draft order for a league and race.

    - **league_id**: ID of the league
    - **race_id**: ID of the race
    - **draft_method**: Draft method (random, sequential, snake)
    """
    # Verify league exists and user is the creator
    league_result = await db.execute(select(League.creator_id).where(League.id == league_id))
    creator_id = league_result.scalar_one_or_none()

    if creator_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"League {league_id} not found",
        )

    if creator_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only league creator can create draft order",
        )

    try:
        draft_order = await DraftService.create_draft_order(
            db,
            league_id=league_id,
            race_id=race_id,
            draft_method=draft_method,
            user_id=current_user.id,
        )

        import json

        order_list = json.loads(draft_order.order_data)

        order_data = [{"team_id": team_id, "order": i + 1} for i, team_id in enumerate(order_list)]

        return {
            "message": "Draft order created successfully",
            "league_id": league_id,
            "race_id": race_id,
            "draft_method": draft_order.draft_method,
            "draft_orders": order_data,
        }
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        ) from e


@router.get("/{league_id}/draft-picks", status_code=status.HTTP_200_OK)
async def get_draft_picks(
    league_id: int,
    race_id: int = Query(..., description="Race ID for the draft"),
    team_id: int | None = Query(None, description="Filter by team ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # noqa: ARG001
) -> dict[str, Any]:
    """
    Get draft picks for a league and race.

    - **league_id**: ID of the league
    - **race_id**: ID of the race
    - **team_id**: Optional team ID to filter by
    """
    # Verify league exists
    league_result = await db.execute(select(League.id).where(League.id == league_id))
    if not league_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"League {league_id} not found",
        )

    try:
        # Get draft picks
        picks = await DraftService.get_draft_picks(
            db, league_id=league_id, race_id=race_id, fantasy_team_id=team_id
        )

        # Get driver information for all picks
        driver_ids = [pick.driver_id for pick in picks if pick.driver_id]
        drivers_dict = {}

        if driver_ids:
            driver_result = await db.execute(select(Driver).where(Driver.id.in_(driver_ids)))
            drivers = driver_result.scalars().all()
            drivers_dict = {driver.id: driver for driver in drivers}

        # Format response
        picks_data = []
        for pick in picks:
            driver = drivers_dict.get(pick.driver_id)
            picks_data.append(
                {
                    "draft_pick_id": pick.id,
                    "team_id": pick.fantasy_team_id,
                    "round_number": pick.pick_round,
                    "pick_number": pick.pick_number,
                    "draft_position": pick.draft_position,
                    "driver_id": pick.driver_id,
                    "driver": {
                        "id": driver.id,
                        "name": driver.name,
                        "number": driver.number,
                        "code": driver.code,
                        "team_name": driver.team_name,
                        "price": driver.price,
                        "total_points": driver.total_points,
                    }
                    if driver
                    else None,
                    "is_auto_pick": pick.is_auto_pick,
                    "picked_at": pick.picked_at,
                }
            )

        return {
            "league_id": league_id,
            "race_id": race_id,
            "team_id": team_id,
            "draft_picks": picks_data,
        }
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e


@router.post("/{league_id}/draft-picks", status_code=status.HTTP_201_CREATED)
async def make_draft_pick(
    league_id: int,
    race_id: int = Query(..., description="Race ID for the draft"),
    driver_id: int = Query(..., description="ID of the driver to draft"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """
    Make a draft pick for the current user's team in a league.

    - **league_id**: ID of the league
    - **race_id**: ID of the race
    - **driver_id**: ID of the driver to draft
    """
    # Get user's team in this league
    team_result = await db.execute(
        select(FantasyTeam.id).where(
            (FantasyTeam.user_id == current_user.id) & (FantasyTeam.league_id == league_id)
        )
    )
    team_data = team_result.scalar_one_or_none()

    if not team_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You don't have a team in this league",
        )

    team_id = team_data

    try:
        pick = await DraftService.make_draft_pick(
            db,
            league_id=league_id,
            race_id=race_id,
            fantasy_team_id=team_id,
            driver_id=driver_id,
            user_id=current_user.id,
        )

        # Get driver info
        driver_result = await db.execute(select(Driver).where(Driver.id == pick.driver_id))
        driver = driver_result.scalar_one_or_none()

        return {
            "message": "Draft pick made successfully",
            "draft_pick": {
                "id": pick.id,
                "team_id": pick.fantasy_team_id,
                "round_number": pick.pick_round,
                "pick_number": pick.pick_number,
                "draft_position": pick.draft_position,
                "driver": {
                    "id": driver.id,
                    "name": driver.name,
                    "number": driver.number,
                    "code": driver.code,
                    "team_name": driver.team_name,
                    "price": driver.price,
                    "total_points": driver.total_points,
                }
                if driver
                else None,
                "is_auto_pick": pick.is_auto_pick,
                "picked_at": pick.picked_at,
            },
        }
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except (NotFoundError, ConflictError) as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        ) from e


@router.get("/{league_id}/draft-status", status_code=status.HTTP_200_OK)
async def get_draft_status(
    league_id: int,
    race_id: int = Query(..., description="Race ID for the draft"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # noqa: ARG001
) -> dict[str, Any]:
    """
    Get draft status and current turn for a league.

    - **league_id**: ID of the league
    - **race_id**: ID of the race
    """
    # Verify league exists
    league_result = await db.execute(
        select(League.id, League.draft_method).where(League.id == league_id)
    )
    league_data = league_result.scalar_one_or_none()

    if not league_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"League {league_id} not found",
        )

    draft_method = league_data[1]

    try:
        # Get next pick info
        next_pick = await DraftService.get_next_pick_info(db, league_id=league_id, race_id=race_id)

        # Get all teams in league
        teams_result = await db.execute(
            select(FantasyTeam.id, FantasyTeam.name, FantasyTeam.user_id).where(
                FantasyTeam.league_id == league_id
            )
        )
        teams = teams_result.fetchall()

        team_count = len(teams)

        # Get existing draft picks
        picks = await DraftService.get_draft_picks(db, league_id=league_id, race_id=race_id)
        picks_count = len(picks)

        # Calculate if draft is complete
        if next_pick is None:
            is_draft_complete = True
            current_round = 5
            current_position = team_count
            current_team = None
        else:
            is_draft_complete = False
            current_round = next_pick["pick_round"]
            current_position = next_pick["draft_position"]
            current_team_id = next_pick["fantasy_team_id"]

            # Get current team info
            team_result = await db.execute(
                select(FantasyTeam).where(FantasyTeam.id == current_team_id)
            )
            current_team_obj = team_result.scalar_one_or_none()

            if current_team_obj:
                current_team = {
                    "id": current_team_obj.id,
                    "name": current_team_obj.name,
                    "user_id": current_team_obj.user_id,
                }
            else:
                current_team = None

        return {
            "league_id": league_id,
            "race_id": race_id,
            "draft_method": draft_method,
            "is_draft_complete": is_draft_complete,
            "total_teams": team_count,
            "total_picks_made": picks_count,
            "current_round": current_round,
            "current_position": current_position,
            "current_team": current_team,
            "next_pick": next_pick,
        }
    except NotFoundError:
        # Draft may not have been started yet
        teams_result = await db.execute(
            select(FantasyTeam.id, FantasyTeam.name, FantasyTeam.user_id).where(
                FantasyTeam.league_id == league_id
            )
        )
        teams = teams_result.fetchall()

        return {
            "league_id": league_id,
            "race_id": race_id,
            "draft_method": draft_method,
            "is_draft_complete": False,
            "total_teams": len(teams),
            "total_picks_made": 0,
            "current_round": 1,
            "current_position": 1,
            "current_team": None,
            "next_pick": None,
        }


@router.get("/{league_id}/available-drivers", status_code=status.HTTP_200_OK)
async def get_available_drivers(
    league_id: int,
    race_id: int = Query(..., description="Race ID for the draft"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # noqa: ARG001
) -> dict[str, Any]:
    """
    Get all available drivers for a draft.

    - **league_id**: ID of the league
    - **race_id**: ID of the race
    """
    # Verify league exists
    league_result = await db.execute(select(League.id).where(League.id == league_id))
    if not league_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"League {league_id} not found",
        )

    try:
        # Get available drivers
        drivers = await DraftService.get_available_drivers(db, league_id=league_id, race_id=race_id)

        # Format response
        drivers_data = []
        for driver in drivers:
            drivers_data.append(
                {
                    "id": driver.id,
                    "name": driver.name,
                    "number": driver.number,
                    "code": driver.code,
                    "team_name": driver.team_name,
                    "price": driver.price,
                    "total_points": driver.total_points,
                }
            )

        return {
            "league_id": league_id,
            "race_id": race_id,
            "available_drivers": drivers_data,
        }
    except NotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        ) from e
