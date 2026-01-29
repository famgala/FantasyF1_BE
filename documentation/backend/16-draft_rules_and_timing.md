# Draft Rules and Timing

## Document Overview

This document defines the draft timing, rules, and behavior for the Fantasy F1 MVP. It outlines when drafts open and close, how draft order is determined, and the rules for driver selection.

**Date**: 2026-01-09
**Status**: MVP Scope

---

## Draft Window Timing

### Draft Opens

**Time**: 08:00 AM EST Monday
**Condition**: Before each race in the season

**Implementation**:
```python
def calculate_draft_open_time(race_date: datetime) -> datetime:
    """
    Calculate draft opening time (Monday 08:00 AM EST before race).
    
    Args:
        race_date: Scheduled race date/time
        
    Returns:
        Draft opening datetime in EST
    """
    # Find Monday before race
    race_est = convert_to_est(race_date)
    days_until_monday = (race_est.weekday() - 0) % 7  # Monday = 0
    if days_until_monday > 0:
        days_until_monday += 7  # Go to previous Monday
    
    draft_open = race_est - timedelta(days=days_until_monday)
    draft_open = draft_open.replace(hour=8, minute=0, second=0, microsecond=0)
    
    return draft_open
```

### Draft Closes

**Condition**: Whichever occurs first:
1. All constructors have made their 2 driver picks, OR
2. Qualifying starts

**Implementation**:
```python
def calculate_draft_close_time(race_timing: RaceTiming) -> datetime:
    """
    Calculate draft closing time (qualifying start or when complete).
    
    Args:
        race_timing: Race timing information with qualifying times
        
    Returns:
        Draft closing datetime in EST
    """
    qualifying_start = race_timing.qualification_start_est
    
    # Draft closes at qualifying start time
    return qualifying_start


def is_draft_complete(constructor_drafts: List[DriverDraft]) -> bool:
    """
    Check if a constructor has completed their draft picks.
    
    Args:
        constructor_drafts: List of driver drafts for this race
        
    Returns:
        True if constructor has 2 drivers picked
    """
    return len(constructor_drafts) >= 2


async def is_draft_closed(race: Race, league_id: int, db: AsyncSession) -> bool:
    """
    Check if draft is closed for a race in a league.
    
    Args:
        race: Race to check
        league_id: League to check
        
    Returns:
        True if draft is closed
    """
    now = datetime.now(ZoneInfo("America/New_York"))
    
    # Check if we've passed qualifying time
    if now >= race.qualification_start_est:
        return True
    
    # Check if all constructors have completed picks
    result = await db.execute(
        select(Constructor).where(Constructor.league_id == league_id)
    )
    constructors = result.scalars().all()
    
    for constructor in constructors:
        drafts_result = await db.execute(
            select(DriverDraft).where(
                DriverDraft.constructor_id == constructor.id,
                DriverDraft.race_id == race.id
            )
        )
        drafts = drafts_result.scalars().all()
        
        if len(drafts) < 2:
            return False
    
    return True
```

---

## Draft Order Rules

### Initial Draft Order

**Random Shuffle**: For the first race of the season, draft order is randomly shuffled.

**Implementation**:
```python
import random
from typing import List

async def generate_initial_draft_order(constructors: List[Constructor]) -> List[int]:
    """
    Generate initial random draft order for new season first race.
    
    Args:
        constructors: List of constructors in the league
        
    Returns:
        List of constructor_ids in draft order
    """
    if not constructors:
        return []
    
    constructor_ids = [c.id for c in constructors]
    random.shuffle(constructor_ids)
    
    return constructor_ids


async def save_draft_order(
    league_id: int,
    race_id: int,
    constructor_ids: List[int],
    modifier_id: int,
    db: AsyncSession
) -> DraftOrder:
    """
    Save draft order to database.
    
    Args:
        league_id: League ID
        race_id: Race ID
        constructor_ids: List of constructor IDs in draft order
        modifier_id: ID of user who set the order
        db: Database session
        
    Returns:
        Created DraftOrder record
    """
    draft_order = DraftOrder(
        league_id=league_id,
        race_id=race_id,
        method="sequential",  # Default for initial
        order_data=constructor_ids,
        is_manual=False,
        last_modified_by=modifier_id,
        last_modified_at=datetime.utcnow()
    )
    
    db.add(draft_order)
    await db.commit()
    await db.refresh(draft_order)
    
    return draft_order
```

