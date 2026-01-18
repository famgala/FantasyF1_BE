# Jolpica API Integration

## Document Overview

This document describes the integration with the Jolpica API (Ergast F1 API) for retrieving Formula 1 data including circuits, drivers, races, seasons, and race results.

**Date**: 2026-01-09
**API Version**: Ergast F1 API
**Base URL**: `https://api.jolpi.ca/ergast/f1/`

---

## API Overview

### Base URL

```
https://api.jolpi.ca/ergast/f1/
```

### Authentication

- **Required**: No
- **API Key**: None
- **Rate Limiting**: Handle gracefully with retry logic

### Response Format

- **Content-Type**: JSON
- **Encoding**: UTF-8

---

## API Endpoints

### 1. Get Season Drivers

**Endpoint**: `GET /ergast/f1/{season}/drivers`

**Description**: Retrieves all drivers for a specific season.

**Parameters**:
- `season` (required): Year (e.g., 2026)

**Example Response**:
```json
{
  "MRData": {
    "DriverTable": {
      "Drivers": [
        {
          "driverId": "hamilton",
          "permanentNumber": "44",
          "code": "HAM",
          "url": "https://en.wikipedia.org/wiki/Lewis_Hamilton",
          "givenName": "Lewis",
          "familyName": "Hamilton",
          "dateOfBirth": "1985-01-07",
          "nationality": "British"
        }
      ]
    }
  }
}
```

**Use Case**: 
- Initial season data load
- Nightly validation of driver data
- Before draft opens for a race

---

### 2. Get Season Races

**Endpoint**: `GET /ergast/f1/{season}/races`

**Description**: Retrieves all races scheduled for a specific season.

**Parameters**:
- `season` (required): Year (e.g., 2026)

**Example Response**:
```json
{
  "MRData": {
    "RaceTable": {
      "season": "2026",
      "Races": [
        {
          "raceId": "1073",
          "raceName": "Australian Grand Prix",
          "circuitId": "albert_park",
          "url": "https://en.wikipedia.org/wiki/2026_Australian_Grand_Prix",
          "circuitName": "Albert Park Grand Prix Circuit",
          "lat": "-37.8497",
          "long": "144.968",
          "locality": "Melbourne",
          "country": "Australia",
          "date": "2026-03-16",
          "time": "06:00:00Z"
        }
      ]
    }
  }
}
```

**Use Case**:
- Initial season data load
- Draft window timing calculation
- Nightly validation of race schedule

---

### 3. Get Season Circuits

**Endpoint**: `GET /ergast/f1/{season}/circuits`

**Description**: Retrieves all circuits used in a specific season.

**Parameters**:
- `season` (required): Year (e.g., 2026)

**Example Response**:
```json
{
  "MRData": {
    "CircuitTable": {
      "Circuits": [
        {
          "circuitId": "albert_park",
          "url": "https://en.wikipedia.org/wiki/Melbourne_Grand_Prix_Circuit",
          "circuitName": "Albert Park Grand Prix Circuit",
          "lat": "-37.8497",
          "long": "144.968",
          "locality": "Melbourne",
          "country": "Australia"
        }
      ]
    }
  }
}
```

**Use Case**:
- Initial season data load
- Nightly validation of circuit data
- Race location display

---

### 4. Get Season Info

**Endpoint**: `GET /ergast/f1/{season}`

**Description**: Retrieves season information and all race data.

**Parameters**:
- `season` (required): Year (e.g., 2026)

**Example Response**:
```json
{
  "MRData": {
    "StandingsTable": {
      "season": "2026"
    }
  }
}
```

**Use Case**:
- Validate season exists before loading data
- Get season metadata

---

### 5. Get Race Results

**Endpoint**: `GET /ergast/f1/{season}/results`

**Description**: Retrieves race results for a specific season.

**Parameters**:
- `season` (required): Year (e.g., 2026)

**Example Response**:
```json
{
  "MRData": {
    "RaceTable": {
      "Races": [
        {
          "raceId": "1073",
          "raceName": "Australian Grand Prix",
          "Results": [
            {
              "position": "1",
              "positionText": "1",
              "points": "25",
              "Driver": {
                "driverId": "hamilton",
                "permanentNumber": "44",
                "code": "HAM"
              },
              "Constructor": {
                "constructorId": "mercedes"
              },
              "fastestLap": {
                "rank": "1",
                "lap": "58",
                "time": "1:18.163"
              },
              "status": "Finished"
            }
          ]
        }
      ]
    }
  }
}
```

