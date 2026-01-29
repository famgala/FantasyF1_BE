# Result Polling Strategy

This document describes the result polling and verification strategy for the Fantasy F1 Backend system, including hourly polling, result verification, and FIA correction detection.

---

## Polling Overview

The Fantasy F1 system uses a two-phase polling approach:
1. **Hourly Polling**: Poll every hour until results are available (24-48 hours)
2. **Verification**: 3 checks over 72 hours to detect FIA corrections
3. **User Notifications**: Notify all users if corrections are found

### Why Poll Instead of Real-Time?

- **Reliability**: F1 results can take 24-48 hours to post
- **Flexibility**: Works with variable result posting times
- **Efficiency**: No need for persistent connections
- **Simplicity**: Easier to implement and maintain than real-time systems

---

## Polling Workflow

### Phase 1: Hourly Polling

```
Race Scheduled (e.g., Sunday Jan 11, noon)
    ↓
Hourly checks begin (1 hour after race start)
    ↓
Check 1: Sunday 1:00 PM - No results
    ↓
Check 2: Sunday 2:00 PM - No results
    ↓
Check 3: Sunday 3:00 PM - No results
    ↓
... (continues hourly)
    ↓
Check N: Monday 6:00 AM - Results found! ✓
    ↓
Stop hourly polling
    ↓
Start Phase 2: Verification schedule
```

### Phase 2: Verification (3 checks over 72 hours)

```
Results pulled in (Monday 6:00 AM)
    ↓
Schedule Verification 1: Tuesday 6:00 AM (24 hours later)
    ↓
Schedule Verification 2: Wednesday 6:00 AM (48 hours later)
    ↓
Schedule Verification 3: Thursday 6:00 AM (72 hours later)
    ↓
    ├─ Check 1: No changes ✓
    │   ↓
    │   Check 2: No changes ✓
    │   ↓
    │   Check 3: No changes ✓
    │   ↓
    │   Complete - No further polling
    │
    └─ OR: Changes detected in Check 2
        ↓
        Update results
        ↓
        Notify all users
        ↓
        Reset verification schedule (3 more checks)
```

---

## Implementation

### Celery Configuration

```python
# app/core/celery_app.py
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "fantasy_f1",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.race_tasks",
        "appTasks.verification_tasks",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)
```

### Schedule Hourly Polling

```python
# app/tasks/race_tasks.py
from celery import shared_task
from app.db.session import AsyncSessionLocal
from app.models.race import Race, RaceStatus
from app.services.polling_service import PollingService
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(name="schedule_hourly_polling")
def schedule_hourly_polling():
    """
    Schedule hourly polling for races without results.
    Runs every hour via Celery Beat.
    """
    from app.tasks.race_tasks import poll_race_results
    
    db = AsyncSessionLocal()
    try:
        # Find upcoming races that need polling
        now = datetime.utcnow()
        races_to_poll = db.query(Race).filter(
            Race.status == RaceStatus.COMPLETED,
            Race.race_date <= now,
            ~Race.race_results.any()  # No results yet
        ).all()
        
        for race in races_to_poll:
            # Schedule polling for this race
            poll_race_results.apply_async(
                args=[race.id],
                eta=now + timedelta(hours=1)
            )
            
            logger.info(f"Scheduled polling for race {race.id}: {race.name}")
    
    finally:
        db.close()


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=3600  # 1 hour
)
def poll_race_results(self, race_id: int):
    """
    Poll for race results from F1 API.
    Retries every hour if API fails.
    """
    from app.tasks.race_tasks import schedule_result_verification
    
    db = AsyncSessionLocal()
    try:
        polling_service = PollingService(db)
        
        # Attempt to fetch results
        results = polling_service.fetch_race_results(race_id)
        
        if results:
            # Results found - store them
            polling_service.store_race_results(race_id, results)
            
            logger.info(f"Results found for race {race_id}")
            
            # Schedule verification checks
            schedule_result_verification(race_id)
            
        else:
            # No results yet - will be called again by schedule_hourly_polling
            logger.info(f"No results yet for race {race_id}, will retry")
    
    except Exception as exc:
        logger.error(f"Error polling race {race_id}: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc)
    
    finally:
        db.close()
```

