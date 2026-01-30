"""Add error log model.

Revision ID: 010
Revises: 009
Create Date: 2026-01-27

"""
from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "010"
down_revision: str | None = "009"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


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
            sa.DateTime(),
            nullable=False,
        ),
        sa.Column(
            "error_type",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "message",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "endpoint",
            sa.String(length=500),
            nullable=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "stack_trace",
            sa.Text(),
            nullable=True,
        ),
        sa.Column(
            "severity",
            sa.String(length=50),
            nullable=False,
            server_default="error",
        ),
        sa.Column(
            "request_data",
            sa.JSON(),
            nullable=True,
        ),
        sa.Column(
            "response_data",
            sa.JSON(),
            nullable=True,
        ),
        sa.Column(
            "ip_address",
            sa.String(length=45),
            nullable=True,
        ),
        sa.Column(
            "user_agent",
            sa.String(length=500),
            nullable=True,
        ),
        sa.Column(
            "resolved",
            sa.Boolean(),
            nullable=False,
            server_default="false",
        ),
        sa.Column(
            "resolved_at",
            sa.DateTime(),
            nullable=True,
        ),
        sa.Column(
            "resolved_by",
            sa.Integer(),
            nullable=True,
        ),
        sa.Column(
            "notes",
            sa.Text(),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["resolved_by"],
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
        op.f("ix_error_logs_error_type"),
        "error_logs",
        ["error_type"],
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
        op.f("ix_error_logs_severity"),
        "error_logs",
        ["severity"],
        unique=False,
    )
    op.create_index(
        op.f("ix_error_logs_resolved"),
        "error_logs",
        ["resolved"],
        unique=False,
    )
    op.create_index(
        "idx_error_logs_timestamp_severity",
        "error_logs",
        ["timestamp", "severity"],
        unique=False,
    )
    op.create_index(
        "idx_error_logs_user_resolved",
        "error_logs",
        ["user_id", "resolved"],
        unique=False,
    )
    op.create_index(
        "idx_error_logs_endpoint_severity",
        "error_logs",
        ["endpoint", "severity"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "idx_error_logs_endpoint_severity",
        table_name="error_logs",
    )
    op.drop_index(
        "idx_error_logs_user_resolved",
        table_name="error_logs",
    )
    op.drop_index(
        "idx_error_logs_timestamp_severity",
        table_name="error_logs",
    )
    op.drop_index(
        op.f("ix_error_logs_resolved"),
        table_name="error_logs",
    )
    op.drop_index(
        op.f("ix_error_logs_severity"),
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
        op.f("ix_error_logs_error_type"),
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
