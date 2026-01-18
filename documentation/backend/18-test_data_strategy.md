# Test Data Strategy

## Document Overview

This document describes the strategy for creating and managing test data for development, testing, and staging environments. It outlines seed data generation, test scenarios, and testing utilities.

**Date**: 2026-01-09
**Status**: MVP Scope

---

## Table of Contents

1. [Development Seed Data](#development-seed-data)
2. [Test Fixture Data](#test-fixture-data)
3. [Test Scenarios](#test-scenarios)
4. [Data Generation Utilities](#data-generation-utilities)
5. [Testing Strategy](#testing-strategy)
6. [Environment-Specific Data](#environment-specific-data)

---

## Development Seed Data

### Overview

**Purpose**: Provide realistic test data for local development and manual testing.

**Creation Method**: Scripts and utilities to generate test data on application startup or on-demand.

### Seed Data Strategy

**Rule**: Drivers and circuit details are pulled from Jolpica API on app start using an "update or create" methodology.

**Implementation**:

```python
# scripts/seed_dev_data.py
import asyncio
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import SessionLocal
from app.services.data_sync_service import DataSyncService
from app.services.jolpica_api_service import jolpica_api_service

async def seed_development_data():
    """
    Seed development environment with test data.
    
    Creates:
    - Current season data from Jolpica API
    - Test races for next 12 Sundays
    - Sample leagues
    - Sample users and constructors
    """
    async with SessionLocal() as db:
        print("Seeding development data...")
        
        # 1. Sync current season data from Jolpica API
        current_year = datetime.now().year
        sync_service = DataSyncService(db)
        
        print(f"Syncing {current_year} season data from Jolpica API...")
        await sync_service.sync_season_data(current_year)
        print(f"✓ Season data synced")
        
        # 2. Create test races for next 12 Sundays
        print("Creating test races for next 12 Sundays...")
        await create_test_sunday_races(db, current_year)
        print("✓ Test races created")
        
        # 3. Create sample leagues
        print("Creating sample leagues...")
        await create_sample_leagues(db)
        print("✓ Sample leagues created")
        
        # 4. Create sample users and constructors
        print("Creating sample users and constructors...")
        await create_sample_users(db)
        print("✓ Sample users created")
        
        print("\n✓ Development data seeding complete!")


async def create_test_sunday_races(db: AsyncSession, season: int):
    """Create test races for next 12 Sundays."""
    # Get existing circuits from database
    from app.models.circuit import Circuit
    result = await db.execute(select(Circuit))
    circuits = result.scalars().all()
    
    if not circuits:
        print("Warning: No circuits found. Skipping test races.")
        return
    
    # Find next Sunday
    today = datetime.now()
    next_sunday = today + timedelta(days=(6 - today.weekday()) % 7 + 7)
    
    # Create 12 races, one per Sunday
    for week in range(12):
        race_date = next_sunday + timedelta(weeks=week)
        
        # Cycle through circuits
        circuit = circuits[week % len(circuits)]
        
        # Check if race already exists
        existing = await db.execute(
            select(Race).where(
                Race.season == season,
                Race.date == race_date
            )
        )
        if existing.scalar_one_or_none():
            continue
        
        # Create race
        race = Race(
            jolpica_id=f"dev_test_{week}",
            name=f"Test Race Week {week + 1}",
            date=race_date,
            circuit_id=circuit.id,
            season=season,
            status="scheduled"
        )
        
        db.add(race)
        await db.commit()
        await db.refresh(race)
        
        print(f"  Created: {race.name} on {race_date.strftime('%Y-%m-%d')}")


async def create_sample_leagues(db: AsyncSession):
    """Create sample leagues for testing."""
    from app.models.league import League
    
    sample_leagues = [
        {
            "name": "Test League 1 - Public",
            "is_public": True,
            "max_players": 10,
            "draft_method": "sequential"
        },
        {
            "name": "Test League 2 - Private",
            "is_public": False,
            "max_players": 5,
            "draft_method": "sequential"
        },
        {
            "name": "Test League 3 - Large",
            "is_public": True,
            "max_players": 20,
            "draft_method": "sequential"
        }
    ]
    
    for league_data in sample_leagues:
        existing = await db.execute(
            select(League).where(League.name == league_data["name"])
        )
        if existing.scalar_one_or_none():
            continue
        
        league = League(**league_data)
        db.add(league)
        await db.commit()
        await db.refresh(league)
        
        print(f"  Created: {league.name}")


async def create_sample_users(db: AsyncSession):
    """Create sample users and constructors for testing."""
    from app.models.user import User
    from app.models.constructor import Constructor
    
    sample_users = [
        {
            "username": "testuser1",
            "email": "test1@example.com",
            "password": "TestPassword123!",
            "team_name": "Test Team 1"
        },
        {
            "username": "testuser2",
            "email": "test2@example.com",
            "password": "TestPassword123!",
            "team_name": "Test Team 2"
        },
        {
            "username": "testuser3",
            "email": "test3@example.com",
            "password": "TestPassword123!",
            "team_name": "Test Team 3"
        }
    ]
    
    # Get sample leagues
    leagues_result = await db.execute(select(League))
    leagues = leagues_result.scalars().all()
    
    for user_data in sample_users:
        existing = await db.execute(
            select(User).where(User.email == user_data["email"])
        )
        if existing.scalar_one_or_none():
            continue
        
        # Create user
        user = User(
            username=user_data["username"],
            email=user_data["email"]
        )
        user.set_password(user_data["password"])
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        # Create constructor in first league
        if leagues:
            league = leagues[0]
            constructor = Constructor(
                user_id=user.id,
                league_id=league.id,
                team_name=user_data["team_name"],
                total_points=0.0
            )
            db.add(constructor)
            await db.commit()
            await db.refresh(constructor)
            
            print(f"  Created: {user.username} with constructor in {league.name}")


if __name__ == "__main__":
    asyncio.run(seed_development_data())
```

### Running Seed Data

**On Application Startup** (Development Only):

```python
# app/main.py
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    # Create database tables
    await init_db()
    
    # Seed development data only
    if settings.ENVIRONMENT == "development":
        from scripts.seed_dev_data import seed_development_data
        await seed_development_data()
```

**Manual Command**:

```bash
# Run seed data script
python scripts/seed_dev_data.py

# Or via Docker Compose
docker-compose exec app python scripts/seed_dev_data.py
```

### Seed Data Schedule

**Development Environment**:
- Created on first startup
- Can be regenerated on-demand
- Data persists between application restarts

**Test Environment**:
- Created once per test suite run
- Cleaned up after tests complete
- Isolated from other tests

**Staging/Production**:
- No automatic seed data
- Admin manually creates leagues
- Jolpica API syncs season data on first admin setup

---

## Test Fixture Data

### Jolpica API Mock Data

**Location**: `tests/fixtures/jolpica_api/`

**Purpose**: Mock Jolpica API responses for testing without hitting real API.

**Files**:

```json
// tests/fixtures/jolpica_api/drivers_2026.json
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
        },
        {
          "driverId": "verstappen",
          "permanentNumber": "1",
          "code": "VER",
          "url": "https://en.wikipedia.org/wiki/Max_Verstappen",
          "givenName": "Max",
          "familyName": "Verstappen",
          "dateOfBirth": "1997-09-30",
          "nationality": "Dutch"
        }
      ]
    }
  }
}
```

```json
// tests/fixtures/jolpica_api/circuits_2026.json
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
        },
        {
          "circuitId": "monaco",
          "url": "https://en.wikipedia.org/wiki/Circuit_de_Monaco",
          "circuitName": "Circuit de Monaco",
          "lat": "43.734",
          "long": "7.42",
          "locality": "Monte Carlo",
          "country": "Monaco"
        }
      ]
    }
  }
}
```

```json
// tests/fixtures/jolpica_api/races_2026.json
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
        },
        {
          "raceId": "1074",
          "raceName": "Monaco Grand Prix",
          "circuitId": "monaco",
          "url": "https://en.wikipedia.org/wiki/2026_Monaco_Grand_Prix",
          "circuitName": "Circuit de Monaco",
          "lat": "43.734",
          "long": "7.42",
          "locality": "Monte Carlo",
          "country": "Monaco",
          "date": "2026-05-25",
          "time": "13:00:00Z"
        }
      ]
    }
  }
}
```

```json
// tests/fixtures/jolpica_api/race_results_2026.json
{
  "MRData": {
    "RaceTable": {
      "Races": [
        {
          "raceId": "1073",
          "raceName": "Australian Grand Prix",
          "Circuit": {
            "circuitId": "albert_park",
            "circuitName": "Albert Park Grand Prix Circuit"
          },
          "Results": [
            {
              "position": "1",
              "positionText": "1",
              "points": "25",
              "Driver": {
                "driverId": "verstappen",
                "permanentNumber": "1",
                "code": "VER"
              },
              "Constructor": {
                "constructorId": "red_bull"
              },
              "fastestLap": {
                "rank": "1",
                "lap": "58",
                "time": "1:18.163"
              },
              "status": "Finished"
            },
            {
              "position": "2",
              "positionText": "2",
              "points": "18",
              "Driver": {
                "driverId": "hamilton",
                "permanentNumber": "44",
                "code": "HAM"
              },
              "Constructor": {
                "constructorId": "mercedes"
              },
              "fastestLap": {
                "rank": "2",
                "lap": "58",
                "time": "1:18.456"
              },
              "status": "Finished"
            },
            {
              "position": "3",
              "positionText": "3",
              "points": "15",
              "Driver": {
                "driverId": "norris",
                "permanentNumber": "4",
                "code": "NOR"
              },
              "Constructor": {
                "constructorId": "mclaren"
              },
              "fastestLap": null,
              "status": "Finished"
            }
          ]
        }
      ]
    }
  }
}
```

### Mocking Jolpica API in Tests

**Implementation**:

```python
# tests/conftest.py
import pytest
from unittest.mock import AsyncMock, patch
from app.services.jolpica_api_service import jolpica_api_service

@pytest.fixture
def mock_jolpica_api():
    """Mock Jolpica API responses."""
    
    # Load fixture data
    def load_fixture(filename):
        import json
        from pathlib import Path
        fixture_path = Path(__file__).parent / "fixtures" / "jolpica_api" / filename
        with open(fixture_path) as f:
            return json.load(f)
    
    # Create mock service
    mock_api = AsyncMock()
    
    mock_api.get_season_drivers.return_value = load_fixture("drivers_2026.json")["MRData"]["DriverTable"]["Drivers"]
    mock_api.get_season_races.return_value = load_fixture("races_2026.json")["MRData"]["RaceTable"]["Races"]
    mock_api.get_season_circuits.return_value = load_fixture("circuits_2026.json")["MRData"]["CircuitTable"]["Circuits"]
    mock_api.get_race_results.return_value = load_fixture("race_results_2026.json")["MRData"]["RaceTable"]["Races"]
    
    return mock_api


@pytest.fixture
async def use_mock_jolpica_api(mock_jolpica_api):
    """Use mocked Jolpica API in tests."""
    with patch('app.services.jolpica_api_service.jolpica_api_service', mock_jolpica_api):
        yield mock_jolpica_api
```

---

## Test Scenarios

### Complete User Flow Test

**Scenario**: End-to-end test of user creating league, joining, drafting, and scoring.

```python
# tests/e2e/test_complete_user_flow.py
import pytest
from datetime import datetime

@pytest.mark.asyncio
async def test_complete_user_flow(
    db_session,
    use_mock_jolpica_api,
    client: AsyncClient
):
    """Test complete user flow: register -> create league -> join -> draft -> score."""
    
    # 1. Register user
    user_response = await client.post(
        "/api/v1/users/",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPassword123!"
        }
    )
    assert user_response.status_code == 201
    user_data = user_response.json()
    
    # 2. Login
    login_response = await client.post(
        "/api/v1/auth/login",
        data={
            "username": "testuser",
            "password": "TestPassword123!"
        }
    )
    assert login_response.status_code == 200
    token_data = login_response.json()
    access_token = token_data["access_token"]
    
    # Set authorization header
    client.headers.update({
        "Authorization": f"Bearer {access_token}"
    })
    
    # 3. Create league
    league_response = await client.post(
        "/api/v1/leagues/",
        json={
            "name": "Test League",
            "max_players": 10,
            "is_public": True
        }
    )
    assert league_response.status_code == 201
    league_data = league_response.json()
    league_id = league_data["id"]
    
    # 4. Get constructor (auto-created)
    constructor_response = await client.get(f"/api/v1/leagues/{league_id}/my-constructor")
    assert constructor_response.status_code == 200
    constructor_data = constructor_response.json()
    constructor_id = constructor_data["id"]
    
    # 5. Get upcoming race
    races_response = await client.get("/api/v1/races/upcoming")
    assert races_response.status_code == 200
    races_data = races_response.json()
    assert len(races_data["items"]) > 0
    race_id = races_data["items"][0]["id"]
    
    # 6. Generate initial draft order
    draft_order_response = await client.post(
        f"/api/v1/leagues/{league_id}/draft-order/{race_id}"
    )
    assert draft_order_response.status_code == 201
    draft_order_data = draft_order_response.json()
    
    # 7. Get available drivers
    drivers_response = await client.get(f"/api/v1/races/{race_id}/available-drivers")
    assert drivers_response.status_code == 200
    drivers_data = drivers_response.json()
    assert len(drivers_data["items"]) >= 2
    
    # 8. Make driver picks
    driver_ids = [drivers_data["items"][0]["id"], drivers_data["items"][1]["id"]]
    
    for pick_number, driver_id in enumerate(driver_ids, 1):
        pick_response = await client.post(
            f"/api/v1/constructors/{constructor_id}/drafts",
            json={
                "race_id": race_id,
                "driver_id": driver_id,
                "pick_number": pick_number
            }
        )
        assert pick_response.status_code == 201
    
    # 9. Get constructor's driver drafts
    drafts_response = await client.get(
        f"/api/v1/constructors/{constructor_id}/drafts/{race_id}"
    )
    assert drafts_response.status_code == 200
    drafts_data = drafts_response.json()
    assert len(drafts_data["items"]) == 2
    
    # 10. Verify draft is complete
    status_response = await client.get(
        f"/api/v1/races/{race_id}/leagues/{league_id}/draft-status"
    )
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["status"] == "complete"
    
    # 11. Calculate points (mock race results)
    # (This would require mocking race results)
    
    # 12. Get leaderboard
    leaderboard_response = await client.get(
        f"/api/v1/leagues/{league_id}/leaderboard"
    )
    assert leaderboard_response.status_code == 200
    leaderboard_data = leaderboard_response.json()
    assert len(leaderboard_data["items"]) >= 1
    
    # Verify constructor is in leaderboard
    constructor_ids = [c["constructor_id"] for c in leaderboard_data["items"]]
    assert constructor_id in constructor_ids
```

### Draft Order Rotation Test

**Scenario**: Test that draft order rotates correctly across multiple races.

```python
# tests/e2e/test_draft_rotation.py
@pytest.mark.asyncio
async def test_draft_order_rotation(db_session, use_mock_jolpica_api, client: AsyncClient):
    """Test draft order rotation across races."""
    
    # Setup: Create league with multiple constructors
    # ... (setup code)
    
    # Get first race draft order
    race1_response = await client.get(f"/api/v1/races/{race1_id}/draft-order")
    draft1 = race1_response.json()["draft_order"]
    
    # Complete draft for race 1
    # ... (complete draft code)
    
    # Get second race
    race2_response = await client.get("/api/v1/races/upcoming")
    race2_id = race2_response.json()["items"][1]["id"]
    
    # Rotate draft order for race 2
    rotate_response = await client.post(
        f"/api/v1/leagues/{league_id}/draft-order/{race2_id}/rotate"
    )
    assert rotate_response.status_code == 200
    
    # Get rotated draft order
    race2_response = await client.get(f"/api/v1/races/{race2_id}/draft-order")
    draft2 = race2_response.json()["draft_order"]
    
    # Verify rotation
    # Last constructor in draft1 should be first in draft2
    assert draft2[0]["constructor_id"] == draft1[-1]["constructor_id"]
```

### Tie Breaking Test

**Scenario**: Test tie-breaking logic when constructors have equal points.

```python
# tests/unit/test_scoring_service.py
import pytest
from app.services.scoring_service import ScoringService

@pytest.mark.asyncio
async def test_tie_breaking(db_session):
    """Test tie-breaking by highest driver points."""
    
    # Setup: Create two constructors with same total points
    constructor1_id = 1
    constructor2_id = 2
    race_id = 1
    
    # Constructor 1 has drivers with 25 and 18 points
    # Constructor 2 has drivers with 25 and 18 points (same total)
    
    # Make constructor 1's driver have fastest lap (bonus point)
    # Constructor 1 total: 25 + (18 + 1) = 44
    # Constructor 2 total: 25 + 18 = 43
    
    scoring_service = ScoringService(db_session)
    
    # Get both constructors
    result = await db_session.execute(
        select(Constructor).where(Constructor.id.in_([constructor1_id, constructor2_id]))
    )
    constructors = result.scalars().all()
    
    # Resolve tie
    winner = await scoring_service.resolve_tie(
        constructors[0],
        constructors[1],
        race_id
    )
    
    # Constructor 1 should win due to faster lap bonus
    assert winner.id == constructor1_id
```

---

## Data Generation Utilities

### Factory Boy Integration

**Purpose**: Generate realistic test data using factories.

**Installation** (Already in requirements-dev.txt):
```
factory-boy==3.3.0
faker==20.1.0
```

**Implementation**:

```python
# tests/factories.py
import factory
from faker import Faker
from datetime import datetime, timedelta
from app.models.user import User
from app.models.league import League
from app.models.constructor import Constructor
from app.models.race import Race
from app.models.driver import Driver

faker = Faker()


class UserFactory(factory.Factory):
    """Factory for creating test users."""
    
    class Meta:
        model = User
    
    username = factory.LazyFunction(lambda: faker.user_name())
    email = factory.LazyFunction(lambda: faker.email())
    password = factory.PostGenerationMethodCall('set_password', 'TestPassword123!')
    is_active = True
    is_admin = False


class LeagueFactory(factory.Factory):
    """Factory for creating test leagues."""
    
    class Meta:
        model = League
    
    name = factory.LazyFunction(lambda: f"Test League {faker.word()}")
    max_players = factory.LazyFunction(lambda: faker.random_int(min=5, max=20))
    is_public = True
    draft_method = "sequential"


class ConstructorFactory(factory.Factory):
    """Factory for creating test constructors."""
    
    class Meta:
        model = Constructor
    
    league_id = factory.SubFactory(LeagueFactory)
    user_id = factory.SubFactory(UserFactory)
    team_name = factory.LazyFunction(lambda: f"{faker.company()} Racing")
    total_points = factory.LazyFunction(lambda: faker.random_float(min=0, max=1000))
    rank = factory.LazyFunction(lambda: faker.random_int(min=1, max=20))


class DriverFactory(factory.Factory):
    """Factory for creating test drivers."""
    
    class Meta:
        model = Driver
    
    jolpica_id = factory.LazyFunction(lambda: faker.uuid4())
    first_name = factory.LazyFunction(lambda: faker.first_name())
    last_name = factory.LazyFunction(lambda: faker.last_name())
    number = factory.LazyFunction(lambda: faker.random_int(min=1, max=99))
    code = factory.LazyFunction(lambda: faker.name()[:3].upper())
    nationality = factory.LazyFunction(lambda: faker.country())
```

### Using Factories in Tests

```python
# tests/integration/test_league_api.py
import pytest
from tests.factories import UserFactory, LeagueFactory, ConstructorFactory

@pytest.mark.asyncio
async def test_create_league(db_session, client: AsyncClient):
    """Test creating a league."""
    # Create test user
    user = await UserFactory.create_async(db_session)
    
    # Login and get token
    # ... (login code)
    
    # Create league
    league_data = {
        "name": "New Test League",
        "max_players": 10,
        "is_public": True
    }
    
    response = await client.post(
        "/api/v1/leagues/",
        json=league_data
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == league_data["name"]
    assert data["max_players"] == league_data["max_players"]
```

---

## Testing Strategy

### Test Pyramid

```
        E2E Tests (5%)
         /\ acceptance testing, user journeys
        /  \
       /    \
      /      \
     /        \
    /          \
   /------------\
  Integration Tests (15%)
   / API testing, database interactions
  /  \
 /    \
/______\
Unit Tests (80%)
  individual functions, services, models
```

### Unit Testing

**Focus**: Test individual functions, services, and models in isolation.

**Examples**:
- `DraftService.generate_initial_draft_order()`
- `ScoringService.calculate_constructor_points()`
- `User.set_password()` and `User.check_password()`

**Tools**: pytest, pytest-asyncio, unittest.mock

### Integration Testing

**Focus**: Test interactions between components (API, database, external services).

**Examples**:
- Full draft flow: create league → join → draft → score
- API endpoint with database operations
- Service with database queries

**Tools**: pytest, httpx, test database

### End-to-End Testing

**Focus**: Test complete user journeys and scenarios.

**Examples**:
- User registers, creates league, drafts drivers, views leaderboard
- Draft order rotation across multiple races
- Tie-breaking scenarios

**Tools**: pytest, AsyncClient, mock Jolpica API

### Database Testing

**Strategy**:
- Use test database (PostgreSQL or SQLite)
- Clean database before each test
- Rollback transactions after each test
- Use fixtures for common data

**Implementation**:
```python
# tests/conftest.py
@pytest.fixture(scope="function")
async def db_session():
    """Create a fresh database session for each test."""
    async with TestSessionLocal() as session:
        # Run migrations
        await run_migrations(session)
        
        yield session
        
        # Rollback all changes
        await session.rollback()
```

---

## Environment-Specific Data

### Development Environment

**Purpose**: Local development with realistic data.

**Data Sources**:
- Jolpica API for current season data
- Generated test races for next 12 Sundays
- Sample leagues and users

**Cleanup**:
- Data persists between application restarts
- Can be regenerated with seed script
- Not automatically cleaned

### Test Environment

**Purpose**: Automated testing with isolated data.

**Data Sources**:
- Mock Jolpica API responses
- Factories for test data
- Fixtures for common scenarios

**Cleanup**:
- Clean database before each test run
- Rollback transactions after each test
- Isolated test data

### Staging Environment

**Purpose**: Pre-production testing with realistic data.

**Data Sources**:
- Jolpica API for current season data
- Sample leagues created by QA team
- Test users for QA testing

**Cleanup**:
- Data persists like production
- Can be reset via admin panel
- Periodic cleanup of old test leagues

### Production Environment

**Purpose**: Live production data.

**Data Sources**:
- Jolpica API for current season data
- Real user data
- Real leagues and constructors

**Cleanup**:
- No automatic cleanup
- Manual data management by admin
- Backup and retention policies

---

## Summary

This document provides a comprehensive test data strategy for the Fantasy F1 MVP:

### Key Points

1. **Seed Data**: Generated from Jolpica API on app start, with create-or-update methodology
2. **Test Fixtures**: Mock Jolpica API responses for reliable testing
3. **Test Scenarios**: Complete user flows, draft rotation, tie-breaking
4. **Data Generation**: Factory Boy for realistic test data
5. **Testing Strategy**: Unit, integration, and E2E tests
6. **Environment-Specific Data**: Different strategies for dev, test, staging, production

### Next Steps

- Implement seed data script for development
- Create test fixtures for Jolpica API
- Write comprehensive E2E tests
- Set up factory integration
- Configure test database cleanup

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-09 | Project Lead | Initial test data strategy documentation |