### Result Verification

```python
# app/tasks/verification_tasks.py
from celery import shared_task
from app.db.session import AsyncSessionLocal
from app.models.race import Race
from app.services.polling_service import PollingService
from app.services.notification_service import NotificationService
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(name="schedule_result_verification")
def schedule_result_verification(race_id: int):
    """
    Schedule 3 verification checks over 72 hours.
    Each check is 24 hours apart.
    """
    db = AsyncSessionLocal()
    try:
        race = db.query(Race).get(race_id)
        if not race:
            logger.error(f"Race {race_id} not found")
            return
        
        now = datetime.utcnow()
        
        # Schedule 3 verification checks
        for i in range(3):
            verify_eta = now + timedelta(days=(i + 1))
            verify_race_results.apply_async(
                args=[race_id, i + 1],
                eta=verify_eta
            )
            
            logger.info(
                f"Scheduled verification check {i + 1} "
                f"for race {race_id} at {verify_eta}"
            )
    
    finally:
        db.close()


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=3600
)
def verify_race_results(self, race_id: int, check_number: int):
    """
    Verify race results for FIA corrections.
    Called 3 times over 72 hours.
    """
    db = AsyncSessionLocal()
    try:
        polling_service = PollingService(db)
        
        # Fetch current results from API
        api_results = polling_service.fetch_race_results(race_id)
        
        if not api_results:
            logger.warning(f"Could not fetch results for verification check {check_number}")
            return
        
        # Compare with stored results
        changes = polling_service.compare_race_results(race_id, api_results)
        
        if changes:
            # Changes detected - update results
            logger.info(
                f"Changes detected in verification check {check_number} "
                f"for race {race_id}"
            )
            
            # Update results
            polling_service.update_race_results(race_id, api_results)
            
            # Recalculate team scores
            polling_service.recalculate_scores(race_id)
            
            # Notify all users
            notify_users_of_result_update.delay(race_id)
            
            # Reset verification schedule (3 more checks)
            from app.tasks.verification_tasks import schedule_result_verification
            schedule_result_verification(race_id)
            
        else:
            # No changes - verification passed
            logger.info(
                f"No changes in verification check {check_number} "
                f"for race {race_id}"
            )
            
            if check_number == 3:
                logger.info(f"Final verification passed for race {race_id}")
    
    except Exception as exc:
        logger.error(f"Error verifying race {race_id}: {exc}")
        raise self.retry(exc=exc)
    
    finally:
        db.close()


@shared_task
def notify_users_of_result_update(race_id: int):
    """
    Notify all users when race results are updated.
    """
    db = AsyncSessionLocal()
    try:
        notification_service = NotificationService(db)
        
        race = db.query(Race).get(race_id)
        if not race:
            return
        
        # Get all users
        users = db.query(User).filter(User.is_active == True).all()
        
        for user in users:
            notification = Notification(
                user_id=user.id,
                type="score_updated",
                title=f"Results Updated: {race.name}",
                message=(
                    f"Race results have been updated. "
                    f"Your team scores may have changed. "
                    f"Check your updated scores!"
                ),
                link=f"/races/{race_id}/results"
            )
            
            notification_service.create(notification)
        
        logger.info(f"Notified {len(users)} users of result update for race {race_id}")
    
    finally:
        db.close()
```

### Polling Service

