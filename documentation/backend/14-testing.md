# Testing Strategy

This document describes the comprehensive testing strategy for the Fantasy F1 Backend system.

---

## Testing Overview

Testing is critical to ensure system quality and reliability. The testing strategy includes:
- Unit testing
- Integration testing
- End-to-end testing
- Performance testing
- Security testing

---

## Testing Pyramid

```
        /\
       /E2E\        - 10% (End-to-End)
      /------\
     /Integration\   - 30% (Integration)
    /------------\
   /   Unit        \ - 60% (Unit)
  /----------------\
```

---

## Unit Testing

### Test Setup

```python
# tests/conftest.py
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

@pytest.fixture
async def db_session():
    """Create test database session."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with async_session() as session:
        yield session
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

### Service Layer Tests

```python
# tests/test_services/test_team_service.py
import pytest
from app.services.team_service import TeamService
from app.core.exceptions import ValidationError

@pytest.mark.asyncio
async def test_create_team_success(db_session):
    """Test successful team creation."""
    team_service = TeamService(db_session)
    
    # Create test data
    league = create_test_league(db_session)
    user = create_test_user(db_session)
    
    team_data = TeamCreate(
        name="Test Team",
        league_id=league.id,
        captain_id=1,
        drivers=[1, 2, 3, 4, 5]
    )
    
    team = await team_service.create_team(team_data, user.id)
    
    assert team.name == "Test Team"
    assert team.user_id == user.id
    assert len(team.drivers) == 5

@pytest.mark.asyncio
async def test_create_team_exceeds_budget(db_session):
    """Test team creation with budget exceeded."""
    team_service = TeamService(db_session)
    
    # Create expensive drivers
    create_expensive_drivers(db_session)
    
    team_data = TeamCreate(
        name="Expensive Team",
        league_id=1,
        captain_id=1,
        drivers=[1, 2, 3, 4, 5]
    )
    
    with pytest.raises(ValidationError) as exc_info:
        await team_service.create_team(team_data, 1)
    
    assert "exceeds budget" in str(exc_info.value)

@pytest.mark.asyncio
async def test_create_team_too_many_drivers_same_team(db_session):
    """Test team validation - too many drivers from same team."""
    team_service = TeamService(db_session)
    
    create_test_data(db_session)
    
    # Select 3 drivers from same team (max is 2)
    team_data = TeamCreate(
        name="Invalid Team",
        league_id=1,
        captain_id=1,
        drivers=[1, 2, 3, 4, 5]  # Assume drivers 1,2,3 are from Mercedes
    )
    
    with pytest.raises(ValidationError) as exc_info:
        await team_service.create_team(team_data, 1)
    
    assert "Too many drivers" in str(exc_info.value)
```

### Scoring Tests

```python
# tests/test_services/test_scoring_service.py
@pytest.mark.asyncio
async def test_calculate_team_points(db_session):
    """Test team points calculation."""
    scoring_service = ScoringService(db_session)
    
    # Create test race results
    create_race_results(db_session, race_id=1)
    
    # Create test team
    team = create_test_team(db_session)
    
    points = await scoring_service.calculate_team_points(team.id, race_id=1)
    
    # Verify points calculation
    assert points.total == expected_total
    assert points.captain_points == captain_position_points * 2

@pytest.mark.asyncio
async def test_position_points(db_session):
    """Test points by finishing position."""
    scoring_service = ScoringService(db_session)
    
    # Test standard positions
    assert scoring_service.position_points(1) == 25
    assert scoring_service.position_points(2) == 18
    assert scoring_service.position_points(10) == 1
    assert scoring_service.position_points(11) == 0

@pytest.mark.asyncio
async def test_fastest_lap_bonus(db_session):
    """Test fastest lap bonus calculation."""
    scoring_service = ScoringService(db_session)
    
    # Driver with fastest lap
    points = await scoring_service.calculate_driver_points(
        driver_id=1,
        race_id=1
    )
    
    assert points.fastest_lap_bonus == 1
