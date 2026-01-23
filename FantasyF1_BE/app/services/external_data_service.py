"""Service for integrating with external F1 data from Jolpica API.

This service handles fetching and syncing data from the Jolpica F1 API
(https://jolpica.f1jersey.com/docs) to keep our database up-to-date
with current F1 season data.
"""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.driver_service import DriverService
from app.services.race_service import RaceService

logger = get_logger(__name__)
settings = get_settings()


class ExternalDataService:
    """Service for fetching data from Jolpica F1 API.

    The Jolpica API provides comprehensive F1 data including:
    - Driver information and statistics
    - Race schedules and results
    - Season details
    - Circuit information
    """

    JOLPICA_BASE_URL = "https://api.jolpica.f1"

    @staticmethod
    async def _get_session() -> httpx.AsyncClient:
        """Get HTTP client for API requests.

        Returns:
            Async HTTP client configured for API requests
        """
        client = httpx.AsyncClient(
            timeout=30.0,
            headers={"User-Agent": f"FantasyF1/{settings.APP_NAME}"},
        )
        return client

    @staticmethod
    async def fetch_drivers(year: int) -> list[dict]:
        """Fetch drivers from Jolpica API for a specific year.

        Args:
            year: F1 season year (e.g., 2024)

        Returns:
            List of driver data from API

        Raises:
            httpx.HTTPError: If API request fails
        """
        async with await ExternalDataService._get_session() as client:
            logger.info(f"Fetching drivers for year {year}")
            response = await client.get(f"{ExternalDataService.JOLPICA_BASE_URL}/drivers/{year}")
            response.raise_for_status()
            data: list[dict] = response.json()
            logger.info(f"Fetched {len(data)} drivers for year {year}")
            return data

    @staticmethod
    async def fetch_races(year: int) -> list[dict]:
        """Fetch race schedule from Jolpica API for a specific year.

        Args:
            year: F1 season year (e.g., 2024)

        Returns:
            List of race data from API

        Raises:
            httpx.HTTPError: If API request fails
        """
        async with await ExternalDataService._get_session() as client:
            logger.info(f"Fetching races for year {year}")
            response = await client.get(f"{ExternalDataService.JOLPICA_BASE_URL}/races/{year}")
            response.raise_for_status()
            data: list[dict] = response.json()
            logger.info(f"Fetched {len(data)} races for year {year}")
            return data

    @staticmethod
    async def fetch_race_results(year: int, round_number: int) -> dict:
        """Fetch race results from Jolpica API.

        Args:
            year: F1 season year (e.g., 2024)
            round_number: Race round number

        Returns:
            Race results data from API

        Raises:
            httpx.HTTPError: If API request fails
        """
        async with await ExternalDataService._get_session() as client:
            logger.info(f"Fetching race results for year {year}, round {round_number}")
            response = await client.get(
                f"{ExternalDataService.JOLPICA_BASE_URL}/races/{year}/{round_number}/results"
            )
            response.raise_for_status()
            data: dict = response.json()
            logger.info(f"Fetched race results for year {year}, round {round_number}")
            return data

    @staticmethod
    async def sync_drivers(db: AsyncSession, year: int) -> int:
        """Sync driver data from Jolpica API to database.

        Args:
            db: Database session
            year: F1 season year to sync

        Returns:
            Number of drivers synced/updated

        Raises:
            ValueError: If API request fails
        """
        try:
            drivers_data = await ExternalDataService.fetch_drivers(year)
            synced_count = 0

            for driver_data in drivers_data:
                driver_name = driver_data.get("name")
                if not driver_name:
                    logger.warning("Skipping driver with no name")
                    continue

                # Check if driver exists
                existing = await DriverService.get_by_name(db, driver_name)

                if existing:
                    # Update existing driver
                    from app.schemas.driver import DriverUpdate

                    update_data = DriverUpdate(
                        number=driver_data.get("number"),
                        team_name=driver_data.get("team", driver_data.get("team_name", "")),
                        price=0,
                        status=driver_data.get("status", "active"),
                        total_points=driver_data.get("total_points", 0),
                        average_points=driver_data.get("average_points", 0.0),
                    )
                    await DriverService.update(db, existing, update_data)
                    logger.info(f"Updated driver: {existing.name}")
                else:
                    # Create new driver
                    from app.schemas.driver import DriverCreate

                    new_driver = DriverCreate(
                        external_id=driver_data.get("id", 0),
                        name=driver_name,
                        team_name=driver_data.get("team", driver_data.get("team_name", "")),
                        number=driver_data.get("number"),
                        code=driver_data.get("code"),
                        country=driver_data.get("nationality", driver_data.get("country")),
                        price=0,
                        status=driver_data.get("status", "active"),
                    )
                    await DriverService.create(db, new_driver)
                    logger.info(f"Created driver: {new_driver.name}")

                synced_count += 1

            await db.commit()
            logger.info(f"Synced {synced_count} drivers for year {year}")
            return synced_count

        except httpx.HTTPError as e:
            logger.error(f"Failed to sync drivers: {e}")
            raise ValueError(f"API request failed: {e}") from e

    @staticmethod
    async def sync_races(db: AsyncSession, year: int) -> int:
        """Sync race schedule from Jolpica API to database.

        Args:
            db: Database session
            year: F1 season year to sync

        Returns:
            Number of races synced/updated

        Raises:
            ValueError: If API request fails
        """
        try:
            races_data = await ExternalDataService.fetch_races(year)
            synced_count = 0

            for race_data in races_data:
                round_num = race_data.get("round")
                if round_num is None:
                    logger.warning("Skipping race with no round number")
                    continue

                # Check if race exists by round number
                existing = await RaceService.get_by_round(db, round_num)

                if existing:
                    # Update existing race
                    from app.schemas.race import RaceUpdate

                    update_data = RaceUpdate(
                        status=race_data.get("status", "upcoming"),
                        race_date=race_data.get("date"),
                        winning_constructor_id=None,  # Will be set by scoring service after results
                    )
                    await RaceService.update(db, existing, update_data)
                    logger.info(f"Updated race: {existing.name}")
                else:
                    # Create new race
                    from datetime import datetime

                    from app.schemas.race import RaceCreate

                    race_date_str = race_data.get("date")
                    race_date = (
                        datetime.fromisoformat(race_date_str)
                        if race_date_str
                        else datetime.utcnow()
                    )

                    new_race = RaceCreate(
                        external_id=race_data.get("id", 0),
                        round_number=round_num,
                        name=race_data.get("name", ""),
                        circuit_name=race_data.get("circuit", race_data.get("circuit_name", "")),
                        country=race_data.get("country", ""),
                        race_date=race_date,
                        status=race_data.get("status", "upcoming"),
                    )
                    await RaceService.create(db, new_race)
                    logger.info(f"Created race: {new_race.name}")

                synced_count += 1

            await db.commit()
            logger.info(f"Synced {synced_count} races for year {year}")
            return synced_count

        except httpx.HTTPError as e:
            logger.error(f"Failed to sync races: {e}")
            raise ValueError(f"API request failed: {e}") from e

    @staticmethod
    async def sync_season_data(db: AsyncSession, year: int) -> dict[str, int]:
        """Sync all data for a season from Jolpica API.

        Args:
            db: Database session
            year: F1 season year to sync

        Returns:
            Dictionary with counts of synced items

        Raises:
            ValueError: If any sync operation fails
        """
        logger.info(f"Starting full season data sync for year {year}")

        results = {}

        try:
            # Sync drivers
            results["drivers"] = await ExternalDataService.sync_drivers(db, year)

            # Sync races
            results["races"] = await ExternalDataService.sync_races(db, year)

            logger.info(f"Season data sync complete for year {year}: {results}")
            return results

        except Exception as e:
            logger.error(f"Season data sync failed: {e}")
            raise