```python
# app/services/polling_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Dict, Any
from httpx import AsyncClient
from app.models.race import Race, RaceResult, Driver
from app.services.scoring_service import ScoringService
import logging

logger = logging.getLogger(__name__)


class PollingService:
    """Service for polling and verifying race results."""
    
    F1_API_BASE_URL = "https://api.formula1.com/v1"
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.http_client = None
    
    async def _get_http_client(self) -> AsyncClient:
        """Get or create HTTP client."""
        if self.http_client is None:
            self.http_client = AsyncClient(timeout=30.0)
        return self.http_client
    
    async def fetch_race_results(self, race_id: int) -> List[Dict]:
        """
        Fetch race results from F1 API.
        Returns None if results not available.
        """
        race = await self.db.get(Race, race_id)
        if not race:
            return None
        
        client = await self._get_http_client()
        
        try:
            # Call F1 API for race results
            response = await client.get(
                f"{self.F1_API_BASE_URL}/results/race/{race.round_number}"
            )
            
            if response.status_code == 404:
                # Results not available yet
                return None
            
            response.raise_for_status()
            data = response.json()
            
            # Parse results
            results = self._parse_race_results(data)
            return results
        
        except Exception as e:
            logger.error(f"Error fetching race results: {e}")
            return None
    
    def _parse_race_results(self, api_data: Dict) -> List[Dict]:
        """Parse F1 API response into internal format."""
        results = []
        
        for driver_result in api_data.get("results", []):
            results.append({
                "driver_name": driver_result["driver"]["name"],
                "driver_number": driver_result["driver"]["number"],
                "position": driver_result.get("position"),
                "grid_position": driver_result.get("grid_position"),
                "laps_completed": driver_result.get("laps"),
                "points_earned": driver_result.get("points", 0),
                "fastest_lap": driver_result.get("fastest_lap", False),
                "fastest_lap_time": driver_result.get("fastest_lap_time"),
                "time_delta": driver_result.get("time"),
                "dnf": driver_result.get("dnf", False),
                "dnf_reason": driver_result.get("dnf_reason")
            })
        
        return results
    
    async def store_race_results(self, race_id: int, results: List[Dict]) -> None:
        """Store race results in database."""
        # Delete existing results
        await self.db.execute(
            delete(RaceResult).where(RaceResult.race_id == race_id)
        )
        
        # Store new results
        for result_data in results:
            # Get driver by number
            driver_result = await self.db.execute(
                select(Driver).where(Driver.number == result_data["driver_number"])
            )
            driver = driver_result.scalar_one_or_none()
            
            if not driver:
                logger.warning(
                    f"Driver {result_data['driver_name']} not found"
                )
                continue
            
            race_result = RaceResult(
                race_id=race_id,
                driver_id=driver.id,
                position=result_data.get("position"),
                grid_position=result_data.get("grid_position"),
                laps_completed=result_data.get("laps_completed"),
                points_earned=result_data.get("points_earned", 0),
                fastest_lap=result_data.get("fastest_lap", False),
                fastest_lap_time=result_data.get("fastest_lap_time"),
                time_delta=result_data.get("time_delta"),
                dnf=result_data.get("dnf", False),
                dnf_reason=result_data.get("dnf_reason")
            )
            
            self.db.add(race_result)
        
        # Update race status
        race = await self.db.get(Race, race_id)
        race.status = "completed"
        
        await self.db.commit()
        
        logger.info(f"Stored {len(results)} race results for race {race_id}")
    
    async def compare_race_results(
        self,
        race_id: int,
        new_results: List[Dict]
    ) -> Dict[str, Any]:
        """
        Compare new results with stored results.
        Returns changes dict if differences found.
        """
        # Get stored results
        stored_result = await self.db.execute(
            select(RaceResult).where(RaceResult.race_id == race_id)
        )
        stored_results = stored_result.scalars().all()
        
        # Create lookup map
        stored_map = {
            r.driver_id: r for r in stored_results
        }
        
        changes = {
            "position_changes": [],
            "point_changes": [],
            "new_dnf": [],
            "resolved_dnf": []
        }
        
        for new_result in new_results:
            # Get driver
            driver_result = await self.db.execute(
                select(Driver).where(Driver.number == new_result["driver_number"])
            )
            driver = driver_result.scalar_one_or_none()
            
            if not driver:
                continue
            
            stored = stored_map.get(driver.id)
            
            if not stored:
                # New result
                continue
            
            # Check for position changes
            if stored.position != new_result.get("position"):
                changes["position_changes"].append({
                    "driver": driver.name,
                    "old_position": stored.position,
                    "new_position": new_result.get("position")
                })
            
            # Check for point changes
            if stored.points_earned != new_result.get("points_earned"):
                changes["point_changes"].append({
                    "driver": driver.name,
                    "old_points": stored.points_earned,
                    "new_points": new_result.get("points_earned")
                })
            
            # Check for new DNF
            if not stored.dnf and new_result.get("dnf"):
                changes["new_dnf"].append({
                    "driver": driver.name,
                    "reason": new_result.get("dnf_reason")
                })
            
            # Check for resolved DNF
            if stored.dnf and not new_result.get("dnf"):
                changes["resolved_dnf"].append({
                    "driver": driver.name
                })
        
        # Return changes if any
        return changes if changes else None
    
    async def update_race_results(self, race_id: int, results: List[Dict]) -> None:
        """Update race results with new data."""
        await self.store_race_results(race_id, results)
        logger.info(f"Updated race results for race {race_id}")
    
    async def recalculate_scores(self, race_id: int) -> None:
        """Recalculate team scores after result update."""
        scoring_service = ScoringService(self.db)
        await scoring_service.update_all_team_scores(race_id)
        logger.info(f"Recalculated scores for race {race_id}")
```