```

### Model Tests

```python
# tests/test_models/test_team.py
def test_team_budget_validation(db_session):
    """Test team budget validation."""
    team = Team(
        name="Test Team",
        budget_left=-10.0  # Invalid
    )
    
    with pytest.raises(ValidationError):
        team.validate()

def test_team_driver_limit():
    """Test maximum number of drivers."""
    team = Team()
    
    # Try to add 6 drivers (max is 5)
    with pytest.raises(ValidationError):
        team.add_drivers([1, 2, 3, 4, 5, 6])
```

---

## Integration Testing

### API Endpoint Tests

```python
# tests/test_api/test_teams.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.mark.asyncio
async def test_create_team_endpoint(db_session):
    """Test team creation via API."""
    # Create test user and get token
    response = client.post("/api/v1/auth/login", json={
        "username": "testuser",
        "password": "testpassword"
    })
    token = response.json()["access_token"]
    
    # Create team
    headers = {"Authorization": f"Bearer {token}"}
    response = client.post(
        "/api/v1/teams",
        json={
            "name": "My Team",
            "league_id": 1,
            "captain_id": 1,
            "drivers": [1, 2, 3, 4, 5]
        },
        headers=headers
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Team"
    assert data["league_id"] == 1

@pytest.mark.asyncio
async def test_unauthorized_team_access(db_session):
    """Test unauthorized team access."""
    # Try to access team without authentication
    response = client.get("/api/v1/teams/999")
    
    assert response.status_code == 401
    assert "not authenticated" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_user_can_only_access_own_teams(db_session):
    """Test user can only access their own teams."""
    # Create two users
    user1_token = create_user_and_get_token("user1")
    user2_token = create_user_and_get_token("user2")
    
    # User1 creates a team
    headers1 = {"Authorization": f"Bearer {user1_token}"}
    response = client.post(
        "/api/v1/teams",
        json={"name": "User1 Team", "league_id": 1, "captain_id": 1, "drivers": [1, 2, 3, 4, 5]},
        headers=headers1
    )
    team_id = response.json()["id"]
    
    # User2 tries to access User1's team
    headers2 = {"Authorization": f"Bearer {user2_token}"}
    response = client.get(f"/api/v1/teams/{team_id}", headers=headers2)
    
    assert response.status_code == 403
```

### Database Integration Tests

```python
# tests/test_integration/test_database.py
@pytest.mark.asyncio
async def test_team_crud_operations(db_session):
    """Test complete CRUD operations for teams."""
    # Create
    team = Team(name="Test", user_id=1, league_id=1)
    db_session.add(team)
    await db_session.commit()
    await db_session.refresh(team)
    
    # Read
    retrieved = await db_session.get(Team, team.id)
    assert retrieved.name == "Test"
    
    # Update
    retrieved.name = "Updated"
    await db_session.commit()
    await db_session.refresh(retrieved)
    
    updated = await db_session.get(Team, team.id)
    assert updated.name == "Updated"
    
    # Delete
    await db_session.delete(updated)
    await db_session.commit()
    
    deleted = await db_session.get(Team, team.id)
    assert deleted is None

@pytest.mark.asyncio
async def test_race_results_with_drivers(db_session):
    """Test race results with driver relationships."""
    # Create race and drivers
    race = create_test_race(db_session)
    driver1 = create_test_driver(db_session, name="Driver1")
    driver2 = create_test_driver(db_session, name="Driver2")
    
    # Create results
    result1 = RaceResult(race_id=race.id, driver_id=driver1.id, position=1, points=25)
    result2 = RaceResult(race_id=race.id, driver_id=driver2.id, position=2, points=18)
    
    db_session.add_all([result1, result2])
    await db_session.commit()
    
    # Query with relationships
    results = await db_session.execute(
        select(RaceResult)
        .options(selectinload(RaceResult.driver))
        .where(RaceResult.race_id == race.id)
        .order_by(RaceResult.position)
    )
    
    race_results = results.scalars().all()
    
    assert len(race_results) == 2
    assert race_results[0].driver.name == "Driver1"
    assert race_results[1].driver.name == "Driver2"
```

### Authentication Integration Tests

```python
# tests/test_integration/test_auth.py
@pytest.mark.asyncio
async def test_complete_auth_flow(db_session):
    """Test complete authentication flow."""
    # Register
    register_response = client.post("/api/v1/auth/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "StrongPass123"
    })
    assert register_response.status_code == 201
    
    # Login
    login_response = client.post("/api/v1/auth/login", json={
        "username": "newuser",
        "password": "StrongPass123"
    })
    assert login_response.status_code == 200
    
    access_token = login_response.json()["access_token"]
    refresh_token = login_response.json()["refresh_token"]
    
    # Use access token
    headers = {"Authorization": f"Bearer {access_token}"}
    response = client.get("/api/v1/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == "newuser"
    
    # Refresh token
    refresh_response = client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_token
    })
    assert refresh_response.status_code == 200
    
    new_access_token = refresh_response.json()["access_token"]
    assert new_access_token != access_token