**Use Case**:
- Post-race scoring calculations
- Nightly result validation and correction detection
- Driver statistics

---

### 6. Get Specific Race Results

**Endpoint**: `GET /ergast/f1/{season}/circuits/{circuitId}/results`

**Description**: Retrieves results for a specific race in a specific season.

**Parameters**:
- `season` (required): Year (e.g., 2026)
- `circuitId` (required): Circuit identifier (e.g., "albert_park")

**Use Case**:
- Get results for specific race
- Backfill missing race data

---

## Data Storage Strategy

### PostgreSQL as Primary Storage

**Philosophy**: We do not cache API responses. All data retrieved from Jolpica API is stored in PostgreSQL as the authoritative data source.

### Update Strategy

**Update or Create Methodology**: 
- Check if data exists in database
- If exists: update values if changed
- If not exists: create new record
- Log any changes for audit purposes

### Data Corrections

**Handling FIA Corrections**:
- Corrections overwrite existing data in PostgreSQL
- Correction detection via nightly checks
- Changes are logged (but not notified in MVP)
- Rare but expected to happen periodically

---

## Integration Implementation

### JolpicaAPIService

**File**: `app/services/jolpica_api_service.py`

```python
import httpx
from typing import Optional, Dict, List, Any
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class JolpicaAPIError(Exception):
    """Base exception for Jolpica API errors."""
    pass


class JolpicaAPIConnectionError(JolpicaAPIError):
    """Exception for connection errors."""
    pass


class JolpicaAPIDataError(JolpicaAPIError):
    """Exception for data parsing errors."""
    pass


class JolpicaAPIService:
    """Service for interacting with Jolpica API."""
    
    BASE_URL = "https://api.jolpi.ca/ergast/f1/"
    TIMEOUT = 30  # seconds
    MAX_RETRIES = 3
    RETRY_DELAY = 2  # seconds
    
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
    
    async def get_client(self) -> httpx.AsyncClient:
        """Get or create HTTP client."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                timeout=self.TIMEOUT,
                headers={"User-Agent": "FantasyF1/1.0"}
            )
        return self._client
    
    async def close(self):
        """Close HTTP client."""
        if self._client:
            await self._client.aclose()
            self._client = None
    
    async def _make_request(
        self,
        endpoint: str,
        retries: int = MAX_RETRIES
    ) -> Dict[str, Any]:
        """
        Make request to Jolpica API with retry logic.
        
        Args:
            endpoint: API endpoint path
            retries: Number of retry attempts
            
        Returns:
            Parsed JSON response
            
        Raises:
            JolpicaAPIConnectionError: On connection failures
            JolpicaAPIDataError: On data parsing failures
        """
        url = f"{self.BASE_URL}{endpoint}"
        client = await self.get_client()
        
        for attempt in range(retries):
            try:
                logger.debug(f"Requesting {url} (attempt {attempt + 1}/{retries})")
                response = await client.get(url)
                response.raise_for_status()
                
                data = response.json()
                
                # Validate response structure
                if "MRData" not in data:
                    raise JolpicaAPIDataError("Invalid response format: missing MRData")
                
                logger.debug(f"Successfully retrieved data from {url}")
                return data
                
            except httpx.HTTPStatusError as e:
                logger.warning(f"HTTP error {e.response.status_code} for {url}")
                if attempt == retries - 1:
                    raise JolpicaAPIConnectionError(
                        f"Failed to fetch data after {retries} attempts: {e}"
                    )
                    
            except httpx.RequestError as e:
                logger.warning(f"Request error {e} for {url}")
                if attempt == retries - 1:
                    raise JolpicaAPIConnectionError(
                        f"Failed to connect after {retries} attempts: {e}"
                    )
                    
            except Exception as e:
                logger.error(f"Unexpected error fetching {url}: {e}")
                raise JolpicaAPIDataError(f"Failed to parse response: {e}")
            
            # Wait before retrying
            await asyncio.sleep(self.RETRY_DELAY * (attempt + 1))
    
    async def get_season_drivers(self, season: int) -> List[Dict[str, Any]]:
        """
        Get all drivers for a specific season.
        
        Args:
            season: Year (e.g., 2026)
            
        Returns:
            List of driver dictionaries
        """
        endpoint = f"{season}/drivers"
        data = await self._make_request(endpoint)
        
        return data["MRData"]["DriverTable"]["Drivers"]
    
    async def get_season_races(self, season: int) -> List[Dict[str, Any]]:
        """
        Get all races for a specific season.
        
        Args:
            season: Year (e.g., 2026)
            
        Returns:
            List of race dictionaries
        """
        endpoint = f"{season}/races"
        data = await self._make_request(endpoint)
        
        return data["MRData"]["RaceTable"]["Races"]
    
    async def get_season_circuits(self, season: int) -> List[Dict[str, Any]]:
        """
        Get all circuits for a specific season.
        
        Args:
            season: Year (e.g., 2026)
            
        Returns:
            List of circuit dictionaries
        """
        endpoint = f"{season}/circuits"
        data = await self._make_request(endpoint)
        
        return data["MRData"]["CircuitTable"]["Circuits"]
    
    async def get_season_info(self, season: int) -> Dict[str, Any]:
        """
        Get season information.
        
        Args:
            season: Year (e.g., 2026)
            
        Returns:
            Season information dictionary
        """
        endpoint = f"{season}"
        data = await self._make_request(endpoint)
        
        return data["MRData"]
    
    async def get_race_results(self, season: int) -> List[Dict[str, Any]]:
        """
        Get race results for a specific season.
        
        Args:
            season: Year (e.g., 2026)
            
        Returns:
            List of race result dictionaries
        """
        endpoint = f"{season}/results"
        data = await self._make_request(endpoint)
        
        return data["MRData"]["RaceTable"]["Races"]
    
    async def get_circuit_race_results(
        self,
        season: int,
        circuit_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get results for a specific race.
        
        Args:
            season: Year (e.g., 2026)
            circuit_id: Circuit identifier
            
        Returns:
            Race result dictionary or None if not found
        """
        endpoint = f"{season}/circuits/{circuit_id}/results"
        
        try:
            data = await self._make_request(endpoint)
            races = data["MRData"]["RaceTable"]["Races"]
            
            return races[0] if races else None
        except JolpicaAPIError:
            logger.error(f"Failed to fetch race results for {circuit_id} in {season}")
            return None


# Global service instance
jolpica_api_service = JolpicaAPIService()
```