---

## Celery Beat Configuration

```python
# app/core/celery_config.py
from datetime import timedelta
from celery.schedules import crontab

celery_beat_schedule = {
    # Schedule hourly polling (runs every hour)
    "schedule-hourly-polling": {
        "task": "schedule_hourly_polling",
        "schedule": crontab(minute=0),  # Every hour on the hour
    },
    
    # Daily data cleanup
    "daily-cleanup": {
        "task": "cleanup_old_data",
        "schedule": crontab(hour=2, minute=0),  # Daily at 2 AM
    },
    
    # Weekly driver stats update
    "weekly-driver-stats": {
        "task": "update_driver_statistics",
        "schedule": crontab(hour=3, minute=0, day_of_week=1),  # Monday 3 AM
    },
}
```

---

## Example Timeline

### Complete Example: January 11 Race

```
Sunday, Jan 11
├─ 12:00 PM - Race starts
├─ 1:00 PM - Hourly check #1: No results
├─ 2:00 PM - Hourly check #2: No results
├─ 3:00 PM - Hourly check #3: No results
├─ 4:00 PM - Hourly check #4: No results
├─ 5:00 PM - Hourly check #5: No results
├─ 6:00 PM - Hourly check #6: No results
├─ 7:00 PM - Hourly check #7: No results
├─ 8:00 PM - Hourly check #8: No results
├─ 9:00 PM - Hourly check #9: No results
├─ 10:00 PM - Hourly check #10: No results
└─ 11:00 PM - Hourly check #11: No results

Monday, Jan 12
├─ 12:00 AM - Hourly check #12: No results
├─ 1:00 AM - Hourly check #13: No results
├─ 2:00 AM - Hourly check #14: No results
├─ 3:00 AM - Hourly check #15: No results
├─ 4:00 AM - Hourly check #16: No results
├─ 5:00 AM - Hourly check #17: No results
├─ 6:00 AM - Hourly check #18: Results found! ✓
│   ├─ Store results in database
│   ├─ Calculate team scores
│   ├─ Update leaderboards
│   └─ Schedule verification checks:
│       ├─ Tue Jan 13, 6:00 AM (24 hrs)
│       ├─ Wed Jan 14, 6:00 AM (48 hrs)
│       └─ Thu Jan 15, 6:00 AM (72 hrs)
├─ 7:00 AM - Hourly polling stops for this race
├─ ... (no more hourly checks)
└─ 11:00 PM - ...

Tuesday, Jan 13
└─ 6:00 AM - Verification Check #1: No changes ✓

Wednesday, Jan 14
└─ 6:00 AM - Verification Check #2: No changes ✓

Thursday, Jan 15
└─ 6:00 AM - Verification Check #3: No changes ✓
    └─ Complete - No further polling needed
```

