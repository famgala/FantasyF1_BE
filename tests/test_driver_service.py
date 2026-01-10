"""Integration tests for DriverService."""

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.driver import DriverCreate, DriverUpdate
from app.services.driver_service import DriverService


@pytest.mark.asyncio()
async def test_create_driver(db: AsyncSession):
    """Test creating a new driver."""
    driver_data = DriverCreate(
        name="Test Driver",
        number=1,
        nationality="British",
        team="Test Team",
        points=100,
    )

    driver = await DriverService.create(db, driver_data)

    assert driver.id is not None
    assert driver.name == "Test Driver"
    assert driver.number == 1
    assert driver.nationality == "British"
    assert driver.team == "Test Team"
    assert driver.points == 100


@pytest.mark.asyncio()
async def test_get_driver_by_id(db: AsyncSession):
    """Test getting a driver by ID."""
    driver_data = DriverCreate(
        name="Get Test Driver",
        number=2,
        nationality="German",
        team="Get Test Team",
        points=50,
    )

    created_driver = await DriverService.create(db, driver_data)
    retrieved_driver = await DriverService.get_by_id(db, created_driver.id)

    assert retrieved_driver is not None
    assert retrieved_driver.id == created_driver.id
    assert retrieved_driver.name == "Get Test Driver"


@pytest.mark.asyncio()
async def test_get_driver_by_id_not_found(db: AsyncSession):
    """Test getting a non-existent driver."""
    driver = await DriverService.get_by_id(db, 99999)
    assert driver is None


@pytest.mark.asyncio()
async def test_get_by_name(db: AsyncSession):
    """Test getting a driver by name."""
    driver_data = DriverCreate(
        name="Name Test Driver",
        number=3,
        nationality="French",
        team="Name Test Team",
        points=75,
    )

    await DriverService.create(db, driver_data)
    retrieved_driver = await DriverService.get_by_name(db, "Name Test Driver")

    assert retrieved_driver is not None
    assert retrieved_driver.name == "Name Test Driver"


@pytest.mark.asyncio()
async def test_get_all_drivers(db: AsyncSession):
    """Test getting all drivers."""
    # Create multiple drivers
    await DriverService.create(
        db, DriverCreate(name="Driver 1", number=1, nationality="A", team="Team A", points=10)
    )
    await DriverService.create(
        db, DriverCreate(name="Driver 2", number=2, nationality="B", team="Team B", points=20)
    )
    await DriverService.create(
        db, DriverCreate(name="Driver 3", number=3, nationality="C", team="Team C", points=30)
    )

    drivers = await DriverService.get_all(db, skip=0, limit=10)

    assert len(drivers) >= 3


@pytest.mark.asyncio()
async def test_search_drivers(db: AsyncSession):
    """Test searching drivers by name."""
    # Create drivers
    await DriverService.create(
        db, DriverCreate(name="Search Driver 1", number=5, nationality="D", team="Team D", points=5)
    )
    await DriverService.create(
        db,
        DriverCreate(name="Search Driver 2", number=6, nationality="E", team="Team E", points=15),
    )

    results = await DriverService.search(db, search_term="Search", skip=0, limit=10)

    assert len(results) >= 2
    for driver in results:
        assert "Search" in driver.name


@pytest.mark.asyncio()
async def test_update_driver(db: AsyncSession):
    """Test updating a driver."""
    driver_data = DriverCreate(
        name="Update Test Driver",
        number=7,
        nationality="Italian",
        team="Update Test Team",
        points=40,
    )

    created_driver = await DriverService.create(db, driver_data)

    update_data = DriverUpdate(points=150, team="Updated Team")
    updated_driver = await DriverService.update(db, created_driver, update_data)

    assert updated_driver.points == 150
    assert updated_driver.team == "Updated Team"
    assert updated_driver.name == "Update Test Driver"  # Name unchanged


@pytest.mark.asyncio()
async def test_delete_driver(db: AsyncSession):
    """Test deleting a driver."""
    driver_data = DriverCreate(
        name="Delete Test Driver",
        number=8,
        nationality="Spanish",
        team="Delete Test Team",
        points=60,
    )

    created_driver = await DriverService.create(db, driver_data)
    driver_id = created_driver.id

    await DriverService.delete(db, created_driver)

    deleted_driver = await DriverService.get_by_id(db, driver_id)
    assert deleted_driver is None


@pytest.mark.asyncio()
async def test_count_drivers(db: AsyncSession):
    """Test counting drivers."""
    initial_count = await DriverService.count(db)

    # Add drivers
    await DriverService.create(
        db, DriverCreate(name="Count Driver 1", number=9, nationality="F", team="Team F", points=1)
    )
    await DriverService.create(
        db, DriverCreate(name="Count Driver 2", number=10, nationality="G", team="Team G", points=2)
    )

    new_count = await DriverService.count(db)
    assert new_count >= initial_count + 2


@pytest.mark.asyncio()
async def test_get_drivers_by_team(db: AsyncSession):
    """Test getting drivers filtered by team."""
    team_name = "Team Filter Test"

    # Create drivers for the same team
    await DriverService.create(
        db,
        DriverCreate(
            name="Team Filter Driver 1", number=11, nationality="H", team=team_name, points=100
        ),
    )
    await DriverService.create(
        db,
        DriverCreate(
            name="Team Filter Driver 2", number=12, nationality="I", team=team_name, points=200
        ),
    )

    drivers = await DriverService.get_all(db, team=team_name, skip=0, limit=10)

    for driver in drivers:
        assert driver.team == team_name
