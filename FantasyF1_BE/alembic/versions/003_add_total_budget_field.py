"""Add total_budget field to fantasy_teams table.

This migration adds:
- total_budget to fantasy_teams table (default: 100)

Revision ID: 003_add_total_budget_field
Revises: 002_add_draft_timer_fields
Create Date: 2026-02-03
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_add_total_budget_field"
down_revision: str | None = "002_add_draft_timer_fields"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Add total_budget field to fantasy_teams table."""
    # Add total_budget to fantasy_teams
    op.add_column(
        "fantasy_teams",
        sa.Column("total_budget", sa.Integer(), server_default="100", nullable=False),
    )


def downgrade() -> None:
    """Remove total_budget field from fantasy_teams table."""
    # Remove total_budget from fantasy_teams
    op.drop_column("fantasy_teams", "total_budget")