### Draft Order Rotation

**Rule**: Last constructor to draft becomes first to draft next race.

**Implementation**:
```python
async def rotate_draft_order(
    previous_draft_order: DraftOrder,
    current_constructors: List[Constructor],
    db: AsyncSession
) -> DraftOrder:
    """
    Rotate draft order from previous race.
    
    Last constructor becomes first for next race.
    
    Args:
        previous_draft_order: Draft order from previous race
        current_constructors: Current constructors in league (may have changed)
        
    Returns:
        New draft order IDs
    """
    previous_order = previous_draft_order.order_data
    
    # Find last constructor who actually drafted
    # (in case some constructors joined late)
    last_constructor_id = previous_order[-1]
    
    # Rotate: move last to front
    rotated_order = [last_constructor_id] + [
        c for c in previous_order if c != last_constructor_id
    ]
    
    # Handle constructors who joined after previous race
    # New constructors get added to end of order
    existing_ids = set(rotated_order)
    new_constructors = [c.id for c in current_constructors if c.id not in existing_ids]
    rotated_order.extend(new_constructors)
    
    return rotated_order
```

### Draft Methods

**Sequential**: `1, 2, 3, 4, 5, 1, 2, 3, 4, 5`
- Most straightforward
- Easy to understand

**Snake**: `1, 2, 3, 4, 5, 5, 4, 3, 2, 1`
- Flashes order on second round
- Reduces advantage of early draft positions

**MVP Scope**: Sequential only (Snake is out of scope)

**Implementation Extension for Snake**:
```python
# Future implementation for snake method
def generate_snake_drafter_sequence(
    constructor_ids: List[int],
    rounds: int = 2
) -> List[int]:
    """
    Generate snake draft sequence.
    
    Args:
        constructor_ids: Constructors in draft order
        rounds: Number of rounds (2 for 2 driver picks)
        
    Returns:
        Sequence of constructor IDs in pick order
    """
    sequence = []
    
    for round_num in range(rounds):
        if round_num % 2 == 0:
            # Forward order
            sequence.extend(constructor_ids)
        else:
            # Reverse order
            sequence.extend(reversed(constructor_ids))
    
    return sequence
```

---

## Driver Selection Rules

### Pick Count

**Maximum**: 2 drivers per constructor per race

**Implementation**:
```python
MAX_DRIVERS_PER_RACE = 2

async def validate_driver_pick(
    constructor_id: int,
    race_id: int,
    driver_id: int,
    db: AsyncSession
) -> Tuple[bool, str]:
    """
    Validate a driver pick.
    
    Args:
        constructor_id: Constructor making the pick
        race_id: Race being drafted for
        driver_id: Driver being picked
        db: Database session
        
    Returns:
        (is_valid, error_message)
    """
    # Check if constructor already has 2 drivers
    existing_drafts_result = await db.execute(
        select(DriverDraft).where(
            DriverDraft.constructor_id == constructor_id,
            DriverDraft.race_id == race_id
        )
    )
    existing_count = len(existing_drafts_result.scalars().all())
    
    if existing_count >= MAX_DRIVERS_PER_RACE:
        return False, f"Constructor already has {MAX_DRIVERS_PER_RACE} drivers"
    
    # Check if driver is already picked by another constructor
    driver_picked_result = await db.execute(
        select(DriverDraft).where(
            DriverDraft.race_id == race_id,
            DriverDraft.driver_id == driver_id
        )
    )
    existing_pick = driver_picked_result.scalar_one_or_none()
    
    if existing_pick:
        return False, "Driver already picked by another constructor"
    
    # Check if driver is active for this race
    driver_result = await db.execute(
        select(Driver).where(Driver.id == driver_id)
    )
    driver = driver_result.scalar_one_or_none()
    
    if not driver or not driver.is_active_for_race(race_id):
        return False, "Driver is not active for this race"
    
    # Check if pick is in correct draft order
    is_correct_order = await validate_pick_order(
        constructor_id,
        race_id,
        db
    )
    
    if not is_correct_order:
        return False, "Pick is out of draft order"
    
    return True, ""
```

