"""Add price field to constructors and computed fields to team_picks

Revision ID: 003
Revises: 002
Create Date: 2026-02-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add price field to constructors table."""
    op.add_column(
        "constructors",
        sa.Column("price", sa.Integer(), server_default="0", nullable=False),
    )
    # Add computed fields to team_picks (nullable for existing records)
    op.add_column(
        "team_picks",
        sa.Column("budget_remaining", sa.Integer(), nullable=True),
    )
    op.add_column(
        "team_picks",
        sa.Column("price", sa.Integer(), nullable=True),
    )


def downgrade() -> None:
    """Remove price field from constructors and computed fields from team_picks."""
    op.drop_column("team_picks", "price")
    op.drop_column("team_picks", "budget_remaining")
    op.drop_column("constructors", "price")