### Example With FIA Correction

```
Monday, Jan 12
└─ 6:00 AM - Results found ✓
    └─ Verification checks scheduled:
        ├─ Tue Jan 13, 6:00 AM (24 hrs)
        ├─ Wed Jan 14, 6:00 AM (48 hrs)
        └─ Thu Jan 15, 6:00 AM (72 hrs)

Tuesday, Jan 13
└─ 6:00 AM - Verification Check #1: No changes ✓

Wednesday, Jan 14
└─ 6:00 AM - Verification Check #2: CHANGES DETECTED! ⚠
    ├─ Update: Driver penalties applied
    ├─ Update: Positions changed
    ├─ Recalculate team scores
    ├─ Update leaderboards
    ├─ Notify all users
    └─ Reset verification schedule:
        ├─ Thu Jan 16, 6:00 AM (24 hrs)
        ├─ Fri Jan 17, 6:00 AM (48 hrs)
        └─ Sat Jan 18, 6:00 AM (72 hrs)

Thursday, Jan 15
└─ 6:00 AM - Verification Check (reset #1): No changes ✓

Friday, Jan 16
└─ 6:00 AM - Verification Check (reset #2): No changes ✓

Saturday, Jan 17
└─ 6:00 AM - Verification Check (reset #3): No changes ✓
    └─ Complete - No further polling needed
```

---

## Error Handling

### API Failures

```python
@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=3600  # 1 hour
)
def poll_race_results(self, race_id: int):
    """Poll for race results from F1 API."""
    try:
        # ... polling logic ...
        
    except httpx.HTTPError as exc:
        logger.error(f"HTTP error polling race {race_id}: {exc}")
        # Retry after 1 hour
        raise self.retry(exc=exc, countdown=3600)
    
    except Exception as exc:
        logger.error(f"Unexpected error polling race {race_id}: {exc}")
        # Retry after 1 hour
        raise self.retry(exc=exc, countdown=3600)
```

### Validation Errors

```python
# Validate driver mapping
if not driver:
    logger.warning(f"Driver {result_data['driver_name']} not found")
    # Skip this result, continue with others
    continue

# Validate data integrity
if result_data.get("position") and result_data.get("position") < 0:
    logger.error(f"Invalid position: {result_data.get('position')}")
    raise ValueError("Invalid position value")
```

---

## Monitoring

### Task Monitoring with Flower

```bash
# Start Flower (Celery monitoring)
celery -A app.core.celery_app flower \
    --port=5555 \
    --auth_token=your-secret-token
```

Access at: `http://localhost:5555`

### Monitoring Metrics

- **Polling Tasks**: Number of races being polled
- **API Calls**: Success/failure rates
- **Verification Checks**: Number of active verification schedules
- **Result Updates**: Number of corrections detected
- **Task Duration**: Time taken for each task

### Logging

```python
logger.info(f"Polling race {race_id}")
logger.warning(f"No results yet for race {race_id}")
logger.error(f"Error fetching results: {exc}")
logger.info(f"Changes detected: {changes}")
```

---

## Related Documentation

- [Celery Tasks](celery_tasks.md) - General Celery task implementation
- [Business Logic](business_logic.md) - ScoringService for calculations
- [API Endpoints](api_endpoints.md) - Notification endpoints
- [Architecture](architecture.md) - Background task architecture