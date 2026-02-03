"""Add user preferences fields.

Revision ID: 004
Revises: 003_add_total_budget
Create Date: 2026-02-03 20:49:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004'
down_revision: Union[str, None] = '003_add_total_budget'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add user preferences columns to users table."""
    # Email notification preferences
    op.add_column('users', sa.Column('notify_race_completed', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('notify_draft_turn', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('notify_league_invitations', sa.Boolean(), nullable=False, server_default='true'))
    op.add_column('users', sa.Column('notify_team_updates', sa.Boolean(), nullable=False, server_default='true'))
    
    # Display preferences
    op.add_column('users', sa.Column('theme_preference', sa.String(20), nullable=False, server_default='system'))
    op.add_column('users', sa.Column('language_preference', sa.String(10), nullable=False, server_default='en'))
    op.add_column('users', sa.Column('timezone_preference', sa.String(50), nullable=False, server_default='UTC'))
    
    # Privacy settings
    op.add_column('users', sa.Column('profile_visibility', sa.String(20), nullable=False, server_default='public'))
    op.add_column('users', sa.Column('show_email_to_league_members', sa.Boolean(), nullable=False, server_default='false'))
    
    # Auto-pick preferences
    op.add_column('users', sa.Column('auto_pick_enabled', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('auto_pick_strategy', sa.String(20), nullable=False, server_default='highest_ranked'))


def downgrade() -> None:
    """Remove user preferences columns from users table."""
    # Email notification preferences
    op.drop_column('users', 'notify_team_updates')
    op.drop_column('users', 'notify_league_invitations')
    op.drop_column('users', 'notify_draft_turn')
    op.drop_column('users', 'notify_race_completed')
    
    # Display preferences
    op.drop_column('users', 'timezone_preference')
    op.drop_column('users', 'language_preference')
    op.drop_column('users', 'theme_preference')
    
    # Privacy settings
    op.drop_column('users', 'show_email_to_league_members')
    op.drop_column('users', 'profile_visibility')
    
    # Auto-pick preferences
    op.drop_column('users', 'auto_pick_strategy')
    op.drop_column('users', 'auto_pick_enabled')