"""Celery Application Configuration."""

from typing import TYPE_CHECKING, Any

from celery import Celery  # type: ignore[import-untyped]

from app.tasks.celery_config import (
    beat_schedule,
    result_backend_transport_options,
    result_expires,
    task_acks_late,
    task_reject_on_worker_lost,
    task_send_sent_event,
    task_soft_time_limit,
    task_time_limit,
    task_track_started,
    worker_concurrency,
    worker_max_tasks_per_child,
    worker_prefetch_multiplier,
)

if TYPE_CHECKING:
    from celery import Celery as CeleryType

# Create Celery app
celery_app: "CeleryType" = Celery(
    "fantasyf1",
    broker="redis://redis:6379/1",
    backend="redis://redis:6379/2",
    include=["app.tasks.data_sync"],
)

# Apply configuration settings from celery_config.py
celery_app.conf.update(
    beat_schedule=beat_schedule,
    task_acks_late=task_acks_late,
    task_reject_on_worker_lost=task_reject_on_worker_lost,
    task_time_limit=task_time_limit,
    task_soft_time_limit=task_soft_time_limit,
    task_track_started=task_track_started,
    task_send_sent_event=task_send_sent_event,
    result_expires=result_expires,
    result_backend_transport_options=result_backend_transport_options,
    worker_prefetch_multiplier=worker_prefetch_multiplier,
    worker_max_tasks_per_child=worker_max_tasks_per_child,
    worker_concurrency=worker_concurrency,
)

# Additional Celery settings
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/New_York",
    enable_utc=True,
    task_routes={
        "app.tasks.data_sync.sync_race_results": {"queue": "data_sync"},
        "app.tasks.data_sync.check_draft_closures": {"queue": "draft"},
        "app.tasks.data_sync.start_drafts": {"queue": "draft"},
        "app.tasks.data_sync.calculate_constructor_points": {"queue": "scoring"},
        "app.tasks.data_sync.cleanup_old_notifications": {"queue": "maintenance"},
        "app.tasks.data_sync.sync_external_data": {"queue": "data_sync"},
    },
)

if __name__ == "__main__":
    celery_app.start()
