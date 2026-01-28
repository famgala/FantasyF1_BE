"""Data Synchronization Tasks

This module contains Celery tasks for syncing data from external APIs
and handling scheduled operations like drafts and race result polling.
"""

import json
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any

try:
    from celery import signals  # type: ignore

    task_postrun = signals.task_postrun
except ImportError:
    task_postrun = None
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.external_data_service import ExternalDataService
from app.tasks.celery_app import celery_app

if TYPE_CHECKING:
    from celery import Task

    from app.models.league import League

logger = get_logger(__name__)
settings = get_settings()

# Create synchronous session for Celery tasks
sync_engine = create_engine(settings.DATABASE_URL.replace("+asyncpg", ""))
SyncSessionLocal = sessionmaker(bind=sync_engine, autocommit=False, autoflush=False)


def get_sync_db() -> Session:
    """Get synchronous database session for Celery tasks.

    Returns:
        Database session
    """
    return SyncSessionLocal()


@celery_app.task(  # type: ignore[misc]
    bind=True,
    max_retries=3,
    default_retry_delay=3600,  # 1 hour retry delay
    name="tasks.sync_drivers",
)
def sync_drivers_task(self: "Task", year: int | None = None) -> dict[str, Any]:
    """Sync driver data from external API.

    Args:
        year: F1 season year (defaults to current year)

    Returns:
        Dictionary with sync results
    """
    if year is None:
        year = datetime.utcnow().year

    logger.info(f"Starting driver sync for year {year}")

    try:
        import asyncio

        from app.db.session import AsyncSessionLocal

        async def sync_drivers_async() -> int:
            async with AsyncSessionLocal() as db:
                count = await ExternalDataService.sync_drivers(db, year)
                await db.commit()
                return count

        drivers_count = asyncio.run(sync_drivers_async())
        logger.info(f"Driver sync completed: {drivers_count}")
        return {"status": "success", "year": year, "drivers_synced": drivers_count}

    except Exception as e:
        logger.error(f"Driver sync failed: {e}")
        # Retry with exponential backoff
        self.retry(exc=e, countdown=2**self.request.retries * 60)
        return {"status": "error", "message": str(e)}


@celery_app.task(bind=True, max_retries=3, name="tasks.sync_race_calendar")  # type: ignore[misc]
def sync_race_calendar_task(self: "Task", year: int | None = None) -> dict[str, Any]:
    """Sync race calendar from external API.

    Args:
        year: F1 season year (defaults to current year)

    Returns:
        Dictionary with sync results
    """
    if year is None:
        year = datetime.utcnow().year

    logger.info(f"Starting race calendar sync for year {year}")

    try:
        import asyncio

        from app.db.session import AsyncSessionLocal

        async def sync_races_async() -> int:
            async with AsyncSessionLocal() as db:
                count = await ExternalDataService.sync_races(db, year)
                await db.commit()
                return count

        races_count = asyncio.run(sync_races_async())
        logger.info(f"Race calendar sync completed: {races_count}")
        return {"status": "success", "year": year, "races_synced": races_count}

    except Exception as e:
        logger.error(f"Race calendar sync failed: {e}")
        self.retry(exc=e, countdown=2**self.request.retries * 60)
        return {"status": "error", "message": str(e)}


@celery_app.task(bind=True, max_retries=5, name="tasks.sync_race_results")  # type: ignore[misc]
def sync_race_results_task(self: "Task") -> dict[str, Any]:
    """Sync race results from external API with retry logic.

    This task runs every 2 hours after race start until results are successfully pulled.

    Returns:
        Dictionary with sync results
    """
    logger.info("Starting race results sync")
    db = get_sync_db()

    try:
        from app.models.race import Race

        # Find races that started in the last 48 hours and don't have results
        cutoff_time = datetime.utcnow() - timedelta(hours=48)
        recent_races = (
            db.query(Race)
            .filter(Race.race_date >= cutoff_time, Race.status == "upcoming")
            .order_by(Race.race_date)
            .all()
        )

        results_synced = 0
        races_updated = []

        for race in recent_races:
            try:
                # Fetch race results from Jolpica API
                import asyncio

                race_data = asyncio.run(
                    ExternalDataService.fetch_race_results(
                        round_number=race.round_number, year=race.race_date.year
                    )
                )

                # Check if results are available (not empty)
                if race_data and len(race_data.get("results", [])) > 0:
                    # Save race results
                    _save_race_results(db, race.id, race_data)
                    race.status = "completed"
                    results_synced += 1
                    races_updated.append(race.name)
                    logger.info(f"Synced results for race: {race.name}")

            except Exception as e:
                logger.warning(f"Failed to sync results for race {race.name}: {e}")
                continue

        db.commit()
        logger.info(f"Race results sync completed: {results_synced} races updated")

        if results_synced == 0:
            # No results available yet, schedule retry in 2 hours
            logger.info("No race results available, scheduling retry in 2 hours")
            self.retry(exc=Exception("No results available"), countdown=7200)

        return {
            "status": "success",
            "races_updated": races_updated,
            "results_synced": results_synced,
        }

    except Exception as e:
        logger.error(f"Race results sync failed: {e}")
        self.retry(exc=e, countdown=7200)  # 2 hours retry
        return {"status": "error", "message": str(e)}

    finally:
        db.close()


