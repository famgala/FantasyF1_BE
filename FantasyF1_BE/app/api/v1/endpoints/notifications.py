"""Notification endpoints for managing user notifications."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_current_user_id, get_db
from app.core.logging import get_logger
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService

logger = get_logger(__name__)

router = APIRouter()


@router.get("", response_model=list[NotificationResponse])
async def get_notifications(
    skip: int = Query(0, ge=0, description="Number of notifications to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of notifications to return"),
    unread_only: bool = Query(False, description="If true, only return unread notifications"),
    notification_type: str | None = Query(None, description="Filter by notification type"),
    db=Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    """Get notifications for the current user.

    Args:
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return
        unread_only: Filter to only show unread notifications
        notification_type: Filter by notification type
        db: Database session
        user_id: Current user ID

    Returns:
        List of notification objects
    """
    notifications, _ = await NotificationService.get_user_notifications(
        db=db,
        user_id=user_id,
        skip=skip,
        limit=limit,
        unread_only=unread_only,
        notification_type=notification_type,
    )
    return notifications


@router.get("/summary")
async def get_notification_summary(
    db=Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict[str, int]:
    """Get a summary of notifications for the current user.

    Args:
        db: Database session
        user_id: Current user ID

    Returns:
        Summary including unread count
    """
    unread_count = await NotificationService.get_unread_count(
        db=db,
        user_id=user_id,
    )
    return {"unread_count": unread_count}


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification_by_id(
    notification_id: int,
    db=Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Notification:
    """Get a specific notification by ID.

    Args:
        notification_id: Notification ID
        db: Database session
        user_id: Current user ID

    Returns:
        Notification object

    Raises:
        HTTPException: If notification not found
    """
    notification = await NotificationService.get_notification(
        db=db,
        notification_id=notification_id,
        user_id=user_id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notification


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_as_read(
    notification_id: int,
    db=Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Notification:
    """Mark a notification as read.

    Args:
        notification_id: Notification ID
        db: Database session
        user_id: Current user ID

    Returns:
        Updated notification object

    Raises:
        HTTPException: If notification not found
    """
    notification = await NotificationService.mark_as_read(
        db=db,
        notification_id=notification_id,
        user_id=user_id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notification


@router.patch("/{notification_id}/unread", response_model=NotificationResponse)
async def mark_notification_as_unread(
    notification_id: int,
    db=Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> Notification:
    """Mark a notification as unread.

    Args:
        notification_id: Notification ID
        db: Database session
        user_id: Current user ID

    Returns:
        Updated notification object

    Raises:
        HTTPException: If notification not found
    """
    notification = await NotificationService.mark_as_unread(
        db=db,
        notification_id=notification_id,
        user_id=user_id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notification


@router.post("/read-all", response_model=dict[str, int])
async def mark_all_notifications_as_read(
    db=Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> dict[str, int]:
    """Mark all notifications for the current user as read.

    Args:
        db: Database session
        user_id: Current user ID

    Returns:
        Dictionary with count of marked notifications
    """
    count = await NotificationService.mark_all_as_read(db=db, user_id=user_id)
    return {"count": count}


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: int,
    db=Depends(get_db),
    user_id: int = Depends(get_current_user_id),
) -> None:
    """Delete a notification.

    Args:
        notification_id: Notification ID
        db: Database session
        user_id: Current user ID

    Raises:
        HTTPException: If notification not found
    """
    deleted = await NotificationService.delete_notification(
        db=db,
        notification_id=notification_id,
        user_id=user_id,
    )
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
