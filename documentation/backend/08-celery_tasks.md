# Celery Tasks & Background Jobs

This document describes the Celery task implementation for background job processing in the Fantasy F1 Backend system.

---

## Overview

Celery is used for asynchronous task processing, enabling:
- Periodic data synchronization
- Result polling and verification
- Score calculations
- Email/SMS notifications
- Data cleanup and maintenance

### Architecture

```
FastAPI Application
    ↓
Task Queues (Redis)
    ↓
Celery Workers
    ↓
Task Execution
    ↓
Database/External APIs
```

---

## Celery Configuration

### Application Setup

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
        "app.tasks.user_tasks",
        "app.tasks.league_tasks",
        "app.tasks.notification_tasks",
        "app.tasks.maintenance_tasks",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)
```

### Environment Variables

```bash
# .env
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
CELERY_WORKER_LOG_LEVEL=INFO
```

---

## Task Categories

### 1. Race Management Tasks

#### Sync Race Results

```python
# app/tasks/race_tasks.py
from celery import shared_task
from app.db.session import AsyncSessionLocal
from app.services.race_service import RaceService
import logging

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    name="sync_race_results",
    max_retries=3,
    default_retry_delay=3600
)
def sync_race_results(self, race_id: int):
    """Sync race results from external API."""
    db = AsyncSessionLocal()
    try:
        race_service = RaceService(db)
        results = race_service.fetch_results_from_api(race_id)
        
        if results:
            race_service.process_results(race_id, results)
            logger.info(f"Synced results for race {race_id}")
        else:
            logger.info(f"No results available for race {race_id}")
    
    except Exception as exc:
        logger.error(f"Error syncing race {race_id}: {exc}")
        raise self.retry(exc=exc)
    
    finally:
        db.close()
```

#### Update Team Scores

```python
# app/tasks/race_tasks.py (continued)

@shared_task(name="update_team_scores")
def update_team_scores(race_id: int):
    """Update team scores for a race."""
    db = AsyncSessionLocal()
    try:
        from app.services.scoring_service import ScoringService
        scoring_service = ScoringService(db)
        scoring_service.update_all_team_scores(race_id)
        logger.info(f"Updated team scores for race {race_id}")
    
    except Exception as exc:
        logger.error(f"Error updating scores for race {race_id}: {exc}")
    
    finally:
        db.close()
```

### 2. User Management Tasks

#### Send Welcome Email

```python
# app/tasks/user_tasks.py
from celery import shared_task
from app.db.session import AsyncSessionLocal
from app.services.email_service import EmailService
import logging

logger = logging.getLogger(__name__)


@shared_task(name="send_welcome_email")
def send_welcome_email(user_id: int):
    """Send welcome email to new user."""
    db = AsyncSessionLocal()
    try:
        user = db.query(db.models.User).get(user_id)
        if not user:
            logger.error(f"User {user_id} not found")
            return
        
        email_service = EmailService()
        email_service.send_welcome(user.email, user.username)
        
        logger.info(f"Sent welcome email to user {user_id}")
    
    except Exception as exc:
        logger.error(f"Error sending welcome email to {user_id}: {exc}")
    
    finally:
        db.close()
```

#### Password Reset

```python
# app/tasks/user_tasks.py (continued)

@shared_task(name="send_password_reset_email")
def send_password_reset_email(user_id: int, token: str):
    """Send password reset email."""
    db = AsyncSessionLocal()
    try:
        user = db.query(db.models.User).get(user_id)
        if not user:
            return
        
        email_service = EmailService()
        email_service.send_password_reset(user.email, user.username, token)
        
        logger.info(f"Sent password reset email to user {user_id}")
    
    except Exception as exc:
        logger.error(f"Error sending password reset email: {exc}")
    
    finally:
        db.close()
```

### 3. League Management Tasks

#### Update League Leaderboards

```python
# app/tasks/league_tasks.py
from celery import shared_task
from app.db.session import AsyncSessionLocal
from app.services.scoring_service import ScoringService
import logging

logger = logging.getLogger(__name__)


@shared_task(name="update_league_leaderboards")
def update_league_leaderboards():
    """Update all league leaderboards."""
    db = AsyncSessionLocal()
    try:
        from app.models.league import League
        leagues = db.query(League).all()
        
        scoring_service = ScoringService(db)
        
        for league in leagues:
            scoring_service.generate_leaderboard(league.id)
            logger.info(f"Updated leaderboard for league {league.id}")
    
    except Exception as exc:
        logger.error(f"Error updating league leaderboards: {exc}")
    
    finally:
        db.close()
```

### 4. Notification Tasks

#### Send Race Notifications

```python
# app/tasks/notification_tasks.py
from celery import shared_task
from app.db.session import AsyncSessionLocal
from app.services.notification_service import NotificationService
from sqlalchemy.orm import selectinload
import logging