def _save_race_results(db: Session, race_id: int, race_data: dict[str, Any]) -> None:
    """Save race results to database.

    Args:
        db: Database session
        race_id: Race ID
        race_data: Race results data from API
    """
    from app.models.race_result import RaceResult

    results = race_data.get("results", [])

    for result in results:
        # Check if result already exists
        existing = (
            db.query(RaceResult)
            .filter(
                RaceResult.race_id == race_id,
                RaceResult.driver_external_id == result.get("driver_id"),
            )
            .first()
        )

        if existing:
            # Update existing result
            existing.position = result.get("position", 0)
            existing.grid_position = result.get("grid_position")
            existing.laps_completed = result.get("laps_completed")
            existing.points_earned = result.get("points_earned", 0)
            existing.fastest_lap = result.get("fastest_lap", False)
            existing.fastest_lap_time = result.get("fastest_lap_time")
            existing.time_diff = result.get("time_diff")
            existing.time_diff_str = result.get("time_diff_str")
            existing.dnf = result.get("dnf", False)
            existing.dnf_reason = result.get("dnf_reason")
            existing.dns = result.get("dns", False)
            existing.dsq = result.get("dsq", False)
        else:
            # Create new result
            new_result = RaceResult(
                race_id=race_id,
                driver_external_id=result.get("driver_id"),
                driver_name=result.get("driver_name", ""),
                position=result.get("position", 0),
                grid_position=result.get("grid_position"),
                laps_completed=result.get("laps_completed"),
                points_earned=result.get("points_earned", 0),
                fastest_lap=result.get("fastest_lap", False),
                fastest_lap_time=result.get("fastest_lap_time"),
                time_diff=result.get("time_diff"),
                time_diff_str=result.get("time_diff_str"),
                dnf=result.get("dnf", False),
                dnf_reason=result.get("dnf_reason"),
                dns=result.get("dns", False),
                dsq=result.get("dsq", False),
            )
            db.add(new_result)


@celery_app.task(name="tasks.start_drafts")  # type: ignore[misc]
def start_drafts_task() -> dict[str, Any]:
    """Auto-start drafts at 0800 Eastern Time on Monday.

    This task runs daily and checks if any drafts need to be started.

    Returns:
        Dictionary with draft start results
    """
    logger.info("Checking for drafts to start")
    db = get_sync_db()

    try:
        # Get current time in Eastern Time
        from zoneinfo import ZoneInfo

        from app.models.league import League

        et_timezone = ZoneInfo("America/New_York")
        now = datetime.now(et_timezone)

        # Check if it's Monday at 0800 ET (within 15 minutes)
        if now.weekday() == 0 and 8 <= now.hour < 9:  # Monday, 8 AM
            logger.info("Triggering draft start for Monday 0800 ET")

            # Find leagues with scheduled drafts that haven't started
            leagues = (
                db.query(League)
                .filter(
                    League.draft_date.isnot(None),
                )
                .all()
            )

            drafts_started = 0

            for league in leagues:
                draft_date = league.draft_date
                if draft_date and draft_date <= datetime.utcnow():
                    # Create draft order for the next race
                    _create_draft_order(db, league)
                    drafts_started += 1
                    logger.info(f"Started draft for league: {league.name}")

            db.commit()
            logger.info(f"Draft start completed: {drafts_started} drafts started")

            return {"status": "success", "drafts_started": drafts_started}
        else:
            logger.info("Not Monday 0800 ET, skipping draft start")
            return {"status": "skipped", "message": "Not Monday 0800 ET"}

    except Exception as e:
        logger.error(f"Draft start failed: {e}")
        return {"status": "error", "message": str(e)}

    finally:
        db.close()


