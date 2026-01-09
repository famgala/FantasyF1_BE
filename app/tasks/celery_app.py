"""Celery Application Configuration"""

from celery import Celery

celery_app = Celery(
    "fantasyf1",
    broker="redis://redis:6379/1",
    backend="redis://redis:6379/2",
    include=["app.tasks.data_sync"],
)