### Duplicate Prevention

**Rule**: One driver cannot be picked by multiple constructors for the same race

**Implementation**: Uses unique constraint in database and validation in service layer (shown above)

### Draft Order Validation

**Rule**: Constructors must pick in the correct sequence

**Implementation**:
```python
async def validate_pick_order(
    constructor_id: int,
    race_id: int,
    db: AsyncSession
) -> bool:
    """
    Validate that a constructor is the next to pick.
    
    Args:
        constructor_id: Constructor attempting to pick
        race_id: Race being drafted for
        db: Database session
        
    Returns:
        True if constructor is next to pick
    """
    # Get draft order for this race
    draft_order_result = await db.execute(
        select(DraftOrder).where(DraftOrder.race_id == race_id)
    )
    draft_order = draft_order_result.scalar_one_or_none()
    
    if not draft_order:
        return False
    
    # Count how many picks have been made
    picks_result = await db.execute(
        select(func.count(DriverDraft.id)).where(DriverDraft.race_id == race_id)
    )
    total_picks = picks_result.scalar() or 0
    
    # Determine who should pick next
    draft_sequence = draft_order.order_data
    
    if total_picks >= len(draft_sequence) * MAX_DRIVERS_PER_RACE:
        return False  # Draft complete
    
    next_pick_index = total_picks % len(draft_sequence)
    next_constructor_id = draft_sequence[next_pick_index]
    
    return constructor_id == next_constructor_id
```

---

## Draft Status

### Draft States

**UPCOMING**: Draft window has not opened yet
**OPEN**: Draft window is open, picks can be made
**CLOSED**: Draft has closed (all picks made or qualifying started)
**COMPLETE**: Draft is complete and scoring has been calculated

**Implementation**:
```python
from enum import Enum

class DraftStatus(Enum):
    UPCOMING = "upcoming"
    OPEN = "open"
    CLOSED = "closed"
    COMPLETE = "complete"


async def get_draft_status(
    race: Race,
    league_id: int,
    db: AsyncSession
) -> DraftStatus:
    """
    Get current draft status for a race in a league.
    
    Args:
        race: Race to check
        league_id: League to check
        db: Database session
        
    Returns:
        Current draft status
    """
    now = datetime.now(ZoneInfo("America/New_York"))
    
    draft_open = calculate_draft_open_time(race.date)
    draft_close = calculate_draft_close_time(race)
    
    if now < draft_open:
        return DraftStatus.UPCOMING
    
    if now >= draft_close:
        return DraftStatus.CLOSED
    
    if await is_draft_complete(race, league_id, db):
        return DraftStatus.COMPLETE
    
    return DraftStatus.OPEN
```

---

## Driver Pool Management

### Active Driver Determination

**Timing**: Before draft opens, determine which drivers are active for the race

**Implementation**:
```python
async def update_active_drivers_for_race(race_id: int, db: AsyncSession):
    """
    Update active drivers for a race based on Jolpica API data.
    
    Should be called when draft opens.
    
    Args:
        race_id: Race to update drivers for
        db: Database session
    """
    # Get race details
    race_result = await db.execute(
        select(Race).where(Race.id == race_id)
    )
    race = race_result.scalar_one_or_none()
    
    if not race:
        return
    
    # Get all drivers from Jolpica API for this race
    # This would use JolpicaAPIService to get entry list
    season = race.season
    circuit_result = await db.execute(
        select(Circuit).where(Circuit.id == race.circuit_id)
    )
    circuit = circuit_result.scalar_one_or_none()
    
    if circuit:
        api_drivers = await jolpica_api_service.get_race_drivers(
            season,
            circuit.jolpica_id
        )
        
        # Mark drivers as active/inactive for this race
        active_driver_ids = [d["driverId"] for d in api_drivers]
        
        drivers_result = await db.execute(select(Driver))
        all_drivers = drivers_result.scalars().all()
        
        for driver in all_drivers:
            driver.is_active_for_race = driver.jolpica_id in active_driver_ids
        
        await db.commit()
```

---

## Reserve Driver Substitution (MVP Scope)

### Rules