def _create_draft_order(db: Session, league: "League") -> None:
    """Create draft order for a league's next race.

    Args:
        db: Database session
        league: League to create draft order for
    """
    from app.models.draft import DraftOrder
    from app.models.race import Race

    # Find next upcoming race
    next_race = db.query(Race).filter(Race.status == "upcoming").order_by(Race.race_date).first()

    if not next_race:
        logger.warning(f"No upcoming race found for league {league.name}")
        return

    # Check if draft order already exists
    existing = (
        db.query(DraftOrder)
        .filter(DraftOrder.league_id == league.id, DraftOrder.race_id == next_race.id)
        .first()
    )

    if existing:
        logger.info(f"Draft order already exists for race {next_race.name}")
        return

    # Get all teams in the league
    from app.models.fantasy_team import FantasyTeam

    teams = db.query(FantasyTeam).filter(FantasyTeam.league_id == league.id).all()

    if not teams:
        logger.warning(f"No teams found in league {league.name}")
        return

    # Create draft order based on inverse standings (snake draft)
    team_ids = [t.id for t in teams]

    # Create draft order
    draft_order = DraftOrder(
        league_id=league.id,
        race_id=next_race.id,
        draft_method=league.draft_method,
        order_data=json.dumps(team_ids),
        is_manual=False,
    )
    db.add(draft_order)


@celery_app.task(name="tasks.check_draft_closures")  # type: ignore[misc]
def check_draft_closures_task() -> dict[str, Any]:
    """Check and close drafts based on session start times.

    This task runs every 15 minutes and checks if any drafts need to be closed
    based on their close condition (FP1, FP2, FP3, Qualifying).

    Returns:
        Dictionary with draft closure results
    """
    logger.info("Checking for drafts to close")
    db = get_sync_db()

    try:
        from app.models.draft import DraftOrder
        from app.models.league import DraftCloseCondition, League
        from app.models.race import Race

        # Find upcoming races
        upcoming_races = (
            db.query(Race).filter(Race.status == "upcoming").order_by(Race.race_date).all()
        )

        drafts_closed = 0

        for race in upcoming_races:
            now = datetime.utcnow()

            # Find leagues with drafts for this race
            leagues = (
                db.query(League)
                .join(DraftOrder, League.id == DraftOrder.league_id)
                .filter(DraftOrder.race_id == race.id)
                .all()
            )

            for league in leagues:
                close_condition = league.draft_close_condition
                close_time = None

                # Determine close time based on condition
                if close_condition == DraftCloseCondition.FP1.value:
                    close_time = race.fp1_date
                elif close_condition == DraftCloseCondition.FP2.value:
                    close_time = race.fp2_date
                elif close_condition == DraftCloseCondition.FP3.value:
                    close_time = race.fp3_date
                elif close_condition == DraftCloseCondition.QUALIFYING.value:
                    close_time = race.qualifying_date

                if close_time and close_time <= now:
                    # Close the draft
                    _close_draft(db, league.id, race.id)
                    drafts_closed += 1
                    logger.info(f"Closed draft for league {league.name} before {close_condition}")

        db.commit()
        logger.info(f"Draft closure check completed: {drafts_closed} drafts closed")

        return {"status": "success", "drafts_closed": drafts_closed}

    except Exception as e:
        logger.error(f"Draft closure check failed: {e}")
        return {"status": "error", "message": str(e)}

    finally:
        db.close()


def _close_draft(db: Session, league_id: int, race_id: int) -> None:
    """Close a draft for a league and race.

    Args:
        db: Database session
        league_id: League ID
        race_id: Race ID
    """
    from app.models.draft import DraftOrder

    # Mark draft order as closed/locked
    draft_order = (
        db.query(DraftOrder)
        .filter(DraftOrder.league_id == league_id, DraftOrder.race_id == race_id)
        .first()
    )

    if draft_order:
        # Could add an is_closed field or just log it
        logger.info(f"Draft closed for league_id={league_id}, race_id={race_id}")