logger = logging.getLogger(__name__)


@shared_task(name="notify_race_results")
def notify_race_results(race_id: int):
    """Notify all users of race results."""
    db = AsyncSessionLocal()
    try:
        from app.models.race import Race
        from app.models.user import User
        
        race = db.query(Race).options(selectinload(Race.race_results)).get(race_id)
        if not race:
            logger.error(f"Race {race_id} not found")
            return
        
        # Get all active users
        users = db.query(User).filter(User.is_active == True).all()
        
        notification_service = NotificationService(db)
        
        for user in users:
            notification = Notification(
                user_id=user.id,
                type="race_finished",
                title=f"Race Results: {race.name}",
                message=f"Results for {race.name} are now available!",
                link=f"/races/{race_id}/results"
            )
            notification_service.create(notification)
        
        logger.info(f"Notified {len(users)} users of race {race_id} results")
    
    except Exception as exc:
        logger.error(f"Error notifying users of race results: {exc}")
    
    finally:
        db.close()
```

#### Send Weekly Newsletter

```python
# app/tasks/notification_tasks.py (continued)

@shared_task(name="send_weekly_newsletter")
def send_weekly_newsletter():
    """Send weekly newsletter to all users."""
    db = AsyncSessionLocal()
    try:
        from app.models.user import User
        from datetime import datetime, timedelta
        
        # Get users who joined in the last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        users = db.query(User).filter(
            User.created_at >= week_ago,
            User.is_active == True
        ).all()
        
        email_service = EmailService()
        
        for user in users:
            email_service.send_newsletter(user.email)
        
        logger.info(f"Sent weekly newsletter to {len(users)} users")
    
    except Exception as exc:
        logger.error(f"Error sending weekly newsletter: {exc}")
    
    finally:
        db.close()
```

### 5. Maintenance Tasks

#### Cleanup Old Data

```python
# app/tasks/maintenance_tasks.py
from celery import shared_task
from app.db.session import AsyncSessionLocal
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(name="cleanup_old_data")
def cleanup_old_data():
    """Clean up old data (logs, expired tokens, etc.)."""
    db = AsyncSessionLocal()
    try:
        from app.models.notification import Notification
        
        # Delete notifications older than 30 days
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        deleted = db.query(Notification).filter(
            Notification.created_at < thirty_days_ago
        ).delete()
        
        db.commit()
        
        logger.info(f"Cleaned up {deleted} old notifications")
    
    except Exception as exc:
        logger.error(f"Error cleaning up old data: {exc}")
        db.rollback()
    
    finally:
        db.close()
```

#### Update Driver Statistics

```python
# app/tasks/maintenance_tasks.py (continued)

@shared_task(name="update_driver_statistics")
def update_driver_statistics():
    """Update driver statistics."""
    db = AsyncSessionLocal()
    try:
        from app.models.driver import Driver
        from app.services.driver_service import DriverService
        
        driver_service = DriverService(db)
        drivers = db.query(Driver).filter(Driver.status == "active").all()
        
        for driver in drivers:
            driver_service.update_driver_stats(driver.id)
        
        logger.info(f"Updated statistics for {len(drivers)} drivers")
    
    except Exception as exc:
        logger.error(f"Error updating driver statistics: {exc}")
    
    finally:
        db.close()
```

---

## Task Scheduling

### Celery Beat Configuration

```python
# app/core/celery_config.py
from celery.schedules import crontab

celery_beat_schedule = {
    # Hourly: Poll for race results
    "schedule-hourly-polling": {
        "task": "schedule_hourly_polling",
        "schedule": crontab(minute=0),
    },
    
    # Daily: Update league leaderboards at midnight
    "daily-leaderboard-update": {
        "task": "update_league_leaderboards",
        "schedule": crontab(hour=0, minute=0),
    },
    
    # Daily: Cleanup old data at 2 AM
    "daily-cleanup": {
        "task": "cleanup_old_data",
        "schedule": crontab(hour=2, minute=0),
    },
    
    # Weekly: Update driver stats on Monday at 3 AM
    "weekly-driver-stats": {
        "task": "update_driver_statistics",
        "schedule": crontab(hour=3, minute=0, day_of_week=1),
    },
    
    # Weekly: Send newsletter on Friday at 10 AM
    "weekly-newsletter": {
        "task": "send_weekly_newsletter",
        "schedule": crontab(hour=10, minute=0, day_of_week=5),
    },
}
```

---

## Running Celery

### Start Worker

```bash
# Development
celery -A app.core.celery_app worker --loglevel=info

# Production with concurrency
celery -A app.core.celery_app worker \
    --loglevel=info \
    --concurrency=4 \
    --max-tasks-per-child=1000

