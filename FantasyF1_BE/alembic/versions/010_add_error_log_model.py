"""Add error log model.

Revision ID: 010
Revises: 009
Create Date: 2026-01-27

"""
from collections.abc import Sequence
from typing import Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create error_logs table
    op.create_table(
        "error_logs",
        sa.Column(
            "id",
            sa.Integer(),
            nullable=False,
        ),
        sa.Column(
            "timestamp",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "level",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column(
            "message",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "module",
            sa.String(length=200),
            nullable=True,
        ),
        sa.Column(
            "function",
            sa.String(length=200),
            nullable=True,
        ),
        sa.Column(
            "line_number",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "endpoint",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "method",
            sa.String(length=10),
            nullable=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "request_id",
            sa.String(length=100),
            nullable=True,
        ),
        sa.Column(
            "stack_trace",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "additional_data",
            sa.Text(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_error_logs_id"),
        "error_logs",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_error_logs_timestamp"),
        "error_logs",
        ["timestamp"],
        unique=False,
    )
    op.create_index(
        op.f("ix_error_logs_level"),
        "error_logs",
        ["level"],
        unique=False,
    )
    op.create_index(
        op.f("ix_error_logs_user_id"),
        "error_logs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_error_logs_endpoint"),
        "error_logs",
        ["endpoint"],
        unique=False,
    )
    op.create_index(
        op.f("ix_error_logs_user_id"),
        "error_logs",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        "idx_error_logs_level_timestamp",
        "error_logs",
        ["level", "timestamp"],
        unique=False,
    )
    op.create_index(
        "idx_error_logs_user_timestamp",
        "error_logs",
        ["user_id", "timestamp"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "idx_error_logs_user_timestamp",
        table_name="error_logs",
    )
    op.drop_index(
        "idx_error_logs_level_timestamp",
        table_name="error_logs",
    )
    op.drop_index(
        op.f("ix_error_logs_user_id"),
        table_name="error_logs",
    )
    op.drop_index(
        op.f("ix_error_logs_endpoint"),
        table_name="error_logs",
    )
    op.drop_index(
        op.f("ix_error_logs_level"),
        table_name="error_logs",
    )
    op.drop_index(
        op.f("ix_error_logs_user_id"),
        table_name="error_logs",
    )
    op.drop_index(
        op.f("ix_error_logs_timestamp"),
        table_name="error_logs",
    )
    op.drop_index(
        op.f("ix_error_logs_id"),
        table_name="error_logs",
    )
    op.drop_table("error_logs")