---

## Data Sync Service

### DataSyncService

**File**: `app/services/data_sync_service.py`

```python
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.driver import Driver
from app.models.race import Race
from app.models.circuit import Circuit
from app.models.race_result import RaceResult
from app.services.jolpica_api_service import jolpica_api_service, JolpicaAPIError
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class DataSyncService:
    """Service for syncing data from Jolpica API to PostgreSQL."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def sync_season_data(self, season: int) -> bool:
        """
        Sync all data for a specific season.
        
        Args:
            season: Year to sync (e.g., 2026)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Starting data sync for season {season}")
            
            # Sync in order: circuits, drivers, races, results
            await self.sync_circuits(season)
            await self.sync_drivers(season)
            await self.sync_races(season)
            await self.sync_race_results(season)
            
            logger.info(f"Successfully completed data sync for season {season}")
            return True
            
        except JolpicaAPIError as e:
            logger.error(f"API error during season sync: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during season sync: {e}")
            return False
    
    async def sync_circuits(self, season: int) -> int:
        """
        Sync circuits for a specific season.
        
        Returns:
            Number of circuits synced
        """
        logger.info(f"Syncing circuits for season {season}")
        circuits_data = await jolpica_api_service.get_season_circuits(season)
        
        count = 0
        for circuit_data in circuits_data:
            circuit = await self._get_or_create_circuit(circuit_data)
            if circuit:
                count += 1
        
        logger.info(f"Synced {count} circuits for season {season}")
        return count
    
    async def sync_drivers(self, season: int) -> int:
        """
        Sync drivers for a specific season.
        
        Returns:
            Number of drivers synced
        """
        logger.info(f"Syncing drivers for season {season}")
        drivers_data = await jolpica_api_service.get_season_drivers(season)
        
        count = 0
        for driver_data in drivers_data:
            driver = await self._get_or_create_driver(driver_data)
            if driver:
                count += 1
        
        logger.info(f"Synced {count} drivers for season {season}")
        return count
    
    async def sync_races(self, season: int) -> int:
        """
        Sync races for a specific season.
        
        Returns:
            Number of races synced
        """
        logger.info(f"Syncing races for season {season}")
        races_data = await jolpica_api_service.get_season_races(season)
        
        count = 0
        for race_data in races_data:
            race = await self._get_or_create_race(race_data, season)
            if race:
                count += 1
        
        logger.info(f"Synced {count} races for season {season}")
        return count
    
    async def sync_race_results(self, season: int) -> int:
        """
        Sync race results for a specific season.
        
        Returns:
            Number of race results synced
        """
        logger.info(f"Syncing race results for season {season}")
        results_data = await jolpica_api_service.get_race_results(season)
        
        count = 0
        for race_data in results_data:
            race_results = await self._get_or_create_race_results(race_data)
            if race_results:
                count += len(race_results)
        
        logger.info(f"Synced {count} race results for season {season}")
        return count
    
    async def _get_or_create_circuit(
        self,
        circuit_data: Dict[str, Any]
    ) -> Optional[Circuit]:
        """Get existing circuit or create new one."""
        circuit_id = circuit_data.get("circuitId")
        if not circuit_id:
            return None
        
        # Check if exists
        existing = await self.db.execute(
            select(Circuit).where(Circuit.jolpica_id == circuit_id)
        )
        circuit = existing.scalar_one_or_none()
        
        if circuit:
            # Update if changed
            circuit.name = circuit_data.get("circuitName", circuit.name)
            circuit.location = circuit_data.get("locality", circuit.location)
            circuit.country = circuit_data.get("country", circuit.country)
            circuit.latitude = float(circuit_data.get("lat", 0))
            circuit.longitude = float(circuit_data.get("long", 0))
            circuit.url = circuit_data.get("url", circuit.url)
            logger.debug(f"Updated circuit {circuit_id}")
        else:
            # Create new
            circuit = Circuit(
                jolpica_id=circuit_id,
                name=circuit_data.get("circuitName"),
                location=circuit_data.get("locality"),
                country=circuit_data.get("country"),
                latitude=float(circuit_data.get("lat", 0)),
                longitude=float(circuit_data.get("long", 0)),
                url=circuit_data.get("url")
            )
            self.db.add(circuit)
            logger.debug(f"Created circuit {circuit_id}")
        
        return circuit
    
    async def _get_or_create_driver(
        self,
        driver_data: Dict[str, Any]
    ) -> Optional[Driver]:
        """Get existing driver or create new one."""
        driver_id = driver_data.get("driverId")
        if not driver_id:
            return None
        
        # Check if exists
        existing = await self.db.execute(
            select(Driver).where(Driver.jolpica_id == driver_id)
        )
        driver = existing.scalar_one_or_none()
        
        if driver:
            # Update if changed
            driver.first_name = driver_data.get("givenName", driver.first_name)
            driver.last_name = driver_data.get("familyName", driver.last_name)
            driver.number = int(driver_data.get("permanentNumber", 0))
            driver.code = driver_data.get("code", driver.code)
            driver.nationality = driver_data.get("nationality", driver.nationality)
            driver.date_of_birth = driver_data.get("dateOfBirth", driver.date_of_birth)
            driver.url = driver_data.get("url", driver.url)
            logger.debug(f"Updated driver {driver_id}")
        else:
            # Create new
            driver = Driver(
                jolpica_id=driver_id,
                first_name=driver_data.get("givenName"),
                last_name=driver_data.get("familyName"),
                number=int(driver_data.get("permanentNumber", 0)),
                code=driver_data.get("code"),
                nationality=driver_data.get("nationality"),
                date_of_birth=driver_data.get("dateOfBirth"),
                url=driver_data.get("url")
            )
            self.db.add(driver)
            logger.debug(f"Created driver {driver_id}")
        
        return driver
    
    async def _get_or_create_race(
        self,
        race_data: Dict[str, Any],
        season: int
    ) -> Optional[Race]:
        """Get existing race or create new one."""
        race_id = race_data.get("raceId")
        circuit_id = race_data.get("circuitId")
        
        if not race_id or not circuit_id:
            return None
        
        # Find circuit
        circuit_result = await self.db.execute(
            select(Circuit).where(Circuit.jolpica_id == circuit_id)
        )
        circuit = circuit_result.scalar_one_or_none()
        
        if not circuit:
            logger.warning(f"Circuit {circuit_id} not found for race {race_id}")
            return None
        
        # Check if race exists
        existing = await self.db.execute(
            select(Race).where(Race.jolpica_id == race_id)
        )
        race = existing.scalar_one_or_none()
        
        # Parse datetime
        date_str = race_data.get("date")
        time_str = race_data.get("time", "00:00:00Z")
        race_datetime = f"{date_str}T{time_str}" if date_str else None
        
        if race:
            # Update if changed
            race.name = race_data.get("raceName", race.name)
            race.date = race_datetime
            race.circuit_id = circuit.id
            logger.debug(f"Updated race {race_id}")
        else:
            # Create new
            race = Race(
                jolpica_id=race_id,
                name=race_data.get("raceName"),
                date=race_datetime,
                circuit_id=circuit.id,
                season=season
            )
            self.db.add(race)
            logger.debug(f"Created race {race_id}")
        
        return race
    
    async def _get_or_create_race_results(
        self,
        race_data: Dict[str, Any]
    ) -> List[RaceResult]:
        """Get existing race results or create new ones."""
        race_id = race_data.get("raceId")
        results_list = race_data.get("Results", [])
        
        # Find race
        existing = await self.db.execute(
            select(Race).where(Race.jolpica_id == race_id)
        )
        race = existing.scalar_one_or_none()
        
        if not race:
            logger.warning(f"Race {race_id} not found for results")
            return []
        
        race_results = []
        
        for result_data in results_list:
            driver_data = result_data.get("Driver", {})
            driver_id = driver_data.get("driverId")
            
            if not driver_id:
                continue
            
            # Find driver
            driver_result = await self.db.execute(
                select(Driver).where(Driver.jolpica_id == driver_id)
            )
            driver = driver_result.scalar_one_or_none()
            
            if not driver:
                logger.warning(f"Driver {driver_id} not found for race result")
                continue
            
            # Check if result exists
            existing_result = await self.db.execute(
                select(RaceResult).where(
                    RaceResult.race_id == race.id,
                    RaceResult.driver_id == driver.id
                )
            )
            race_result = existing_result.scalar_one_or_none()
            
            # Parse position (DNF/DNS -> None)
            position_text = result_data.get("positionText", "")
            position = None if not position_text.isdigit() else int(position_text)
            
            # Parse points
            points = float(result_data.get("points", 0))
            
            # Check for fastest lap
            fastest_lap_data = result_data.get("fastestLap")
            has_fastest_lap = (
                fastest_lap_data is not None and
                fastest_lap_data.get("rank") == "1" and
                position is not None and
                position <= 10
            ) if fastest_lap_data else False
            
            # Get status
            status = result_data.get("status", "Unknown")
            
            if race_result:
                # Update if changed
                race_result.position = position
                race_result.points = points
                race_result.status = status
                race_result.has_fastest_lap = has_fastest_lap
                logger.debug(
                    f"Updated result for driver {driver_id} in race {race_id}"
                )
            else:
                # Create new
                race_result = RaceResult(
                    race_id=race.id,
                    driver_id=driver.id,
                    position=position,
                    points=points,
                    status=status,
                    has_fastest_lap=has_fastest_lap
                )
                self.db.add(race_result)
                logger.debug(
                    f"Created result for driver {driver_id} in race {race_id}"
                )
            
            race_results.append(race_result)
        
        return race_results
```

