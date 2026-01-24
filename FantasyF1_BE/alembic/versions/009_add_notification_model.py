"""Add notification model.

Revision ID: 009
Revises: 008
Create Date: 2026-01-21

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create notifications table
    op.create_table(
        "notifications",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "title",
            sa.String(length=200),
            nullable=False,
        ),
        sa.Column(
            "message",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "link",
            sa.String(length=500),
            nullable=True,
        ),
        sa.Column(
            "is_read",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "read_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column(
            "key_value_data",
            sa.Text(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_notifications_id"),
        "notifications",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_user_id"),
        "notifications",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_type"),
        "notifications",
        ["type"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_link"),
        "notifications",
        ["link"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_is_read"),
        "notifications",
        ["is_read"],
        unique=False,
    )
    op.create_index(
        op.f("ix_notifications_created_at"),
        "notifications",
        ["created_at"],
        unique=False,
    )
    op.create_index(
        "idx_notifications_user_read",
        "notifications",
        ["user_id", "is_read"],
        unique=False,
    )
    op.create_index(
        "idx_notifications_user_type",
        "notifications",
        ["user_id", "type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "idx_notifications_user_type",
        table_name="notifications",
    )
    op.drop_index(
        "idx_notifications_user_read",
        table_name="notifications",
    )
    op.drop_index(
        op.f("ix_notifications_created_at"),
        table_name="notifications",
    )
    op.drop_index(
        op.f("ix_notifications_is_read"),
        table_name="notifications",
    )
    op.drop_index(
        op.f("ix_notifications_link"),
        table_name="notifications",
    )
    op.drop_index(
        op.f("ix_notifications_type"),
        table_name="notifications",
    )
    op.drop_index(
        op.f("ix_notifications_user_id"),
        table_name="notifications",
    )
    op.drop_index(
        op.f("ix_notifications_id"),
        table_name="notifications",
    )
    op.drop_table("notifications")
