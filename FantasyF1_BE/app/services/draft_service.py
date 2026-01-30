"""Draft service for F1 Fantasy game.

This service handles the draft process where teams select drivers in a league,
including draft order generation, pick management, and auto-picking.
"""

import json
from typing import Any

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.models.draft import DraftOrder, DraftPick
from app.models.driver import Driver
from app.models.fantasy_team import FantasyTeam
from app.models.league import League
from app.models.race import Race


class DraftService:
    """Service for managing fantasy drafts."""

    @staticmethod
    async def create_draft_order(
        session: AsyncSession,
        league_id: int,
        race_id: int,
        draft_method: str = "sequential",
        order_list: list[int] | None = None,
        user_id: int | None = None,
    ) -> DraftOrder:
        """Create a draft order for a league and race.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: ID of the race
            draft_method: Draft method ("sequential", "snake", "random")
            order_list: List of fantasy team IDs in draft order
            user_id: ID of the user creating the draft

        Returns:
            Created DraftOrder instance

        Raises:
            NotFoundError: If league, race, or teams not found
            ValidationError: If invalid draft method or order list
        """
        # Validate draft method
        if draft_method not in ["sequential", "snake", "random"]:
            raise ValidationError("Invalid draft method")

        # Check if league exists
        league_query = select(League).where(League.id == league_id)
        result = await session.execute(league_query)
        league = result.scalar_one_or_none()

        if not league:
            raise NotFoundError(f"League {league_id} not found")

        # Check if race exists
        race_query = select(Race).where(Race.id == race_id)
        result = await session.execute(race_query)
        race = result.scalar_one_or_none()

        if not race:
            raise NotFoundError(f"Race {race_id} not found")

        # Get all active fantasy teams in the league
        teams_query = select(FantasyTeam).where(
            and_(
                FantasyTeam.league_id == league_id,
                FantasyTeam.is_active,
            )
        )
        result = await session.execute(teams_query)
        teams = result.scalars().all()

        if not teams:
            raise ValidationError("No active teams in league")

        # Generate or validate order list
        team_count = len(teams)
        if order_list is None:
            # Generate order based on draft method
            if draft_method == "random":
                import random

                team_ids = [team.id for team in teams]
                random.shuffle(team_ids)
                order_list = team_ids
            else:
                # For sequential and snake, default to team creation order
                order_list = [team.id for team in teams]
        else:
            # Validate order list
            if len(order_list) != team_count:
                raise ValidationError("Order list length must match team count")

            # Verify all team IDs are valid
            valid_team_ids = {team.id for team in teams}
            if not set(order_list).issubset(valid_team_ids):
                raise ValidationError("Order list contains invalid team IDs")

        # Check if draft order already exists
        existing_query = select(DraftOrder).where(
            and_(
                DraftOrder.league_id == league_id,
                DraftOrder.race_id == race_id,
            )
        )
        result = await session.execute(existing_query)
        existing_order = result.scalar_one_or_none()

        if existing_order:
            raise ConflictError("Draft order already exists for this league and race")

        # Create draft order
        draft_order = DraftOrder(
            league_id=league_id,
            race_id=race_id,
            draft_method=draft_method,
            order_data=json.dumps(order_list),
            is_manual=(order_list is not None),
            last_modified_by=user_id,
        )

        session.add(draft_order)
        await session.commit()
        await session.refresh(draft_order)

        return draft_order

    @staticmethod
    async def get_draft_order(
        session: AsyncSession,
        league_id: int,
        race_id: int,
    ) -> DraftOrder:
        """Get the draft order for a league and race.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: ID of the race

        Returns:
            DraftOrder instance

        Raises:
            NotFoundError: If draft order not found
        """
        query = select(DraftOrder).where(
            and_(
                DraftOrder.league_id == league_id,
                DraftOrder.race_id == race_id,
            )
        )
        result = await session.execute(query)
        draft_order = result.scalar_one_or_none()

        if not draft_order:
            raise NotFoundError(f"Draft order not found for league {league_id} and race {race_id}")

        return draft_order

    @staticmethod
    async def make_draft_pick(
        session: AsyncSession,
        league_id: int,
        race_id: int,
        fantasy_team_id: int,
        driver_id: int,
        user_id: int | None = None,
    ) -> DraftPick:
        """Make a draft pick for a team.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: ID of the race
            fantasy_team_id: ID of the fantasy team making the pick
            driver_id: ID of the driver being picked
            user_id: ID of the user making the pick

        Returns:
            Created DraftPick instance

        Raises:
            NotFoundError: If league, race, team, or driver not found
            ValidationError: If pick is invalid or driver already picked
            ConflictError: If it's not this team's turn to pick
        """
        # Get draft order
        draft_order = await DraftService.get_draft_order(session, league_id, race_id)
        order_list = json.loads(draft_order.order_data)

        # Validate team is in the draft order
        if fantasy_team_id not in order_list:
            raise ValidationError("Team is not in the draft order")

        # Check if driver exists and is not already picked
        driver_query = select(Driver).where(Driver.id == driver_id)
        result = await session.execute(driver_query)
        driver = result.scalar_one_or_none()

        if not driver:
            raise NotFoundError(f"Driver {driver_id} not found")

        # Check if driver is already picked in this draft
        existing_pick_query = select(DraftPick).where(
            and_(
                DraftPick.league_id == league_id,
                DraftPick.race_id == race_id,
                DraftPick.driver_id == driver_id,
            )
        )
        result = await session.execute(existing_pick_query)
        existing_pick = result.scalar_one_or_none()

        if existing_pick:
            raise ConflictError(f"Driver {driver_id} has already been picked")

        # Get current pick number
        count_query = select(func.count(DraftPick.id)).where(
            and_(
                DraftPick.league_id == league_id,
                DraftPick.race_id == race_id,
            )
        )
        result = await session.execute(count_query)
        scalar_result = result.scalar()
        pick_count = 0 if scalar_result is None else int(scalar_result)  # type: ignore[arg-type, call-overload]

        # Determine draft position based on order list and count
        draft_position = pick_count % len(order_list)
        current_team = order_list[draft_position]

        # Verify it's this team's turn
        if current_team != fantasy_team_id:
            raise ValidationError(f"It's not team {fantasy_team_id}'s turn to pick")

        # Determine pick round
        pick_round = (pick_count // len(order_list)) + 1

        # Create draft pick
        draft_pick = DraftPick(
            league_id=league_id,
            race_id=race_id,
            fantasy_team_id=fantasy_team_id,
            driver_id=driver_id,
            pick_number=pick_count + 1,
            pick_round=pick_round,
            draft_position=draft_position + 1,  # 1-indexed for display
            is_auto_pick=(user_id is None),
        )

        session.add(draft_pick)
        await session.commit()
        await session.refresh(draft_pick)

        return draft_pick

    @staticmethod
    async def make_auto_pick(
        session: AsyncSession,
        league_id: int,
        race_id: int,
    ) -> DraftPick | None:
        """Make an automatic pick for the next team in line.

        This is used when a team doesn't pick within their time limit,
        and the system auto-picks for them based on some strategy.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: ID of the race

        Returns:
            Created DraftPick instance, or None if no picks remaining
        """
        # Get draft order
        draft_order = await DraftService.get_draft_order(session, league_id, race_id)
        order_list = json.loads(draft_order.order_data)

        # Get current pick number
        count_query = select(func.count(DraftPick.id)).where(
            and_(
                DraftPick.league_id == league_id,
                DraftPick.race_id == race_id,
            )
        )
        result = await session.execute(count_query)
        scalar_val = result.scalar()
        pick_count = 0 if scalar_val is None else int(scalar_val)  # type: ignore[arg-type, call-overload]

        # Check if all picks are made
        total_teams = len(order_list)
        picks_per_round = total_teams
        total_picks_possible = picks_per_round * 5  # 5 rounds

        if pick_count >= total_picks_possible:
            return None  # All picks are made

        # Determine which team picks next
        draft_position = pick_count % total_teams
        fantasy_team_id = order_list[draft_position]

        # Get available drivers (not yet picked)
        picked_driver_ids_query = select(DraftPick.driver_id).where(
            and_(
                DraftPick.league_id == league_id,
                DraftPick.race_id == race_id,
            )
        )
        result = await session.execute(picked_driver_ids_query)
        picked_ids: list[int] = [
            int(did) for did in result.scalars().all() if did is not None  # type: ignore[arg-type, call-overload]
        ]

        # Get all available drivers (simple strategy: pick highest ID available)
        if picked_ids:
            available_drivers_query = (
                select(Driver.id)
                .where(Driver.id.not_in(picked_ids))
                .order_by(Driver.id.desc())
                .limit(1)
            )
        else:
            available_drivers_query = select(Driver.id).order_by(Driver.id.desc()).limit(1)

        result = await session.execute(available_drivers_query)
        available_driver_id = result.scalar_one_or_none()

        if not available_driver_id:
            return None  # No drivers available

        # Make the auto pick
        return await DraftService.make_draft_pick(
            session,
            league_id,
            race_id,
            fantasy_team_id,
            available_driver_id,
            user_id=None,  # Auto-pick has no user
        )

    @staticmethod
    async def get_draft_picks(
        session: AsyncSession,
        league_id: int,
        race_id: int,
        fantasy_team_id: int | None = None,
    ) -> list[DraftPick]:
        """Get all draft picks for a league and race.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: ID of the race
            fantasy_team_id: Optional team ID to filter by

        Returns:
            List of DraftPick instances
        """
        query = select(DraftPick).where(
            and_(
                DraftPick.league_id == league_id,
                DraftPick.race_id == race_id,
            )
        )

        if fantasy_team_id is not None:
            query = query.where(DraftPick.fantasy_team_id == fantasy_team_id)

        query = query.order_by(DraftPick.pick_number)

        result = await session.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_available_drivers(
        session: AsyncSession,
        league_id: int,
        race_id: int,
    ) -> list[Driver]:
        """Get all available drivers for a draft.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: ID of the race

        Returns:
            List of Driver instances
        """
        # Get already picked driver IDs
        picked_driver_ids_query = select(DraftPick.driver_id).where(
            and_(
                DraftPick.league_id == league_id,
                DraftPick.race_id == race_id,
            )
        )
        result = await session.execute(picked_driver_ids_query)
        picked_ids: list[int] = [
            int(did) for did in result.scalars().all() if did is not None  # type: ignore[arg-type, call-overload]
        ]

        # Get available drivers
        if picked_ids:
            drivers_query = select(Driver).where(Driver.id.not_in(picked_ids)).order_by(Driver.name)
        else:
            drivers_query = select(Driver).order_by(Driver.name)

        result = await session.execute(drivers_query)
        drivers = list(result.scalars().unique().all())
        return drivers  # type: ignore[return-value]

    @staticmethod
    async def get_next_pick_info(
        session: AsyncSession,
        league_id: int,
        race_id: int,
    ) -> dict[str, Any] | None:
        """Get information about the next pick to be made.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: ID of the race

        Returns:
            Dictionary with next pick information or None if draft is complete
        """
        # Get draft order
        draft_order = await DraftService.get_draft_order(session, league_id, race_id)
        order_list = json.loads(draft_order.order_data)

        # Get current pick count
        count_query = select(func.count(DraftPick.id)).where(
            and_(
                DraftPick.league_id == league_id,
                DraftPick.race_id == race_id,
            )
        )
        result = await session.execute(count_query)
        scalar_result = result.scalar()
        pick_count = scalar_result if isinstance(scalar_result, int) else 0

        # Check if draft is complete
        total_teams = len(order_list)
        total_picks_possible = total_teams * 5  # 5 rounds

        if pick_count >= total_picks_possible:
            return None  # Draft is complete

        # Determine next pick info
        draft_position = pick_count % total_teams
        fantasy_team_id = order_list[draft_position]
        pick_round = (pick_count // total_teams) + 1
        pick_number = pick_count + 1

        return {
            "league_id": league_id,
            "race_id": race_id,
            "fantasy_team_id": fantasy_team_id,
            "pick_round": pick_round,
            "pick_number": pick_number,
            "draft_position": draft_position + 1,
            "order_list": order_list,
            "picks_remaining": total_picks_possible - pick_count,
        }

    @staticmethod
    async def get_team_draft_summary(
        session: AsyncSession,
        league_id: int,
        race_id: int,
        fantasy_team_id: int,
    ) -> dict[str, Any]:
        """Get a summary of a team's draft picks.

        Args:
            session: Database session
            league_id: ID of the league
            race_id: ID of the race
            fantasy_team_id: ID of the fantasy team

        Returns:
            Dictionary with draft summary
        """
        # Get team's picks
        picks = await DraftService.get_draft_picks(session, league_id, race_id, fantasy_team_id)

        driver_ids = [pick.driver_id for pick in picks]

        # Get driver details
        if driver_ids:
            drivers_query = select(Driver).where(Driver.id.in_(driver_ids))
            result = await session.execute(drivers_query)
            drivers_list = result.scalars().all()
            drivers_dict = {driver.id: driver for driver in drivers_list}
        else:
            drivers_dict = {}

        picks_summary = []
        for pick in picks:
            driver = drivers_dict.get(pick.driver_id)
            picks_summary.append(
                {
                    "pick_number": pick.pick_number,
                    "round": pick.pick_round,
                    "draft_position": pick.draft_position,
                    "driver_id": pick.driver_id,
                    "driver_name": driver.name if driver else "Unknown",
                    "is_auto_pick": pick.is_auto_pick,
                    "picked_at": pick.picked_at.isoformat() if pick.picked_at else None,
                }
            )

        return {
            "fantasy_team_id": fantasy_team_id,
            "league_id": league_id,
            "race_id": race_id,
            "total_picks": len(picks),
            "picks": picks_summary,
        }