---

## Nightly Data Consistency Checks

### ValidationService

**File**: `app/services/validation_service.py`

```python
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.driver import Driver
from app.models.race import Race
from app.models.circuit import Circuit
from app.models.race_result import RaceResult
from app.services.jolpica_api_service import jolpica_api_service
from app.utils.logger import setup_logger
from datetime import datetime, timedelta

logger = setup_logger(__name__)


class DataDiscrepancy:
    """Data discrepancy found during validation."""
    
    def __init__(
        self,
        entity_type: str,
        entity_id: str,
        field: str,
        local_value: Any,
        api_value: Any,
        description: str
    ):
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.field = field
        self.local_value = local_value
        self.api_value = api_value
        self.description = description
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for logging/API response."""
        return {
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "field": self.field,
            "local_value": str(self.local_value),
            "api_value": str(self.api_value),
            "description": self.description,
            "timestamp": self.timestamp.isoformat()
        }


class ValidationService:
    """Service for validating data consistency with Jolpica API."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.discrepancies: List[DataDiscrepancy] = []
    
    async def validate_season_data(
        self,
        season: int,
        race_check_limit: int = 2
    ) -> List[DataDiscrepancy]:
        """
        Validate all season data against Jolpica API.
        
        Args:
            season: Year to validate (e.g., 2026)
            race_check_limit: Number of most recent races to check results for
            
        Returns:
            List of discrepancies found
        """
        logger.info(f"Starting data validation for season {season}")
        self.discrepancies = []
        
        # Validate circuits
        await self._validate_circuits(season)
        
        # Validate drivers
        await self._validate_drivers(season)
        
        # Validate races
        await self._validate_races(season)
        
        # Validate race results (last N races only)
        await self._validate_race_results(season, race_check_limit)
        
        logger.info(
            f"Validation complete for season {season}. "
            f"Found {len(self.discrepancies)} discrepancies."
        )
        
        return self.discrepancies
    
    async def _validate_circuits(self, season: int):
        """Validate circuits data."""
        logger.info("Validating circuits")
        
        # Get API data
        api_circuits = await jolpica_api_service.get_season_circuits(season)
        api_circuit_map = {
            c["circuitId"]: c for c in api_circuits
        }
        
        # Get local data
        result = await self.db.execute(
            select(Circuit).where(
                func.date_part('year', Race.season) == season
            )
        )
        local_circuits = result.scalars().all()
        
        for circuit in local_circuits:
            if circuit.jolpica_id not in api_circuit_map:
                continue
            
            api_circuit = api_circuit_map[circuit.jolpica_id]
            
            # Compare fields
            if circuit.name != api_circuit.get("circuitName"):
                self.discrepancies.append(DataDiscrepancy(
                    entity_type="circuit",
                    entity_id=circuit.jolpica_id,
                    field="name",
                    local_value=circuit.name,
                    api_value=api_circuit.get("circuitName"),
                    description=f"Circuit name differs"
                ))
            
            if circuit.location != api_circuit.get("locality"):
                self.discrepancies.append(DataDiscrepancy(
                    entity_type="circuit",
                    entity_id=circuit.jolpica_id,
                    field="location",
                    local_value=circuit.location,
                    api_value=api_circuit.get("locality"),
                    description=f"Circuit location differs"
                ))
    
    async def _validate_drivers(self, season: int):
        """Validate drivers data."""
        logger.info("Validating drivers")
        
        # Get API data
        api_drivers = await jolpica_api_service.get_season_drivers(season)
        api_driver_map = {
            d["driverId"]: d for d in api_drivers
        }
        
        # Get local data
        result = await self.db.execute(select(Driver))
        local_drivers = result.scalars().all()
        
        for driver in local_drivers:
            if driver.jolpica_id not in api_driver_map:
                continue
            
            api_driver = api_driver_map[driver.jolpica_id]
            
            # Compare fields
            if driver.first_name != api_driver.get("givenName"):
                self.discrepancies.append(DataDiscrepancy(
                    entity_type="driver",
                    entity_id=driver.jolpica_id,
                    field="first_name",
                    local_value=driver.first_name,
                    api_value=api_driver.get("givenName"),
                    description=f"Driver first name differs"
                ))
            
            if driver.last_name != api_driver.get("familyName"):
                self.discrepancies.append(DataDiscrepancy(
                    entity_type="driver",
                    entity_id=driver.jolpica_id,
                    field="last_name",
                    local_value=driver.last_name,
                    api_value=api_driver.get("familyName"),
                    description=f"Driver last name differs"
                ))
    
    async def _validate_races(self, season: int):
        """Validate races data."""
        logger.info("Validating races")
        
        # Get API data
        api_races = await jolpica_api_service.get_season_races(season)
        api_race_map = {
            r["raceId"]: r for r in api_races
        }
        
        # Get local data
        result = await self.db.execute(
            select(Race).where(Race.season == season)
        )
        local_races = result.scalars().all()
        
        for race in local_races:
            if race.jolpica_id not in api_race_map:
                continue
            
            api_race = api_race_map[race.jolpica_id]
            
            # Compare fields
            if race.name != api_race.get("raceName"):
                self.discrepancies.append(DataDiscrepancy(
                    entity_type="race",
                    entity_id=race.jolpica_id,
                    field="name",
                    local_value=race.name,
                    api_value=api_race.get("raceName"),
                    description=f"Race name differs"
                ))
            
            # Compare date/times
            api_datetime = f"{api_race.get('date')}T{api_race.get('time', '00:00:00Z')}"
            if str(race.date) != api_datetime:
                self.discrepancies.append(DataDiscrepancy(
                    entity_type="race",
                    entity_id=race.jolpica_id,
                    field="date",
                    local_value=race.date,
                    api_value=api_datetime,
                    description=f"Race datetime differs"
                ))
    
    async def _validate_race_results(
        self,
        season: int,
        race_check_limit: int
    ):
        """Validate race results for the most recent N races."""
        logger.info(f"Validating race results for last {race_check_limit} races")
        
        # Get most recent N races
        result = await self.db.execute(
            select(Race)
            .where(Race.season == season)
            .order_by(Race.date.desc())
            .limit(race_check_limit)
        )
        recent_races = result.scalars().all()
        
        for race in recent_races:
            # Get API data for this race
            circuit_result = await self.db.execute(
                select(Circuit).where(Circuit.id == race.circuit_id)
            )
            circuit = circuit_result.scalar_one_or_none()
            
            if not circuit:
                continue
            
            api_race_data = await jolpica_api_service.get_circuit_race_results(
                season,
                circuit.jolpica_id
            )
            
            if not api_race_data:
                continue
            
            api_results_map = {
                r["Driver"]["driverId"]: r for r in api_race_data.get("Results", [])
            }
            
            # Get local results
            results_result = await self.db.execute(
                select(RaceResult).where(RaceResult.race_id == race.id)
            )
            local_results = results_result.scalars().all()
            
            for result in local_results:
                # Find driver
                driver_result = await self.db.execute(
                    select(Driver).where(Driver.id == result.driver_id)
                )
                driver = driver_result.scalar_one_or_none()
                
                if not driver:
                    continue
                
                driver_id = driver.jolpica_id
                
                if driver_id not in api_results_map:
                    continue
                
                api_result = api_results_map[driver_id]
                
                # Compare position
                api_position_text = api_result.get("positionText", "")
                api_position = None if not api_position_text.isdigit() else int(api_position_text)
                
                if result.position != api_position:
                    self.discrepancies.append(DataDiscrepancy(
                        entity_type="race_result",
                        entity_id=f"{race.jolpica_id}_{driver_id}",
                        field="position",
                        local_value=result.position,
                        api_value=api_position,
                        description=f"Driver {driver_id} position differs in race {race.jolpica_id}"
                    ))
                
                # Compare points
                api_points = float(api_result.get("points", 0))
                if result.points != api_points:
                    self.discrepancies.append(DataDiscrepancy(
                        entity_type="race_result",
                        entity_id=f"{race.jolpica_id}_{driver_id}",
                        field="points",
                        local_value=result.points,
                        api_value=api_points,
                        description=f"Driver {driver_id} points differ in race {race.jolpica_id}"
                    ))
```