```

---

## Celery Task Tests

```python
# tests/test_tasks/test_race_tasks.py
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_sync_race_results_task(db_session):
    """Test race results sync task."""
    # Mock external API
    with patch('app.services.race_service.fetch_results_from_api') as mock_fetch:
        mock_fetch.return_value = [
            {"driver_id": 1, "position": 1, "points": 25},
            {"driver_id": 2, "position": 2, "points": 18}
        ]
        
        # Execute task
        from app.tasks.race_tasks import sync_race_results
        await sync_race_results(race_id=1)
        
        # Verify results stored
        results = await db_session.execute(
            select(RaceResult).where(RaceResult.race_id == 1)
        )
        race_results = results.scalars().all()
        
        assert len(race_results) == 2
        assert race_results[0].position == 1

@pytest.mark.asyncio
async def test_sync_race_results_retry_on_failure(db_session):
    """Test task retry on API failure."""
    with patch('app.services.race_service.fetch_results_from_api') as mock_fetch:
        # First call fails, second succeeds
        mock_fetch.side_effect = [
            ConnectionError("API unavailable"),
            [{"driver_id": 1, "position": 1, "points": 25}]
        ]
        
        from app.tasks.race_tasks import sync_race_results
        
        # This should retry and succeed
        await sync_race_results(race_id=1, retries=2)
        
        # Verify results eventually stored
        results = await db_session.execute(
            select(RaceResult).where(RaceResult.race_id == 1)
        )
        assert results.scalar_one() is not None
```

---

## Performance Testing

### Load Testing with Locust

```python
# tests/locustfile.py
from locust import HttpUser, task, between

