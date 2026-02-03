"""Initial database schema for FantasyF1 application.

This migration consolidates all initial database tables:
- Users
- Constructors
- Drivers
- Races (with session times)
- Leagues
- User Leagues (association)
- League Invitations
- League Roles
- Fantasy Teams
- Team Picks
- Draft Orders
- Draft Picks
- Race Results
- Driver Stats
- Notifications
- Error Logs

Revision ID: 001_initial_schema
Revises:
Create Date: 2026-01-30
"""

from collections.abc import Sequence

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Create all initial database tables."""
    
    # ========================================
    # USERS TABLE
    # ========================================
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("is_superuser", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # ========================================
    # CONSTRUCTORS TABLE
    # ========================================
    op.create_table(
        "constructors",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("team_name", sa.String(length=100), nullable=False),
        sa.Column("team_code", sa.String(length=10), nullable=False),
        sa.Column("engine", sa.String(length=50), nullable=True),
        sa.Column("chassis", sa.String(length=50), nullable=True),
        sa.Column("nationality", sa.String(length=50), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
        sa.Column("world_wins", sa.Integer(), server_default="0", nullable=False),
        sa.Column("world_championships", sa.Integer(), server_default="0", nullable=False),
        sa.Column("current_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("team_code"),
    )
    op.create_index(op.f("ix_constructors_id"), "constructors", ["id"])
    op.create_index(op.f("ix_constructors_team_name"), "constructors", ["team_name"], unique=False)

    # ========================================
    # DRIVERS TABLE
    # ========================================
    op.create_table(
        "drivers",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("number", sa.Integer(), nullable=True),
        sa.Column("nationality", sa.String(length=50), nullable=True),
        sa.Column("external_id", sa.Integer(), nullable=False),
        sa.Column("team_name", sa.String(length=255), nullable=False),
        sa.Column("code", sa.String(length=3), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("price", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="active", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("number", "year"),
        sa.UniqueConstraint("external_id"),
    )
    op.create_index(op.f("ix_drivers_id"), "drivers", ["id"])
    op.create_index(op.f("ix_drivers_name"), "drivers", ["name"], unique=False)
    op.create_index(op.f("ix_drivers_team"), "drivers", ["team_name"], unique=False)
    op.create_index(op.f("ix_drivers_external_id"), "drivers", ["external_id"], unique=True)
    op.create_index(op.f("ix_drivers_status"), "drivers", ["status"], unique=False)

    # ========================================
    # RACES TABLE
    # ========================================
    op.create_table(
        "races",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("circuit_name", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=50), nullable=False),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("race_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("external_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="upcoming", nullable=False),
        sa.Column("fp1_date", sa.DateTime(), nullable=True),
        sa.Column("fp2_date", sa.DateTime(), nullable=True),
        sa.Column("fp3_date", sa.DateTime(), nullable=True),
        sa.Column("qualifying_date", sa.DateTime(), nullable=True),
        sa.Column("sprint_date", sa.DateTime(), nullable=True),
        sa.Column("winning_constructor_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["winning_constructor_id"], ["constructors.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("round_number"),
        sa.UniqueConstraint("external_id"),
    )
    op.create_index(op.f("ix_races_id"), "races", ["id"])
    op.create_index(op.f("ix_races_round_number"), "races", ["round_number"], unique=True)
    op.create_index(op.f("ix_races_race_date"), "races", ["race_date"], unique=False)
    op.create_index(op.f("ix_races_external_id"), "races", ["external_id"], unique=True)
    op.create_index("ix_races_winning_constructor_id", "races", ["winning_constructor_id"])

    # ========================================
    # LEAGUES TABLE
    # ========================================
    op.create_table(
        "leagues",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("max_teams", sa.Integer(), server_default="10", nullable=False),
        sa.Column("is_private", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "draft_method",
            sa.String(length=20),
            server_default="manual",
            nullable=False,
        ),
        sa.Column("draft_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("draft_close_condition", sa.String(20), nullable=False, server_default="manual"),
        sa.Column("scoring_settings", sa.Text(), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], name="fk_league_creator"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
    )
    op.create_index(op.f("ix_leagues_id"), "leagues", ["id"])
    op.create_index(op.f("ix_leagues_name"), "leagues", ["name"], unique=False)
    op.create_index(op.f("ix_leagues_code"), "leagues", ["code"], unique=True)
    op.create_index(op.f("ix_leagues_creator_id"), "leagues", ["creator_id"], unique=False)

    # ========================================
    # USER_LEAGUES ASSOCIATION TABLE
    # ========================================
    op.create_table(
        "user_leagues",
        sa.Column("user_id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column("league_id", sa.Integer(), autoincrement=False, nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"], name="fk_user_league_league"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_user_league_user"),
        sa.PrimaryKeyConstraint("user_id", "league_id"),
    )
    op.create_index(op.f("ix_user_leagues_user_id"), "user_leagues", ["user_id"])
    op.create_index(op.f("ix_user_leagues_league_id"), "user_leagues", ["league_id"])

    # ========================================
    # LEAGUE_INVITATIONS TABLE
    # ========================================
    op.create_table(
        "league_invitations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("inviter_id", sa.Integer(), nullable=False),
        sa.Column("invitee_id", sa.Integer(), nullable=True),
        sa.Column(
            "invitee_email",
            sa.String(length=255),
            nullable=True,
        ),
        sa.Column(
            "invitee_username",
            sa.String(length=50),
            nullable=True,
        ),
        sa.Column(
            "invite_code",
            sa.String(length=32),
            nullable=True,
        ),
        sa.Column(
            "status",
            sa.String(length=20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "invitation_type",
            sa.String(length=20),
            nullable=False,
        ),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=True),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("(datetime('utc')::timestamp)"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("(datetime('utc')::timestamp)"),
        ),
        sa.ForeignKeyConstraint(["inviter_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["invitee_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_league_invitations_id"), "league_invitations", ["id"])
    op.create_index(op.f("ix_league_invitations_league_id"), "league_invitations", ["league_id"])
    op.create_index(op.f("ix_league_invitations_inviter_id"), "league_invitations", ["inviter_id"])
    op.create_index(op.f("ix_league_invitations_invitee_id"), "league_invitations", ["invitee_id"])
    op.create_index(op.f("ix_league_invitations_invitee_email"), "league_invitations", ["invitee_email"])
    op.create_index(
        op.f("ix_league_invitations_invitee_username"),
        "league_invitations",
        ["invitee_username"],
    )
    op.create_index(
        op.f("ix_league_invitations_invite_code"),
        "league_invitations",
        ["invite_code"],
        unique=True,
    )
    op.create_index(op.f("ix_league_invitations_status"), "league_invitations", ["status"])
    op.create_index(op.f("ix_league_invitations_expires_at"), "league_invitations", ["expires_at"])

    # ========================================
    # LEAGUE_ROLES TABLE
    # ========================================
    op.create_table(
        "league_roles",
        sa.Column("id", sa.Integer(), nullable=False, primary_key=True),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="member"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_league_roles_league_id"), "league_roles", ["league_id"])
    op.create_index(op.f("ix_league_roles_user_id"), "league_roles", ["user_id"])

    # ========================================
    # FANTASY_TEAMS TABLE
    # ========================================
    op.create_table(
        "fantasy_teams",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("total_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("budget_remaining", sa.Integer(), server_default="100", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"], name="fk_fantasy_team_league"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name="fk_fantasy_team_user"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_fantasy_teams_id"), "fantasy_teams", ["id"])
    op.create_index(op.f("ix_fantasy_teams_user_id"), "fantasy_teams", ["user_id"], unique=False)
    op.create_index(op.f("ix_fantasy_teams_league_id"), "fantasy_teams", ["league_id"], unique=False)
    op.create_index(op.f("ix_fantasy_teams_name"), "fantasy_teams", ["name"], unique=False)
    op.create_index(op.f("ix_fantasy_teams_total_points"), "fantasy_teams", ["total_points"], unique=False)

    # ========================================
    # TEAM_PICKS TABLE
    # ========================================
    op.create_table(
        "team_picks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("fantasy_team_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=True),
        sa.Column("constructor_id", sa.Integer(), nullable=True),
        sa.Column("pick_type", sa.String(length=20), nullable=False),
        sa.Column("points_earned", sa.Integer(), server_default="0", nullable=False),
        sa.Column("race_id", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["race_id"], ["races.id"], name="fk_team_pick_race"),
        sa.ForeignKeyConstraint(["constructor_id"], ["constructors.id"], name="fk_team_pick_constructor"),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"], name="fk_team_pick_driver"),
        sa.ForeignKeyConstraint(["fantasy_team_id"], ["fantasy_teams.id"], name="fk_team_pick_fantasy_team"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_team_picks_id"), "team_picks", ["id"])
    op.create_index(op.f("ix_team_picks_fantasy_team_id"), "team_picks", ["fantasy_team_id"], unique=False)
    op.create_index(op.f("ix_team_picks_driver_id"), "team_picks", ["driver_id"], unique=False)
    op.create_index(op.f("ix_team_picks_constructor_id"), "team_picks", ["constructor_id"], unique=False)
    op.create_index(op.f("ix_team_picks_race_id"), "team_picks", ["race_id"], unique=False)

    # ========================================
    # DRAFT_ORDERS TABLE
    # ========================================
    op.create_table(
        "draft_orders",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("race_id", sa.Integer(), nullable=False),
        sa.Column(
            "draft_method",
            sa.String(length=20),
            server_default="sequential",
            nullable=False,
        ),
        sa.Column("order_data", sa.String(length=1000), nullable=False),
        sa.Column("is_manual", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("last_modified_by", sa.Integer(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["last_modified_by"], ["users.id"], name="fk_draft_order_user"),
        sa.ForeignKeyConstraint(["race_id"], ["races.id"], name="fk_draft_order_race"),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"], name="fk_draft_order_league"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_draft_orders_id"), "draft_orders", ["id"])
    op.create_index(op.f("ix_draft_orders_league_id"), "draft_orders", ["league_id"], unique=False)
    op.create_index(op.f("ix_draft_orders_race_id"), "draft_orders", ["race_id"], unique=False)
    op.create_index(op.f("ix_draft_orders_last_modified_by"), "draft_orders", ["last_modified_by"], unique=False)

    # ========================================
    # DRAFT_PICKS TABLE
    # ========================================
    op.create_table(
        "draft_picks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("league_id", sa.Integer(), nullable=False),
        sa.Column("race_id", sa.Integer(), nullable=False),
        sa.Column("fantasy_team_id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("pick_number", sa.Integer(), nullable=False),
        sa.Column("pick_round", sa.Integer(), server_default="1", nullable=False),
        sa.Column("draft_position", sa.Integer(), nullable=False),
        sa.Column("is_auto_pick", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "picked_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"], name="fk_draft_pick_driver"),
        sa.ForeignKeyConstraint(["fantasy_team_id"], ["fantasy_teams.id"], name="fk_draft_pick_fantasy_team"),
        sa.ForeignKeyConstraint(["race_id"], ["races.id"], name="fk_draft_pick_race"),
        sa.ForeignKeyConstraint(["league_id"], ["leagues.id"], name="fk_draft_pick_league"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_draft_picks_id"), "draft_picks", ["id"])
    op.create_index(op.f("ix_draft_picks_league_id"), "draft_picks", ["league_id"], unique=False)
    op.create_index(op.f("ix_draft_picks_race_id"), "draft_picks", ["race_id"], unique=False)
    op.create_index(op.f("ix_draft_picks_fantasy_team_id"), "draft_picks", ["fantasy_team_id"], unique=False)
    op.create_index(op.f("ix_draft_picks_driver_id"), "draft_picks", ["driver_id"], unique=False)
    op.create_index(op.f("ix_draft_picks_picked_at"), "draft_picks", ["picked_at"], unique=False)

    # ========================================
    # RACE_RESULTS TABLE
    # ========================================
    op.create_table(
        "race_results",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("race_id", sa.Integer(), nullable=False),
        sa.Column("driver_external_id", sa.Integer(), nullable=False),
        sa.Column("driver_name", sa.String(length=255), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("grid_position", sa.Integer(), nullable=True),
        sa.Column("laps_completed", sa.Integer(), nullable=True),
        sa.Column("points_earned", sa.Integer(), server_default="0", nullable=False),
        sa.Column("fastest_lap", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("fastest_lap_time", sa.Numeric(precision=10, scale=3), nullable=True),
        sa.Column("time_diff", sa.Numeric(precision=10, scale=3), nullable=True),
        sa.Column("time_diff_str", sa.String(length=20), nullable=True),
        sa.Column("dnf", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("dnf_reason", sa.String(length=255), nullable=True),
        sa.Column("dns", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("dsq", sa.Boolean(), server_default="false", nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["race_id"], ["races.id"], name="fk_race_result_race"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_race_results_id"), "race_results", ["id"])
    op.create_index(op.f("ix_race_results_race_id"), "race_results", ["race_id"], unique=False)
    op.create_index(op.f("ix_race_results_driver_external_id"), "race_results", ["driver_external_id"], unique=False)
    op.create_index(op.f("ix_race_results_position"), "race_results", ["position"], unique=False)

    # ========================================
    # DRIVER_STATS TABLE
    # ========================================
    op.create_table(
        "driver_stats",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("season", sa.Integer(), nullable=False),
        sa.Column("races_entered", sa.Integer(), server_default="0", nullable=False),
        sa.Column("races_finished", sa.Integer(), server_default="0", nullable=False),
        sa.Column("total_points", sa.Integer(), server_default="0", nullable=False),
        sa.Column("wins", sa.Integer(), server_default="0", nullable=False),
        sa.Column("podiums", sa.Integer(), server_default="0", nullable=False),
        sa.Column("pole_positions", sa.Integer(), server_default="0", nullable=False),
        sa.Column("fastest_laps", sa.Integer(), server_default="0", nullable=False),
        sa.Column("dnf_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("dns_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("dsq_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("average_finish_position", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("best_finish_position", sa.Integer(), nullable=True),
        sa.Column("worst_finish_position", sa.Integer(), nullable=True),
        sa.Column("average_grid_position", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("retirement_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("podium_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("win_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("top10_rate", sa.Numeric(precision=5, scale=4), nullable=True),
        sa.Column("points_per_race", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("NOW()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["driver_id"], ["drivers.id"], name="fk_driver_stats_driver"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_driver_stats_id"), "driver_stats", ["id"])
    op.create_index(op.f("ix_driver_stats_driver_id"), "driver_stats", ["driver_id"], unique=False)
    op.create_index(op.f("ix_driver_stats_season"), "driver_stats", ["season"], unique=False)

    # ========================================
    # NOTIFICATIONS TABLE
    # ========================================
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
    op.create_index(op.f("ix_notifications_id"), "notifications", ["id"], unique=False)
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)
    op.create_index(op.f("ix_notifications_type"), "notifications", ["type"], unique=False)
    op.create_index(op.f("ix_notifications_link"), "notifications", ["link"], unique=False)
    op.create_index(op.f("ix_notifications_is_read"), "notifications", ["is_read"], unique=False)
    op.create_index(op.f("ix_notifications_created_at"), "notifications", ["created_at"], unique=False)
    op.create_index("idx_notifications_user_read", "notifications", ["user_id", "is_read"], unique=False)
    op.create_index("idx_notifications_user_type", "notifications", ["user_id", "type"], unique=False)

    # ========================================
    # ERROR_LOGS TABLE
    # ========================================
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
    op.create_index(op.f("ix_error_logs_id"), "error_logs", ["id"], unique=False)
    op.create_index(op.f("ix_error_logs_timestamp"), "error_logs", ["timestamp"], unique=False)
    op.create_index(op.f("ix_error_logs_error_type"), "error_logs", ["error_type"], unique=False)
    op.create_index(op.f("ix_error_logs_endpoint"), "error_logs", ["endpoint"], unique=False)
    op.create_index(op.f("ix_error_logs_user_id"), "error_logs", ["user_id"], unique=False)
    op.create_index(op.f("ix_error_logs_severity"), "error_logs", ["severity"], unique=False)
    op.create_index(op.f("ix_error_logs_resolved"), "error_logs", ["resolved"], unique=False)
    op.create_index("idx_error_logs_timestamp_severity", "error_logs", ["timestamp", "severity"], unique=False)
    op.create_index("idx_error_logs_user_resolved", "error_logs", ["user_id", "resolved"], unique=False)
    op.create_index("idx_error_logs_endpoint_severity", "error_logs", ["endpoint", "severity"], unique=False)


def downgrade() -> None:
    """Drop all tables in reverse order of creation."""
    
    # Drop error_logs tables first
    op.drop_index("idx_error_logs_endpoint_severity", table_name="error_logs")
    op.drop_index("idx_error_logs_user_resolved", table_name="error_logs")
    op.drop_index("idx_error_logs_timestamp_severity", table_name="error_logs")
    op.drop_index(op.f("ix_error_logs_resolved"), table_name="error_logs")
    op.drop_index(op.f("ix_error_logs_severity"), table_name="error_logs")
    op.drop_index(op.f("ix_error_logs_user_id"), table_name="error_logs")
    op.drop_index(op.f("ix_error_logs_endpoint"), table_name="error_logs")
    op.drop_index(op.f("ix_error_logs_error_type"), table_name="error_logs")
    op.drop_index(op.f("ix_error_logs_timestamp"), table_name="error_logs")
    op.drop_index(op.f("ix_error_logs_id"), table_name="error_logs")
    op.drop_table("error_logs")

    # Drop notifications table
    op.drop_index("idx_notifications_user_type", table_name="notifications")
    op.drop_index("idx_notifications_user_read", table_name="notifications")
    op.drop_index(op.f("ix_notifications_created_at"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_is_read"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_link"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_type"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_user_id"), table_name="notifications")
    op.drop_index(op.f("ix_notifications_id"), table_name="notifications")
    op.drop_table("notifications")

    # Drop driver_stats table
    op.drop_index(op.f("ix_driver_stats_season"), table_name="driver_stats")
    op.drop_index(op.f("ix_driver_stats_driver_id"), table_name="driver_stats")
    op.drop_index(op.f("ix_driver_stats_id"), table_name="driver_stats")
    op.drop_table("driver_stats")

    # Drop race_results table
    op.drop_index(op.f("ix_race_results_position"), table_name="race_results")
    op.drop_index(op.f("ix_race_results_driver_external_id"), table_name="race_results")
    op.drop_index(op.f("ix_race_results_race_id"), table_name="race_results")
    op.drop_index(op.f("ix_race_results_id"), table_name="race_results")
    op.drop_table("race_results")

    # Drop draft_picks table
    op.drop_index(op.f("ix_draft_picks_picked_at"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_driver_id"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_fantasy_team_id"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_race_id"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_league_id"), table_name="draft_picks")
    op.drop_index(op.f("ix_draft_picks_id"), table_name="draft_picks")
    op.drop_table("draft_picks")

    # Drop draft_orders table
    op.drop_index(op.f("ix_draft_orders_last_modified_by"), table_name="draft_orders")
    op.drop_index(op.f("ix_draft_orders_race_id"), table_name="draft_orders")
    op.drop_index(op.f("ix_draft_orders_league_id"), table_name="draft_orders")
    op.drop_index(op.f("ix_draft_orders_id"), table_name="draft_orders")
    op.drop_table("draft_orders")

    # Drop team_picks table
    op.drop_index(op.f("ix_team_picks_race_id"), table_name="team_picks")
    op.drop_index(op.f("ix_team_picks_constructor_id"), table_name="team_picks")
    op.drop_index(op.f("ix_team_picks_driver_id"), table_name="team_picks")
    op.drop_index(op.f("ix_team_picks_fantasy_team_id"), table_name="team_picks")
    op.drop_index(op.f("ix_team_picks_id"), table_name="team_picks")
    op.drop_table("team_picks")

    # Drop fantasy_teams table
    op.drop_index(op.f("ix_fantasy_teams_total_points"), table_name="fantasy_teams")
    op.drop_index(op.f("ix_fantasy_teams_name"), table_name="fantasy_teams")
    op.drop_index(op.f("ix_fantasy_teams_league_id"), table_name="fantasy_teams")
    op.drop_index(op.f("ix_fantasy_teams_user_id"), table_name="fantasy_teams")
    op.drop_index(op.f("ix_fantasy_teams_id"), table_name="fantasy_teams")
    op.drop_table("fantasy_teams")

    # Drop league_roles table
    op.drop_index(op.f("ix_league_roles_user_id"), table_name="league_roles")
    op.drop_index(op.f("ix_league_roles_league_id"), table_name="league_roles")
    op.drop_table("league_roles")

    # Drop league_invitations table
    op.drop_index(op.f("ix_league_invitations_expires_at"), table_name="league_invitations")
    op.drop_index(op.f("ix_league_invitations_status"), table_name="league_invitations")
    op.drop_index(op.f("ix_league_invitations_invite_code"), table_name="league_invitations")
    op.drop_index(op.f("ix_league_invitations_invitee_username"), table_name="league_invitations")
    op.drop_index(op.f("ix_league_invitations_invitee_email"), table_name="league_invitations")
    op.drop_index(op.f("ix_league_invitations_invitee_id"), table_name="league_invitations")
    op.drop_index(op.f("ix_league_invitations_inviter_id"), table_name="league_invitations")
    op.drop_index(op.f("ix_league_invitations_league_id"), table_name="league_invitations")
    op.drop_index(op.f("ix_league_invitations_id"), table_name="league_invitations")
    op.drop_table("league_invitations")

    # Drop user_leagues table
    op.drop_index(op.f("ix_user_leagues_league_id"), table_name="user_leagues")
    op.drop_index(op.f("ix_user_leagues_user_id"), table_name="user_leagues")
    op.drop_table("user_leagues")

    # Drop leagues table
    op.drop_index(op.f("ix_leagues_creator_id"), table_name="leagues")
    op.drop_index(op.f("ix_leagues_code"), table_name="leagues")
    op.drop_index(op.f("ix_leagues_name"), table_name="leagues")
    op.drop_index(op.f("ix_leagues_id"), table_name="leagues")
    op.drop_table("leagues")

    # Drop races table
    op.drop_index(op.f("ix_races_winning_constructor_id"), table_name="races")
    op.drop_index(op.f("ix_races_external_id"), table_name="races")
    op.drop_index(op.f("ix_races_race_date"), table_name="races")
    op.drop_index(op.f("ix_races_round_number"), table_name="races")
    op.drop_index(op.f("ix_races_id"), table_name="races")
    op.drop_table("races")

    # Drop drivers table
    op.drop_index(op.f("ix_drivers_status"), table_name="drivers")
    op.drop_index(op.f("ix_drivers_external_id"), table_name="drivers")
    op.drop_index(op.f("ix_drivers_team"), table_name="drivers")
    op.drop_index(op.f("ix_drivers_name"), table_name="drivers")
    op.drop_index(op.f("ix_drivers_id"), table_name="drivers")
    op.drop_table("drivers")

    # Drop constructors table
    op.drop_index(op.f("ix_constructors_team_name"), table_name="constructors")
    op.drop_index(op.f("ix_constructors_id"), table_name="constructors")
    op.drop_table("constructors")

    # Drop users table last (as it's likely referenced by many other tables)
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")