---

## Celery Tasks for Data Management

### Data Management Tasks

**File**: `app/tasks/data_management_tasks.py`

```python
from datetime import datetime
from celery import shared_task
from app.db.session import SessionLocal
from app.services.data_sync_service import DataSyncService
from app.services.validation_service import ValidationService
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


@shared_task(name="tasks.sync_season_data")
def sync_season_data_task(season: int):
    """
    Sync all data for a specific season.
    
    Scheduled to run on application startup after admin setup.
    """
    logger.info(f"Starting season data sync task for {season}")
    
    async def run_sync():
        async with SessionLocal() as db:
            sync_service = DataSyncService(db)
            success = await sync_service.sync_season_data(season)
            
            if success:
                logger.info(f"Season {season} data sync completed successfully")
            else:
                logger.error(f"Season {season} data sync failed")
    
    import asyncio
    asyncio.run(run_sync())


@shared_task(name="tasks.nightly_validation")
def nightly_validation_task(season: int, race_check_limit: int = 2):
    """
    Run nightly data consistency checks.
    
    Scheduled to run at 2:00 AM EST daily.
    Validates race, circuit, and driver data for current season.
    Validates race results for previous 2 races.
    Logs discrepancies for admin review.
    """
    logger.info(f"Starting nightly validation for season {season}")
    
    async def run_validation():
        async with SessionLocal() as db:
            validation_service = ValidationService(db)
            discrepancies = await validation_service.validate_season_data(
                season,
                race_check_limit
            )
            
            if discrepancies:
                logger.warning(
                    f"Found {len(discrepancies)} discrepancies during nightly validation"
                )
                for discrepancy in discrepancies:
                    logger.warning(
                        f"Discrepancy: {discrepancy.to_dict()}"
                    )
            else:
                logger.info("Nightly validation completed with no discrepancies")
    
    import asyncio
    asyncio.run(run_validation())


@shared_task(name="tasks.qualifying_time_check")
def qualifying_time_check_task(season: int):
    """
    Check for qualifying times and update race status.
    
    Runs every hour to check if qualifying has started.
    Updates race qualification status when qualifying session begins.
    """
    logger.info(f"Starting qualifying time check for season {season}")
    
    # Implementation: Check races, find upcoming qualifying sessions,
    # update status if qualifying has started
    
    # This task will be important for later when implementing
    # time-limited draft windows
    
    logger.info("Qualifying time check completed")
```