1. **Driver Replacement**: If a drafted driver is replaced after the draft, the constructor automatically receives the replacement driver
2. **No Replacement**: If no replacement driver is available, the constructor receives a DNF (0 points)
3. **No Partial Substitutes**: Starting driver who doesn't finish = DNF for constructor (no partial points for substitute)

**Out of Scope for MVP**:
- Scenarios where original driver starts but substitute finishes (won't happen in F1)

**Implementation**:
```python
async def handle_driver_substitution(
    original_driver_id: int,
    replacement_driver_id: int,
    race_id: int,
    db: AsyncSession
):
    """
    Handle driver substitution after draft.
    
    Updates all constructor drafts that had the original driver.
    
    Args:
        original_driver_id: Original drafted driver ID
        replacement_driver_id: Replacement driver ID
        race_id: Race ID
        db: Database session
    """
    # Find all draft picks with original driver
    drafts_result = await db.execute(
        select(DriverDraft).where(
            DriverDraft.race_id == race_id,
            DriverDraft.driver_id == original_driver_id
        )
    )
    drafts = drafts_result.scalars().all()
    
    # Update each draft
    for draft in drafts:
        draft.driver_id = replacement_driver_id
        draft.substitution_note = (
            f"Driver substituted. Original driver {original_driver_id} "
            f"replaced by {replacement_driver_id}"
        )
        draft.substituted = True
        draft.substitution_time = datetime.utcnow()
        
        logger.info(
            f"Substituted driver {original_driver_id} with "
            f"{replacement_driver_id} for constructor {draft.constructor_id}"
        )
    
    await db.commit()


async def handle_no_substitution(
    driver_id: int,
    race_id: int,
    db: AsyncSession
):
    """
    Handle case where driver has no replacement.
    
    Marked as DNF (0 points).
    
    Args:
        driver_id: Driver ID with no replacement
        race_id: Race ID
        db: Database session
    """
    # Find all draft picks with this driver
    drafts_result = await db.execute(
        select(DriverDraft).where(
            DriverDraft.race_id == race_id,
            DriverDraft.driver_id == driver_id
        )
    )
    drafts = drafts_result.scalars().all()
    
    for draft in drafts:
        draft.points_earned = 0
        draft.substitution_note = (
            f"No replacement driver available. "
            f"Marked as DNF (0 points)."
        )
        draft.substituted = True
        draft.substitution_time = datetime.utcnow()
        
        logger.warning(
            f"No replacement for driver {driver_id} in race {race_id}. "
            f"Constructor {draft.constructor_id} receives 0 points."
        )
    
    await db.commit()
```

---

## Future-Ready Design for Time-Limited Drafts

Although time limits are out of scope for MVP, the system should be designed to support them easily in the future.

### Design Considerations

1. **Pick Duration Field**: Add `pick_duration_seconds` to `DraftOrder` model
2. **Pick Deadlines**: Calculate deadline for each pick based on start time
3. **Expired Picks**: Track picks that expired and need auto-pick
4. **Time Remaining Endpoints**: Return time remaining for current pick

### Data Model Extension

```python
class DraftOrder(Base):
    # ... existing fields ...
    
    pick_duration_seconds: Optional[int] = Field(
        default=None,
        description="Seconds allowed per pick (NULL = unlimited)"
    )
```

### Future Implementation Stub

```python
# Future implementation for time-limited drafts
async def get_pick_deadline(
    constructor_id: int,
    race_id: int,
    db: AsyncSession
) -> Optional[datetime]:
    """
    Get deadline for next pick (for time-limited drafts).
    
    Out of scope for MVP, but designed for future implementation.
    
    Args:
        constructor_id: Constructor picking
        race_id: Race being drafted
        
    Returns:
        Deadline datetime or None if no time limit
    """
    # Get draft order
    draft_order_result = await db.execute(
        select(DraftOrder).where(DraftOrder.race_id == race_id)
    )
    draft_order = draft_order_result.scalar_one_or_none()
    
    if not draft_order or not draft_order.pick_duration_seconds:
        return None  # No time limit (MVP behavior)
    
    # Calculate when this pick started
    # (would need to track pick start time in future versions)
    # Then add pick_duration_seconds
    
    return None  # Placeholder for future implementation


async def auto_pick_for_expired_draft(
    constructor_id: int,
    race_id: int,
    db: AsyncSession
):
    """
    Automatically pick for constructor whose pick expired.
    
    Out of scope for MVP, but designed for future implementation.
    """
    # Would pick best available driver based on strategy
    pass
```

---

## Future-Ready Design for Auto-Picks

Although auto-picks are out of scope for MVP, the system should support them in the future.

### Auto-Pick Strategies

1. **Highest Ranked Available**: Pick the highest-ranked available driver
2. **Random Available**: Pick a random available driver
3. **Constructor Strategy**: Pick based on constructor's saved preferences

### Data Model Extension

```python
class League(Base):
    # ... existing fields ...
    
    auto_pick_strategy: Optional[str] = Field(
        default=None,
        description="Strategy for auto-picks (NULL = disabled in MVP)"
    )
```

---

## Future-Ready Design for Draft Alerts

Although notifications are out of scope for MVP, the system should support them in the future.

### Alert Triggers

1. **Draft Opens**: Notify all constructors draft is open
2. **Your Turn**: Notify constructor when it's their turn
3. **Draft Closed**: Notify all constructors draft is closed
3. **Draft Complete**: Notify all constructors all picks made

### Design Considerations

- Use WebSocket or polling for real-time updates
- Store `last_notified_constructor_id` in `DraftOrder` to avoid duplicates
- Support opt-in/opt-out for notification preferences

---

## Celery Tasks

### Draft Management Tasks

**File**: `app/tasks/draft_tasks.py`

```python
from datetime import datetime, timedelta
from celery import shared_task
from app.db.session import SessionLocal
from app.services.draft_service import DraftService
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


@shared_task(name="tasks.open_draft_window")
def open_draft_window_task(race_id: int, league_id: int):
    """
    Open draft window for a race in a league.
    
    Scheduled to run at 08:00 AM EST Monday before race.
    """
    logger.info(f"Opening draft window for race {race_id} in league {league_id}")
    
    async def open_draft():
        async with SessionLocal() as db:
            draft_service = DraftService(db)
            await draft_service.open_draft(race_id, league_id)
            logger.info(f"Draft window opened for race {race_id} in league {league_id}")
    
    import asyncio
    asyncio.run(open_draft())


@shared_task(name="tasks.close_draft_window")
def close_draft_window_task(race_id: int, league_id: int):
    """
    Close draft window for a race in a league.
    
    Scheduled to run at qualifying start time.
    """
    logger.info(f"Closing draft window for race {race_id} in league {league_id}")
    
    async def close_draft():
        async with SessionLocal() as db:
            draft_service = DraftService(db)
            await draft_service.close_draft(race_id, league_id)
            logger.info(f"Draft window closed for race {race_id} in league {league_id}")
    
    import asyncio
    asyncio.run(close_draft())


@shared_task(name="tasks.update_draft_status")
def update_draft_status_task():
    """
    Check and update draft status for all open drafts.
    
    Runs every 15 minutes to check if:
    - Drafts should open
    - Drafts should close (qualifying started)
    - Drafts are complete (all picks made)
    """
    logger.info("Checking draft status for all leagues")
    
    async def update_status():
        async with SessionLocal() as db:
            # Get all races in current season
            races_result = await db.execute(
                select(Race).where(
                    Race.season == 2026,
                    Race.date >= datetime.now()
                )
            )
            races = races_result.scalars().all()
            
            for race in races:
                # Get leagues for this race
                leagues_result = await db.execute(select(League))
                leagues = leagues_result.scalars().all()
                
                for league in leagues:
                    status = await get_draft_status(race, league.id, db)
                    logger.debug(
                        f"Draft status for race {race.id} league {league.id}: {status.value}"
                    )
    
    import asyncio
    asyncio.run(update_status())


@shared_task(name="tasks.check_qualifying_time")
def check_qualifying_time_task():
    """
    Check if qualifying has started for upcoming races.
    
    Runs every hour to update race qualifying status.
    """
    logger.info("Checking qualifying times for upcoming races")
    
    async def check_times():
        async with SessionLocal() as db:
            # Get upcoming races in next 7 days
            now = datetime.now(ZoneInfo("America/New_York"))
            next_week = now + timedelta(days=7)
            
            races_result = await db.execute(
                select(Race).where(
                    Race.season == 2026,
                    Race.date >= now,
                    Race.date <= next_week
                )
            )
            races = races_result.scalars().all()
            
            for race in races:
                # Check if qualifying has started
                if now >= race.qualification_start_est:
                    logger.info(
                        f"Qualifying started for race {race.id}. "
                        f"Draft window should close."
                    )
                    # Draft window close task will handle closing
    
    import asyncio
    asyncio.run(check_times())
```

---

## API Endpoints

### Draft Status Endpoints

```python
# GET /api/v1/races/{race_id}/leagues/{league_id}/draft-status
# Get current draft status

@router.get("/races/{race_id}/leagues/{league_id}/draft-status")
async def get_draft_status_endpoint(
    race_id: int,
    league_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get draft status for a race in a league."""
    race = await get_race_or_404(race_id, db)
    league = await get_league_or_404(league_id, db)
    
    # Verify user is member of league
    await verify_league_membership(league.id, current_user.id, db)
    
    status = await get_draft_status(race, league_id, db)
    time_until_open = calculate_draft_open_time(race.date) - datetime.now()
    time_until_close = calculate_draft_close_time(race) - datetime.now()
    
    return {
        "status": status.value,
        "draft_opens_at": calculate_draft_open_time(race.date),
        "draft_closes_at": calculate_draft_close_time(race),
        "time_until_open_seconds": max(0, time_until_open.total_seconds()),
        "time_until_close_seconds": max(0, time_until_close.total_seconds())
    }


# GET /api/v1/races/{race_id}/leagues/{league_id}/draft-order
# Get current draft order

@router.get("/races/{race_id}/leagues/{league_id}/draft-order")
async def get_draft_order_endpoint(
    race_id: int,
    league_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get draft order for a race in a league."""
    race = await get_race_or_404(race_id, db)
    league = await get_league_or_404(league_id, db)
    
    # Verify user is member of league
    await verify_league_membership(league.id, current_user.id, db)
    
    draft_order_result = await db.execute(
        select(DraftOrder).where(
            DraftOrder.race_id == race_id,
            DraftOrder.league_id == league_id
        )
    )
    draft_order = draft_order_result.scalar_one_or_none()
    
    if not draft_order:
        raise HTTPException(status_code=404, detail="Draft order not set")
    
    # Get constructor names
    constructors_result = await db.execute(
        select(Constructor).where(Constructor.id.in_(draft_order.order_data))
    )
    constructors_map = {c.id: c for c in constructors_result.scalars().all()}
    
    order_with_names = [
        {
            "constructor_id": c_id,
            "team_name": constructors_map.get(c_id, {}).team_name,
            "user_id": constructors_map.get(c_id, {}).user_id
        }
        for c_id in draft_order.order_data
    ]
    
    return {
        "draft_order": order_with_names,
        "method": draft_order.method,
        "is_manual": draft_order.is_manual,
        "last_modified_at": draft_order.last_modified_at
    }
```

---

## Summary

This document defines the complete draft rules and timing for the Fantasy F1 MVP:

### MVP Scope

- Draft opens Monday 08:00 AM EST before each race
- Draft closes when all picks made OR qualifying starts (whichever first)
- 2 drivers per constructor per race
- Random initial draft order, rotates each race
- Sequential draft method
- No time limits per pick (designed for future expansion)
- No auto-picks (designed for future expansion)
- No notifications (designed for future expansion)
- Reserve driver substitution (automatic replacement or DNF)

### Key Implementation Points

1. **Time Calculations**: EST timezone calculations for draft windows
2. **Draft Order**: Random shuffle with rotation mechanism
3. **Validation**: Duplicate prevention, order validation, driver count limits
4. **Status Management**: Draft states (upcoming, open, closed, complete)
5. **Future-Ready**: Design supports time limits, auto-picks, and notifications

### Next Steps

- Implement DraftService with all validation rules
- Add Celery Beat schedules for draft management
- Create API endpoints for draft status and order
- Test draft flow end-to-end

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-09 | Project Lead | Initial draft rules and timing documentation |