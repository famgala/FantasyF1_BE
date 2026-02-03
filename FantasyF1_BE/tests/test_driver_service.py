"""Integration tests for DriverService."""

# type: ignore

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.driver import DriverCreate, DriverUpdate
from app.services.driver_service import DriverService


@pytest.mark.asyncio
async def test_create_driver(db: AsyncSession):
    """Test creating a new driver."""
    driver_data = DriverCreate(
        code="TDR",
        external_id=1,
        name="Test Driver",
        number=1,
        country="British",
        team_name="Test Team",
    )

    driver = await DriverService.create(db, driver_data)

    assert driver.id is not None
    assert driver.name == "Test Driver"
    assert driver.number == 1
    assert driver.country == "British"
    assert driver.team_name == "Test Team"


@pytest.mark.asyncio
async def test_get_driver_by_id(db: AsyncSession):
    """Test getting a driver by ID."""
    driver_data = DriverCreate(
        code="GTD",
        external_id=2,
        name="Get Test Driver",
        number=2,
        country="German",
        team_name="Get Test Team",
    )

    created_driver = await DriverService.create(db, driver_data)
    retrieved_driver = await DriverService.get_by_id(db, created_driver.id)

    assert retrieved_driver is not None
    assert retrieved_driver.id == created_driver.id
    assert retrieved_driver.name == "Get Test Driver"


@pytest.mark.asyncio
async def test_get_driver_by_id_not_found(db: AsyncSession):
    """Test getting a non-existent driver."""
    driver = await DriverService.get_by_id(db, 99999)
    assert driver is None


@pytest.mark.asyncio
async def test_get_by_name(db: AsyncSession):
    """Test getting a driver by name."""
    driver_data = DriverCreate(
        code="NTD",
        external_id=3,
        name="Name Test Driver",
        number=3,
        country="French",
        team_name="Name Test Team",
    )

    await DriverService.create(db, driver_data)
    retrieved_driver = await DriverService.get_by_name(db, "Name Test Driver")

    assert retrieved_driver is not None
    assert retrieved_driver.name == "Name Test Driver"


@pytest.mark.asyncio
async def test_get_all_drivers(db: AsyncSession):
    """Test getting all drivers."""
    # Create multiple drivers
    await DriverService.create(
        db,
        DriverCreate(
            code="D1",
            external_id=10,
            name="Driver 1",
            number=1,
            country="A",
            team_name="Team A",
        ),
    )
    await DriverService.create(
        db,
        DriverCreate(
            code="D2",
            external_id=11,
            name="Driver 2",
            number=2,
            country="B",
            team_name="Team B",
        ),
    )
    await DriverService.create(
        db,
        DriverCreate(
            code="D3",
            external_id=12,
            name="Driver 3",
            number=3,
            country="C",
            team_name="Team C",
        ),
    )

    drivers = await DriverService.get_all(db, skip=0, limit=10)

    assert len(drivers) >= 3


@pytest.mark.asyncio
async def test_search_drivers(db: AsyncSession):
    """Test searching drivers by name."""
    # Create drivers
    await DriverService.create(
        db,
        DriverCreate(
            code="SD1",
            external_id=13,
            name="Search Driver 1",
            number=5,
            country="D",
            team_name="Team D",
        ),
    )
    await DriverService.create(
        db,
        DriverCreate(
            code="SD2",
            external_id=14,
            name="Search Driver 2",
            number=6,
            country="E",
            team_name="Team E",
        ),
    )

    results = await DriverService.search(db, search_term="Search", skip=0, limit=10)

    assert len(results) >= 2
    for driver in results:
        assert "Search" in driver.name


@pytest.mark.asyncio
async def test_update_driver(db: AsyncSession):
    """Test updating a driver."""
    driver_data = DriverCreate(
        code="UTD",
        external_id=15,
        name="Update Test Driver",
        number=7,
        country="Italian",
        team_name="Update Test Team",
    )

    created_driver = await DriverService.create(db, driver_data)

    update_data = DriverUpdate(
        total_points=150,
        team_name="Updated Team",
        status="active",
        average_points=15.0,
        price=10000000,
    )
    updated_driver = await DriverService.update(db, created_driver, update_data)

    assert updated_driver.total_points == 150
    assert updated_driver.team_name == "Updated Team"
    assert updated_driver.name == "Update Test Driver"  # Name unchanged


@pytest.mark.asyncio
async def test_delete_driver(db: AsyncSession):
    """Test deleting a driver."""
    driver_data = DriverCreate(
        code="DT",
        external_id=16,
        name="Delete Test Driver",
        number=8,
        country="Spanish",
        team_name="Delete Test Team",
    )

    created_driver = await DriverService.create(db, driver_data)
    driver_id = created_driver.id

    await DriverService.delete(db, created_driver)

    deleted_driver = await DriverService.get_by_id(db, driver_id)
    assert deleted_driver is None


@pytest.mark.asyncio
async def test_count_drivers(db: AsyncSession):
    """Test counting drivers."""
    initial_count = await DriverService.count(db)

    # Add drivers
    await DriverService.create(
        db,
        DriverCreate(
            code="CD1",
            external_id=17,
            name="Count Driver 1",
            number=9,
            country="F",
            team_name="Team F",
        ),
    )
    await DriverService.create(
        db,
        DriverCreate(
            code="CD2",
            external_id=18,
            name="Count Driver 2",
            number=10,
            country="G",
            team_name="Team G",
        ),
    )

    new_count = await DriverService.count(db)
    assert new_count >= initial_count + 2


@pytest.mark.asyncio
async def test_get_drivers_by_team(db: AsyncSession):
    """Test getting drivers filtered by team."""
    team_name = "Team Filter Test"

    # Create drivers for the same team
    await DriverService.create(
        db,
        DriverCreate(
            code="TF1",
            external_id=19,
            name="Team Filter Driver 1",
            number=11,
            country="H",
            team_name=team_name,
        ),
    )
    await DriverService.create(
        db,
        DriverCreate(
            code="TF2",
            external_id=20,
            name="Team Filter Driver 2",
            number=12,
            country="I",
            team_name=team_name,
        ),
    )

    drivers = await DriverService.get_all(db, skip=0, limit=10)

    # Filter drivers by team_name in the test
    team_drivers = [d for d in drivers if d.team_name == team_name]
    assert len(team_drivers) >= 2
    for driver in team_drivers:
        assert driver.team_name == team_name