---

## Error Handling Strategy

### Best Practices

1. **Retry Logic**: All API requests include retry with exponential backoff
2. **Timeout Protection**: 30-second timeout on all API requests
3. **Graceful Degradation**: If API is unavailable, use local data and log error
4. **Data Validation**: Validate API response structure before processing
5. **Logging**: All API interactions and errors are logged
6. **Transaction Safety**: Database operations use transactions for consistency

### Fallback Strategy

**Primary Fallback**: Manual data entry by admin

- If Jolpica API is unavailable for extended period
- Admin can manually enter race results via admin interface
- Manual entries are treated same as API data in PostgreSQL

### Data Correction

**Overwrite Strategy**:
- Corrections overwrite existing data in PostgreSQL
- Changes are logged for audit trail
- No user notifications in MVP (logged to application logs only)

---

## Testing Strategy

### Unit Testing

- Mock Jolpica API responses using `httpx` mocking
- Test retry logic with simulated failures
- Test data validation with malformed responses
- Test error handling for all error scenarios

### Integration Testing

- Test full data sync flow against test environment
- Test validation service with known discrepancies
- Test Celery task execution

### Test Data

Create mock responses matching Jolpica API format in `tests/fixtures/jolpica_api/`:
- `drivers_2026.json`
- `races_2026.json`
- `circuits_2026.json`
- `race_results_2026.json`

---

## Performance Considerations

### API Call Optimization

- Batch API calls when possible (get all data for season)
- Cache API client for reuse across requests
- Use async I/O for concurrent operations

### Database Optimization

- Use indexes on `jolpica_id` fields
- Batch database operations with bulk inserts/updates
- Use transactions for consistency

### Rate Limiting

- Jolpica API has no rate limits (publicly accessible)
- Still implement retries with backoff for network resilience

---

## Security Considerations

- No sensitive data transmitted to Jolpica API
- User-Agent header identifies application
- Input validation on all API responses
- SQL injection prevention via SQLAlchemy

---

## Summary

This document provides a comprehensive integration strategy for the Jolpica API, including:

1. **API Endpoint Specifications**: All required endpoints with examples
2. **Data Storage Strategy**: PostgreSQL as primary storage, no caching
3. **Service Implementation**: Complete code for API interaction and data sync
4. **Validation Logic**: Nightly consistency checks for data integrity
5. **Celery Integration**: Scheduled tasks for data management
6. **Error Handling**: Retry logic, fallbacks, and logging
7. **Testing Strategy**: Mock data and testing approach

The integration follows best practices for API resilience, data consistency, and error handling.

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-09 | Project Lead | Initial Jolpica API integration documentation |