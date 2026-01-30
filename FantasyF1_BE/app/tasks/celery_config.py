"""Celery Beat configuration for scheduled tasks."""

import os
from datetime import timedelta
from typing import TYPE_CHECKING, Any

from celery.schedules import crontab

from app.core.config import settings

if TYPE_CHECKING:
    from celery.schedules import Schedule

# Celery Beat Schedule Configuration
beat_schedule: dict[str, dict[str, Any]] = {
    # Sync race results every 2 hours
    "sync_race_results": {
        "task": "app.tasks.data_sync.sync_race_results",
        "schedule": timedelta(hours=2),
        "options": {"expires": 3600},  # Task expires if not run within 1 hour
    },
    # Check draft closures every 15 minutes
    "check_draft_closures": {
        "task": "app.tasks.data_sync.check_draft_closures",
        "schedule": crontab(minute="*/15"),  # Every 15 minutes
        "options": {"expires": 600},  # Task expires if not run within 10 minutes
    },
    # Start drafts daily at 6 PM ET (Eastern Time)
    "start_drafts": {
        "task": "app.tasks.data_sync.start_drafts",
        "schedule": crontab(
            hour=18,  # 6 PM
            minute=0,
            timezone="America/New_York",
        ),
        "options": {"expires": 3600},  # Task expires if not run within 1 hour
    },
    # Calculate constructor points nightly at 1 AM ET
    "calculate_constructor_points": {
        "task": "app.tasks.data_sync.calculate_constructor_points",
        "schedule": crontab(
            hour=1,  # 1 AM
            minute=0,
            timezone="America/New_York",
        ),
        "options": {"expires": 3600},  # Task expires if not run within 1 hour
    },
    # Clean up old notifications weekly (Sundays at 2 AM)
    "cleanup_old_notifications": {
        "task": "app.tasks.data_sync.cleanup_old_notifications",
        "schedule": crontab(
            day_of_week="sun",  # Sunday
            hour=2,  # 2 AM
            minute=0,
            timezone="America/New_York",
        ),
        "options": {"expires": 3600},
    },
    # Sync external data (drivers, constructors) daily at 3 AM
    "sync_external_data": {
        "task": "app.tasks.data_sync.sync_external_data",
        "schedule": crontab(
            hour=3,  # 3 AM
            minute=0,
            timezone="America/New_York",
        ),
        "options": {"expires": 3600},
    },
}

# Apply schedule only if DATABASE_URL is set (enables environment-based control)
if not settings.DATABASE_URL:
    beat_schedule.clear()

# Worker configuration
worker_prefetch_multiplier = 4  # Number of tasks to prefetch
worker_max_tasks_per_child = 1000  # Restart worker after N tasks to prevent memory leaks
worker_concurrency = os.cpu_count() or 2  # Number of worker processes

# Task settings
task_acks_late = True  # Acknowledge task after it's done (not when received)
task_reject_on_worker_lost = True  # Reject tasks if worker is lost
task_time_limit = 3600  # 1 hour hard time limit
task_soft_time_limit = 3300  # 55 minutes soft time limit
task_track_started = True  # Track when tasks start
task_send_sent_event = True  # Send events for task execution

# Result backend settings
result_expires = timedelta(days=7)  # Results expire after 7 days
result_backend_transport_options = {
    "retry_on_timeout": True,
}

# timezone for Celery
timezone = "America/New_York"
enable_utc = False  # Use local timezone