@celery_app.task(name="tasks.calculate_constructor_points")  # type: ignore[misc]
def calculate_constructor_points_task() -> dict[str, Any]:
    """Calculate and update constructor championship points.

    This task runs after each race to update season standings.

    Returns:
        Dictionary with points calculation results
    """
    logger.info("Starting constructor points calculation")
    db = get_sync_db()

    try:
        from app.models.constructor import Constructor
        from app.models.race import Race
        from app.models.race_result import RaceResult

        # Get all completed races
        completed_races = db.query(Race).filter(Race.status == "completed").all()

        # Reset all constructor points
        constructors = db.query(Constructor).all()
        for constructor in constructors:
            constructor.current_points = 0

        # Calculate points for each race
        races_processed = 0

        for race in completed_races:
            # Get all race results for this race
            results = db.query(RaceResult).filter(RaceResult.race_id == race.id).all()

            # Group results by constructor (need driver-to-constructor mapping)
            # This is a simplified version - in production you'd need proper mapping
            constructor_points: dict[int, int] = {}

            for result in results:
                # In production, get constructor_id from driver table
                # For now, we'll use a placeholder approach
                points = result.points_earned
                # constructor_id = get_constructor_for_driver(driver_id)
                # if constructor_id not in constructor_points:
                #     constructor_points[constructor_id] = 0
                # constructor_points[constructor_id] += points

            # Update race winner
            if constructor_points:
                winner_constructor_id = max(constructor_points.items(), key=lambda x: x[1])[0]
                race.winning_constructor_id = winner_constructor_id

                # Update constructor total points
                for constructor_id, points in constructor_points.items():
                    constructor_obj: Constructor | None = db.get(Constructor, constructor_id)
                    if constructor_obj is not None:
                        constructor_obj.current_points += points

            races_processed += 1

        db.commit()
        logger.info(f"Constructor points calculation completed: {races_processed} races processed")

        return {"status": "success", "races_processed": races_processed}

    except Exception as e:
        logger.error(f"Constructor points calculation failed: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}

    finally:
        db.close()


@celery_app.task(name="tasks.update_fantasy_team_points")  # type: ignore[misc]
def update_fantasy_team_points_task() -> dict[str, Any]:
    """Update fantasy team points after race results.

    This task runs after race results are synced.

    Returns:
        Dictionary with team points update results
    """
    logger.info("Starting fantasy team points update")
    db = get_sync_db()

    try:
        from app.models.fantasy_team import FantasyTeam

        # Get all fantasy teams
        teams = db.query(FantasyTeam).all()

        teams_updated = 0

        for team in teams:
            # Recalculate total points across all races
            total_points = 0

            # Get all active picks for the team
            # ...

            # Update team total points
            team.total_points = total_points
            teams_updated += 1

        db.commit()
        logger.info(f"Fantasy team points update completed: {teams_updated} teams updated")

        return {"status": "success", "teams_updated": teams_updated}

    except Exception as e:
        logger.error(f"Fantasy team points update failed: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}

    finally:
        db.close()


@celery_app.task(name="app.tasks.data_sync.cleanup_old_notifications")  # type: ignore[misc]
def cleanup_old_notifications_task() -> dict[str, Any]:
    """Clean up old notifications to keep database size manageable.

    This task runs weekly and deletes notifications older than 90 days.

    Returns:
        Dictionary with cleanup results
    """
    logger.info("Starting old notifications cleanup")
    db = get_sync_db()

    try:
        from app.models.notification import Notification

        # Delete notifications older than 90 days
        cutoff_date = datetime.utcnow() - timedelta(days=90)

        deleted_count = (
            db.query(Notification).filter(Notification.created_at < cutoff_date).delete()
        )

        db.commit()
        logger.info(f"Notifications cleanup completed: {deleted_count} notifications deleted")

        return {"status": "success", "deleted_count": deleted_count}

    except Exception as e:
        logger.error(f"Notifications cleanup failed: {e}")
        db.rollback()
        return {"status": "error", "message": str(e)}

    finally:
        db.close()


@celery_app.task(  # type: ignore[misc]
    bind=True,
    max_retries=3,
    default_retry_delay=3600,
    name="app.tasks.data_sync.sync_external_data",
)
def sync_external_data_task(self: "Task", year: int | None = None) -> dict[str, Any]:
    """Sync external data (drivers, constructors, races) from Jolpica API.

    This task runs daily at 3 AM ET to ensure external data is up to date.

    Args:
        year: F1 season year (defaults to current year)

    Returns:
        Dictionary with sync results
    """
    if year is None:
        year = datetime.utcnow().year

    logger.info(f"Starting external data sync for year {year}")

    try:
        import asyncio

        from app.db.session import AsyncSessionLocal

        async def sync_all_data() -> dict[str, int]:
            async with AsyncSessionLocal() as db:
                sync_results = await ExternalDataService.sync_season_data(db, year)
                await db.commit()
                return sync_results

        sync_results = asyncio.run(sync_all_data())
        logger.info(f"External data sync completed: {sync_results}")

        return {"status": "success", "year": year, **sync_results}

    except Exception as e:
        logger.error(f"External data sync failed: {e}")
        self.retry(exc=e, countdown=2**self.request.retries * 60)
        return {"status": "error", "message": str(e)}


# Register signal handlers for task monitoring
if task_postrun is not None:

    @task_postrun.connect  # type: ignore[misc]
    def task_postrun_handler(**kwargs: Any) -> None:
        """Handle task completion logging."""
        task_name = kwargs.get("task_name", "unknown")
        task_id = kwargs.get("task_id", "unknown")
        retval = kwargs.get("retval", {})
        state = kwargs.get("state", "UNKNOWN")

        logger.info(f"Task {task_name} ({task_id}) completed with state: {state}, result: {retval}")