class FantasyF1User(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login on start."""
        response = self.client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "testpassword"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def get_leaderboard(self):
        """View leaderboard."""
        self.client.get("/api/v1/leagues/1/leaderboard", headers=self.headers)
    
    @task(2)
    def get_team(self):
        """View own team."""
        self.client.get("/api/v1/teams/1", headers=self.headers)
    
    @task(1)
    def get_driver_rankings(self):
        """View driver rankings."""
        self.client.get("/api/v1/drivers/rankings")
```

Run load tests:
```bash
locust -f tests/locustfile.py --host=http://localhost:8000
```

### Database Query Performance

```python
# tests/test_performance/test_queries.py
@pytest.mark.asyncio
async def test_leaderboard_query_performance(db_session):
    """Test leaderboard query performance."""
    import time
    
    # Create large dataset
    create_large_dataset(db_session, teams=1000, races=20)
    
    # Measure query time
    start = time.time()
    result = await db_session.execute(
        select(Team)
        .options(selectinload(Team.team_drivers))
        .where(Team.league_id == 1)
        .order_by(Team.total_points.desc())
        .limit(50)
    )
    teams = result.scalars().all()
    duration = time.time() - start
    
    # Query should be fast (< 100ms)
    assert duration < 0.1, f"Query took {duration}s, expected < 0.1s"
    assert len(teams) == 50
```

---

## Security Testing

### Input Validation Tests

```python
# tests/test_security/test_input_validation.py
def test_sql_injection_prevention(db_session):
    """Test SQL injection is prevented."""
    # This should be safely parameterized
    malicious_input = "1' OR '1'='1"
    
    result = await db_session.execute(
        select(User).where(User.username == malicious_input)
    )
    
    # Should not return unexpected results
    users = result.scalars().all()
    assert len(users) == 0 or all(u.username == malicious_input for u in users)

def test_xss_prevention():
    """Test XSS is prevented."""
    from html import escape
    
    malicious_script = "<script>alert('xss')</script>"
    sanitized = escape(malicious_script)
    
    assert "<script>" not in sanitized
    assert "<script>" in sanitized

@pytest.mark.asyncio
async def test_password_hashing(db_session):
    """Test passwords are properly hashed."""
    plain_password = "MyPassword123"
    
    # Create user
    hashed = hash_password(plain_password)
    
    assert hashed != plain_password
    assert hashed.startswith("$2b$")  # bcrypt hash prefix
    
    # Verify can check password
    assert verify_password(plain_password, hashed)
    assert not verify_password("WrongPassword", hashed)
```

### Authorization Tests

```python
# tests/test_security/test_authorization.py
@pytest.mark.asyncio
async def test_user_cannot_access_other_user_team(db_session):
    """Test users cannot access other users' teams."""
    # Create two users
    user1 = create_test_user(db_session, username="user1")
    user2 = create_test_user(db_session, username="user2")
    
    # User1 creates team
    team = create_test_team(db_session, user_id=user1.id, team_id=1)
    
    # User2 tries to access
    with pytest.raises(PermissionError):
        verify_team_ownership(1, user2.id)

@pytest.mark.asyncio
async def test_admin_access(db_session):
    """Test admin can access all resources."""
    admin = create_test_admin(db_session)
    
    # Admin should be able to access any team
    team = verify_team_ownership(1, admin.id)
    assert team is not None
```

---

## Test Coverage

### Coverage Targets
- **Overall**: > 80%
- **Models**: > 90%
- **Services**: > 85%
- **API Endpoints**: > 75%
- **Tasks**: > 80%

### Running Coverage

```bash
# Run tests with coverage
pytest --cov=app --cov-report=html --cov-report=term

# View coverage report
open htmlcov/index.html
```

### Coverage Configuration

```ini
# .coveragerc
[run]
source = app
omit = 
    */tests/*
    */venv/*
    */migrations/*
    app/main.py

[report]
exclude_lines =
    pragma: no cover
    def __repr__
    raise AssertionError
    raise NotImplementedError
    if __name__ == .__main__.:
```

---

## Test Data Management

### Fixtures for Common Data

```python
# tests/fixtures/data.py
@pytest.fixture
def test_user(db_session):
    """Create test user."""
    user = User(
        username="testuser",
        email="test@example.com",
        hashed_password=hash_password("testpass")
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_league(db_session):
    """Create test league."""
    league = League(
        name="Test League",
        code="TEST",
        is_public=True
    )
    db_session.add(league)
    db_session.commit()
    db_session.refresh(league)
    return league

@pytest.fixture
def test_drivers(db_session):
    """Create test drivers."""
    drivers = []
    for i in range(20):
        driver = Driver(
            name=f"Driver {i}",
            team_name=f"Team {(i // 2) + 1}",
            number=i + 1,
            price=10.0 + (i * 0.5)
        )
        db_session.add(driver)
        drivers.append(driver)
    
    db_session.commit()
    return drivers
```

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-test.txt
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost/test_db
        run: pytest --cov=app --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Best Practices

### 1. Test Naming
- Use descriptive test names
- Follow pattern: `test_<functionality>_<scenario>`
- Group related tests in classes

### 2. Test Structure
- Arrange-Act-Assert (AAA) pattern
- Keep tests independent
- One assertion per test when possible

### 3. Mocking
- Mock external dependencies
- Use fixtures for common setup
- Reset state between tests

### 4. Test Data
- Use factories for test data
- Clean up after tests
- Keep test data minimal

### 5. CI/CD
- Run tests on every commit
- Fail build on test failure
- Monitor coverage trends

---

## Related Documentation

- [Implementation Roadmap](implementation_roadmap.md) - Testing in development phases
- [Error Handling](error_handling.md) - Testing error scenarios
- [Security](security.md) - Security testing
- [Performance](performance.md) - Performance testing