# With queue routing
celery -A app.core.celery_app worker \
    --loglevel=info \
    -Q race_tasks,notification_tasks
```

### Start Beat Scheduler

```bash
# Start Celery Beat
celery -A app.core.celery_app beat --loglevel=info

# With scheduler file
celery -A app.core.celery_app beat \
    --loglevel=info \
    --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Start Flower (Monitoring)

```bash
# Start Flower
celery -A app.core.celery_app flower --port=5555

# With authentication
celery -A app.core.celery_app flower \
    --port=5555 \
    --basic_auth=user:password
```

---

## Task Chaining

### Example: Race Results Workflow

```python
# app/tasks/workflows.py
from celery import chain

def process_race_results_workflow(race_id: int):
    """Chain tasks for processing race results."""
    workflow = chain(
        sync_race_results.s(race_id),
        update_team_scores.s(race_id),
        update_league_leaderboards.s(),
        notify_race_results.s(race_id)
    )
    
    return workflow()
```

### Example: User Registration Workflow

```python
# app/tasks/workflows.py (continued)

def user_registration_workflow(user_id: int):
    """Chain tasks for new user registration."""
    workflow = chain(
        send_welcome_email.s(user_id),
        add_to_default_league.s(user_id)
    )
    
    return workflow()
```

---

## Task Groups

### Parallel Task Execution

```python
# app/tasks/workflows.py (continued)
from celery import group

def update_all_leagues_leaderboards():
    """Update all league leaderboards in parallel."""
    db = AsyncSessionLocal()
    try:
        from app.models.league import League
        leagues = db.query(League).all()
        
        # Create group of tasks
        leaderboard_group = group(
            update_single_league_leaderboard.s(league.id)
            for league in leagues
        )
        
        return leaderboard_group()
    
    finally:
        db.close()


@shared_task(name="update_single_league_leaderboard")
def update_single_league_leaderboard(league_id: int):
    """Update single league leaderboard."""
    db = AsyncSessionLocal()
    try:
        from app.services.scoring_service import ScoringService
        scoring_service = ScoringService(db)
        scoring_service.generate_leaderboard(league_id)
    
    finally:
        db.close()
```

---

## Error Handling

### Task Retry Strategy

```python
@shared_task(
    bind=True,
    autoretry_for=(ConnectionError, TimeoutError),
    max_retries=5,
    default_retry_delay=60,
    retry_backoff=True,
    retry_backoff_max=3600,
    retry_jitter=True
)
def resilient_task(self, data):
    """Task with exponential backoff retry."""
    # Task implementation
    pass
```

### Error Callbacks

```python
@shared_task(
    bind=True,
    name="critical_task",
    on_failure=notify_on_failure
)
def critical_task(self, data):
    """Task with failure callback."""
    # Critical operations
    pass


def notify_on_failure(task, exc, traceback):
    """Callback for task failures."""
    from app.services.notification_service import NotificationService
    import logging
    
    logging.error(f"Task {task.name} failed: {exc}")
    
    # Notify admins
    # notification_service.notify_admins(task.name, str(exc))
```

---

## Monitoring

### Task Monitoring with Flower

Flower provides a web interface for monitoring Celery tasks:

- Task status (queued, started, success, failure)
- Task timing and execution time
- Worker status and health
- Task queues and throughput

**Access**: `http://localhost:5555`

### Logging

```python
import logging

logger = logging.getLogger(__name__)

@shared_task(name="example_task")
def example_task(data):
    """Task with logging."""
    logger.info(f"Task started with data: {data}")
    
    try:
        # Task logic
        result = process_data(data)
        logger.info(f"Task completed successfully: {result}")
        return result
    
    except Exception as exc:
        logger.error(f"Task failed: {exc}", exc_info=True)
        raise
```

### Metrics

Key metrics to monitor:
- Queue length
- Task success rate
- Task failure rate
- Average task duration
- Worker CPU/memory usage

---

## Best Practices

### 1. Task Design

- Keep tasks idempotent (safe to retry)
- Use descriptive task names
- Pass minimal data (use IDs, not full objects)
- Set appropriate timeouts

### 2. Error Handling

- Always use try/except in tasks
- Log errors with context
- Set reasonable retry limits
- Use exponential backoff

### 3. Performance

- Use task queues for workload separation
- Set appropriate worker concurrency
- Monitor task duration
- Optimize database queries in tasks

### 4. Testing

- Test tasks synchronously
- Mock external dependencies
- Test retry behavior
- Test task chains and groups

---

## Related Documentation

- [Result Polling Strategy](result_polling.md) - Polling task implementation
- [Business Logic](business_logic.md) - Services used by tasks
- [Architecture](architecture.md) - Background task architecture
- [Caching](caching.md) - Caching in background tasks