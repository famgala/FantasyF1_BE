# Data Models

This document describes the database schema, entity relationships, and model definitions for the Fantasy F1 Backend system with weekly drafting mechanics.

---

## MVP Overview: F1 Fantasy Mechanics

**Key Concept**: Unlike fantasy football where teams are static, Fantasy F1 uses weekly drafting:
- Users join leagues and become a "Constructor" (team)
- Each race, users draft 2 drivers for that race
- Draft order strategy is configurable by league managers (MVP default: rotation - last to draft becomes first in next race)
- Points accumulate to the Constructor's seasonal total (scoring model configurable by league managers)
- Two draft methods: sequential or snake style

**MVP Points Scoring Model**: Inverted position scoring system:
- 10th place driver: 10 points
- 9th place & 11th place: 9 points
- 8th place & 12th place: 8 points
- [...continuation pattern...]
- 1st place, 19th place & 20th place: 1 point

This gives middle-of-the-pack drivers the most value, encouraging strategic drafting.

---

  ## Entity Relationship Diagram

  ```
  ┌─────────────────┐       ┌─────────────┐       ┌─────────────┐
  │      User       │───────│ Constructor │───────│   Driver    │
  │─────────────────│  N:M  │─────────────│  1:N  │─────────────│
  │ id             │       │ id         │       │ id         │
  │ username       │       │ user_id    │◄──────│ name       │
  │ email          │       │ league_id  │       │ team_name  │
  │ hashed_password│       │ team_name  │       │ number     │
  │ bio            │       │ total_pts  │       │ price      │
  │ avatar_url     │       └─────────────┘       │ status     │
  │ is_public      │                               └─────────────┘
  │ is_email_search│                                        │
  │ is_user_search │                                        │ 1:N
  │ is_active      │                                        │
  │ created_at     │                                        │
  └───────┬─────────┘                                        │
          │                                                   │
          │ N:1                                                │
          │                                                   │
  ┌───────▼─────────┐                               ┌─────────────────┐
  │  LeagueMember   │                               │  DriverDraft    │
  │─────────────────│                               │─────────────────│
  │ id             │                               │ id              │
  │ user_id        │                               │ constructor_id  │
  │ league_id      │                               │ race_id         │
  │ role           │                               │ driver_id       │
  │ joined_at      │                               │ pick_number     │
  │ invited_by     │                               │ points_earned   │
  └─────────────────┘                               └─────────────────┘
          │                                                         │
          │ N:1                                                     │
          │                                                         │
  ┌───────▼─────────┐                               ┌─────────────┐
  │     League      │───────────────────────────────│RaceResult   │
  │─────────────────│                               │─────────────│
  │ id             │                               │ id         │
  │ name           │──────┬                        │ race_id    │
  │ description    │       │                        │ driver_id  │
  │ manager_id     │  N:1 │                        │ position   │
  │ code           │       │                        │ points     │
  │ status         │       │                        │ fastest_lap│
  │ current_race   │       │                        └─────────────┘
  │ total_races    │       │                                 │
  │ is_private     │       │                                 │
  │ draft_meth     │       │                                 │
  └─────────────────┘       │ N:1                             │
          │ 1:N               │                                 │
          │                   │                                 │
  ┌───────▼─────────┐ ┌──────▼─────────┐               ┌───────▼────────┐
  │  LeagueInvite   │ │   DraftOrder   │               │PasswordReset   │
  │─────────────────│ │─────────────────│               │────────────────│
  │ id             │ │ id             │               │ id             │
  │ league_id      │ │ league_id      │               │ user_id        │
  │ email          │ │ race_id        │               │ token          │
  │ token          │ │ method         │               │ expires_at     │
  │ role           │ │ order_strategy │               │ used_at        │
  │ status         │ │ order_data     │               └────────────────┘
  │ created_by     │ │ is_manual      │
  │ expires_at     │ └─────────────────┘
  │ accepted_at    │                        ┌──────────────┐
  └─────────────────┘                        │    Race      │
                                             │───────────────│
┌─────────────────┐                          │ id          │
│  Notification   │                          │ name        │
│─────────────────┤                          │ circuit     │
│ id             │--------------------------│ country     │
│ user_id        │  1:N                     │ race_date   │
│ type           │                          │ status      │
│ title          │                          └──────────────┘
│ message        │                                  │
│ is_read        │                                  │ 1:N
│ link           │                                  │
└─────────────────┘                  ┌───────────────────────────┐
                                    │ConstructorWeeklySummary   │
                                    │───────────────────────────│
                                    │ id                      │
                                    │ constructor_id          │
                                    │ race_id                 │
                                    │ summary_text            │
                                    │ points_earned           │
                                    │ rank_this_week          │
                                    └───────────────────────────┘
  ```

---

## Database Schema

### User Model (Enhanced)

```python
# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class UserRole(str, enum.Enum):
    """User roles."""
    USER = "user"
    ADMIN = "admin"


class User(Base):
    """User model for authentication and user management with enhanced profile features."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER)
    
    # Profile fields
    bio = Column(Text)  # User's bio/description
    avatar_url = Column(String(500))  # URL to avatar image (S3, Cloudinary, etc.)
    
    # Privacy settings
    is_publicly_discoverable = Column(Boolean, default=False)  # Can be found in public searches
    is_searchable_by_email = Column(Boolean, default=False)  # Can be found by exact email
    is_searchable_by_username = Column(Boolean, default=True)  # Can be found by exact username
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login_at = Column(DateTime(timezone=True))
    
    # Relationships
    constructors = relationship("Constructor", back_populates="user", cascade="all, delete-orphan")
    managed_leagues = relationship("League", back_populates="manager", foreign_keys="League.manager_id")
    league_memberships = relationship("LeagueMember", back_populates="user", cascade="all, delete-orphan")
    sent_invites = relationship("LeagueInvite", back_populates="created_by", foreign_keys="LeagueInvite.created_by")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    password_resets = relationship("PasswordReset", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
```

### Constructor Model (formerly Team)

```python
# app/models/constructor.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Constructor(Base):
    """Constructor model for user's team in a league (season-long entity)."""
    
    __tablename__ = "constructors"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Constructor owner and league
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    league_id = Column(Integer, ForeignKey("leagues.id", ondelete="CASCADE"), nullable=False)
    
    # Custom team name per league
    team_name = Column(String(100), nullable=False)
    
    # Season statistics
    total_points = Column(Float, default=0.0)
    rank = Column(Integer)
    
    # Constructor status
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="constructors")
    league = relationship("League", back_populates="constructors")
    driver_drafts = relationship("DriverDraft", back_populates="constructor", cascade="all, delete-orphan")
    weekly_summaries = relationship("ConstructorWeeklySummary", back_populates="constructor", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Constructor(id={self.id}, name='{self.team_name}', user_id={self.user_id}, league_id={self.league_id})>"
```

### DriverDraft Model (NEW)

```python
# app/models/driver_draft.py
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class DriverDraft(Base):
    """DriverDraft model for weekly driver selections (per race)."""
    
    __tablename__ = "driver_drafts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Links to constructor, race, and driver
    constructor_id = Column(Integer, ForeignKey("constructors.id", ondelete="CASCADE"), nullable=False)
    race_id = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    
    # Draft position (1st pick, 2nd pick, etc.)
    pick_number = Column(Integer, nullable=False)
    
    # Points earned for this specific race
    points_earned = Column(Float, default=0.0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    constructor = relationship("Constructor", back_populates="driver_drafts")
    race = relationship("Race")
    driver = relationship("Driver")
    
    # Unique constraint: one driver per constructor per race
    __table_args__ = (
        Index('idx_constructor_race', 'constructor_id', 'race_id'),
        Index('idx_driver_race', 'driver_id', 'race_id'),
    )
    
    def __repr__(self):
        return f"<DriverDraft(const_id={self.constructor_id}, race_id={self.race_id}, driver_id={self.driver_id}, pick={self.pick_number})>"
```

### DraftOrder Model (NEW)

```python
# app/models/draft_order.py
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
from pgvector.sqlalchemy import Vector  # For storing order as array


class DraftMethod(str):
    """Draft methods."""
    SEQUENTIAL = "sequential"  # 1,2,3,4,5; 1,2,3,4,5
    SNAKE = "snake"           # 1,2,3,4,5; 5,4,3,2,1


class DraftOrder(Base):
    """DraftOrder model for tracking draft order per race in a league.
    
    The draft order strategy is configurable and can include:
    - Rotation: Last to draft becomes first in next race (MVP default)
    - Reverse standings: Bottom constructors pick first
    - Random: Randomized each race
    - Manual: League manager sets the order manually
    """
    
    __tablename__ = "draft_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Links to league and race
    league_id = Column(Integer, ForeignKey("leagues.id", ondelete="CASCADE"), nullable=False)
    race_id = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    
    # Draft method used (sequential or snake)
    method = Column(String(20), nullable=False, default="sequential")
    
    # Draft order strategy used for generating this order
    # Options: "rotation", "reverse_standings", "random", "manual"
    order_strategy = Column(String(30), nullable=False, default="rotation")
    
    # Ordered list of user IDs representing draft order
    # Stored as JSON array: [user_id_1, user_id_2, ...]
    order_data = Column(String(5000), nullable=False)  # JSON formatted array
    
    # Whether this was manually set by league manager
    is_manual = Column(Boolean, default=False)
    
    # Track changes for notifications
    last_modified_by = Column(Integer, ForeignKey("users.id"))
    last_modified_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    league = relationship("League", back_populates="draft_orders")
    race = relationship("Race")
    last_modifier = relationship("User", foreign_keys=[last_modified_by])
    
    # Unique constraint: one draft order per league per race
    __table_args__ = (
        Index('idx_league_race_draft', 'league_id', 'race_id', unique=True),
    )
    
    def __repr__(self):
        return f"<DraftOrder(league_id={self.league_id}, race_id={self.race_id}, method='{self.method}', strategy='{self.order_strategy}')>"
    
    def get_user_ids(self) -> list[int]:
        """Parse order_data JSON to get list of user IDs."""
        import json
        return json.loads(self.order_data)
    
    def set_user_ids(self, user_ids: list[int]) -> None:
        """Convert list of user IDs to JSON for order_data."""
        import json
        self.order_data = json.dumps(user_ids)
```

### League Model (Updated with Manager)

```python
# app/models/league.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class LeagueStatus(str, enum.Enum):
    """League lifecycle status."""
    DRAFTING = "drafting"  # Pre-season, teams being formed
    ACTIVE = "active"  # Season in progress
    COMPLETED = "completed"  # Season finished
    CANCELLED = "cancelled"  # League cancelled


class DraftMethod(str):
    """Draft methods for league settings."""
    SEQUENTIAL = "sequential"
    SNAKE = "snake"


class DraftOrderStrategy(str):
    """Draft order strategies for league settings."""
    ROTATION = "rotation"  # Last to draft becomes first in next race (MVP default)
    REVERSE_STANDINGS = "reverse_standings"  # Bottom constructors pick first
    RANDOM = "random"  # Randomized each race
    MANUAL = "manual"  # League manager sets the order manually


class ScoringStrategy(str):
    """Scoring strategy options for league settings."""
    INVERTED_POSITION = "inverted_position"  # MVP default: 10th=10pts, 9th/11th=9pts, etc.
    STANDARD_F1 = "standard_f1"  # Official F1 points system (1st=25pts, 2nd=18pts, etc.)
    CUSTOM = "custom"  # League manager sets custom scoring rules


class League(Base):
    """League model for fantasy leagues with season progress tracking."""
    
    __tablename__ = "leagues"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    
    # League manager (has full privileges)
    manager_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # League lifecycle status
    status = Column(SQLEnum(LeagueStatus), default=LeagueStatus.DRAFTING)
    
    # League settings
    code = Column(String(10), unique=True, nullable=False, index=True)  # Invite code
    max_players = Column(Integer, default=20)  # Max constructors in league
    is_private = Column(Boolean, default=True)
    
    # Season progress tracking
    current_race_id = Column(Integer, ForeignKey("races.id"))  # The race currently being drafted/competed
    total_races = Column(Integer, default=23)  # Total number of races in season
    
    # Draft settings
    draft_method = Column(String(20), default="sequential")  # "sequential" or "snake"
    draft_order_strategy = Column(String(30), default="rotation")  # Draft order strategy
    allow_draft_change = Column(Boolean, default=True)  # Allow manual draft order changes
    
    # Scoring settings
    scoring_strategy = Column(String(30), default="inverted_position")  # Scoring strategy
    
    # Notification settings
    notify_on_draft_change = Column(Boolean, default=True)  # Alert all members on draft order changes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    season_started_at = Column(DateTime(timezone=True))  # When first race began
    season_ended_at = Column(DateTime(timezone=True))  # When last race completed
    
    # Relationships
    manager = relationship("User", back_populates="managed_leagues", foreign_keys=[manager_id])
    constructors = relationship("Constructor", back_populates="league", cascade="all, delete-orphan")
    draft_orders = relationship("DraftOrder", back_populates="league", cascade="all, delete-orphan")
    members = relationship("LeagueMember", back_populates="league", cascade="all, delete-orphan")
    invites = relationship("LeagueInvite", back_populates="league", cascade="all, delete-orphan")
    current_race = relationship("Race", foreign_keys=[current_race_id])
    
    def __repr__(self):
        return f"<League(id={self.id}, name='{self.name}', code='{self.code}', status='{self.status}')>"
    
    def get_current_race_number(self) -> int:
        """Get the current race number in the season (1-indexed)."""
        if self.current_race_id:
            # Query the round_number from the current race
            # This would be implemented as a property method querying the Race model
            pass
        return 0
    
    def get_progress_percentage(self) -> float:
        """Calculate season progress as percentage."""
        if not self.current_race_id or self.total_races == 0:
            return 0.0
        current_round = self.get_current_race_number()
        return (current_round / self.total_races) * 100
    
    def is_race_current(self, race_id: int) -> bool:
        """Check if a given race is the current race for this league."""
        return self.current_race_id == race_id
```

### Driver Model

```python
# app/models/driver.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class DriverStatus(str, enum.Enum):
    """Driver status."""
    ACTIVE = "active"
    RETIRED = "retired"
    RESERVE = "reserve"


class Driver(Base):
    """Driver model for F1 drivers."""
    
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    team_name = Column(String(100), nullable=False, index=True)  # Real F1 team name (e.g., "Red Bull")
    number = Column(Integer, nullable=False, unique=True)
    country = Column(String(50))
    date_of_birth = Column(DateTime(timezone=True))
    
    # Fantasy-related fields
    price = Column(Float, nullable=False)  # Price in millions (for future features)
    total_points = Column(Float, default=0.0)
    average_points = Column(Float, default=0.0)
    
    # Status and metadata
    status = Column(SQLEnum(DriverStatus), default=DriverStatus.ACTIVE)
    championships = Column(Integer, default=0)
    wins = Column(Integer, default=0)
    podiums = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    driver_drafts = relationship("DriverDraft", back_populates="driver", cascade="all, delete-orphan")
    race_results = relationship("RaceResult", back_populates="driver", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Driver(id={self.id}, name='{self.name}', number={self.number})>"
```

### Race Model

```python
# app/models/race.py
from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class RaceStatus(str, enum.Enum):
    """Race statuses."""
    UPCOMING = "upcoming"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Race(Base):
    """Race model for F1 races."""
    
    __tablename__ = "races"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    circuit_name = Column(String(200), nullable=False)
    country = Column(String(100), nullable=False)
    city = Column(String(100))
    
    # Race details
    round_number = Column(Integer, nullable=False)
    race_date = Column(DateTime(timezone=True), nullable=False)
    qualifying_date = Column(DateTime(timezone=True))
    laps = Column(Integer)
    
    # Status
    status = Column(SQLEnum(RaceStatus), default=RaceStatus.UPCOMING)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    race_results = relationship("RaceResult", back_populates="race", cascade="all, delete-orphan")
    driver_drafts = relationship("DriverDraft", cascade="all, delete-orphan")
    draft_orders = relationship("DraftOrder", cascade="all, delete-orphan")
    weekly_summaries = relationship("ConstructorWeeklySummary", back_populates="race", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Race(id={self.id}, name='{self.name}', round={self.round_number})>"
```

### RaceResult Model

```python
# app/models/race.py (continued)
from sqlalchemy import Column, Integer, Float, Boolean
from sqlalchemy.orm import relationship


class RaceResult(Base):
    """RaceResult model for driver results in a race."""
    
    __tablename__ = "race_results"
    
    id = Column(Integer, primary_key=True, index=True)
    race_id = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(Integer, ForeignKey("drivers.id", ondelete="CASCADE"), nullable=False)
    
    # Results
    position = Column(Integer)  # 1-20, or None for DNF
    grid_position = Column(Integer)
    laps_completed = Column(Integer)
    
    # Scoring
    points_earned = Column(Float, default=0.0)
    
    # Additional info
    fastest_lap = Column(Boolean, default=False)
    fastest_lap_time = Column(String(20))  # Format: "1:23.456"
    time_delta = Column(String(20))  # Time delta to winner
    
    # DNF/DNS info
    dnf = Column(Boolean, default=False)
    dnf_reason = Column(String(100))  # "accident", "mechanical", "disqualified", etc.
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    race = relationship("Race", back_populates="race_results")
    driver = relationship("Driver", back_populates="race_results")
    
    def __repr__(self):
        return f"<RaceResult(race_id={self.race_id}, driver_id={self.driver_id}, position={self.position})>"
```

### Notification Model

```python
# app/models/notification.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class NotificationType(str, enum.Enum):
    """Notification types."""
    LEAGUE_INVITE = "league_invite"
    RACE_STARTED = "race_started"
    RACE_FINISHED = "race_finished"
    SCORE_UPDATED = "score_updated"
    DRAFT_ORDER_CHANGED = "draft_order_changed"  # NEW
    LEAGUE_UPDATE = "league_update"
    SYSTEM = "system"


class Notification(Base):
    """Notification model for user notifications."""
    
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Notification content
    type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Notification status
    is_read = Column(Boolean, default=False)
    
    # Optional link/redirect
    link = Column(String(500))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.type}', read={self.is_read})>"
```

### LeagueMember Model (NEW)

```python
# app/models/league_member.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class LeagueMemberRole(str, enum.Enum):
    """League member roles."""
    MEMBER = "member"  # Regular league member
    CO_MANAGER = "co_manager"  # Co-manager with limited privileges
    MANAGER = "manager"  # Full privileges (league creator)


class LeagueMember(Base):
    """LeagueMember model for tracking user participation in leagues with roles."""
    
    __tablename__ = "league_members"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Links to user and league
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    league_id = Column(Integer, ForeignKey("leagues.id", ondelete="CASCADE"), nullable=False)
    
    # Member role
    role = Column(SQLEnum(LeagueMemberRole), default=LeagueMemberRole.MEMBER, nullable=False)
    
    # When the user joined the league
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Who invited this user (optional - null if user was the creator)
    invited_by = Column(Integer, ForeignKey("users.id"))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="league_memberships", foreign_keys=[user_id])
    league = relationship("League", back_populates="members")
    inviter = relationship("User", foreign_keys=[invited_by])
    
    # Unique constraint: one membership per user per league
    __table_args__ = (
        Index('idx_league_member_user_league', 'user_id', 'league_id', unique=True),
        Index('idx_league_member_league', 'league_id'),
    )
    
    def __repr__(self):
        return f"<LeagueMember(user_id={self.user_id}, league_id={self.league_id}, role='{self.role}')>"
```

### LeagueInvite Model (NEW)

```python
# app/models/league_invite.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base
import enum


class LeagueInviteStatus(str, enum.Enum):
    """League invite status."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    EXPIRED = "expired"


class LeagueInviteRole(str, enum.Enum):
    """League invite roles."""
    MEMBER = "member"  # Invite as regular member
    CO_MANAGER = "co_manager"  # Invite as co-manager


class LeagueInvite(Base):
    """LeagueInvite model for managing email-based league invitations."""
    
    __tablename__ = "league_invites"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Links to league
    league_id = Column(Integer, ForeignKey("leagues.id", ondelete="CASCADE"), nullable=False)
    
    # Email to invite
    email = Column(String(100), nullable=False, index=True)
    
    # Unique invite token
    token = Column(String(255), unique=True, nullable=False, index=True)
    
    # Role to assign when accepted
    role = Column(SQLEnum(LeagueInviteRole), default=LeagueInviteRole.MEMBER, nullable=False)
    
    # Invite status
    status = Column(SQLEnum(LeagueInviteStatus), default=LeagueInviteStatus.PENDING, nullable=False)
    
    # Who created this invite
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # When this user accepted the invite
    accepted_by = Column(Integer, ForeignKey("users.id"))
    accepted_at = Column(DateTime(timezone=True))
    
    # Token expiration (default: 7 days)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    league = relationship("League", back_populates="invites")
    creator = relationship("User", back_populates="sent_invites", foreign_keys=[created_by])
    acceptor = relationship("User", foreign_keys=[accepted_by])
    
    # Unique constraint: one pending invite per email per league
    __table_args__ = (
        Index('idx_league_invite_email_league', 'email', 'league_id', unique=True),
    )
    
    def is_expired(self) -> bool:
        """Check if the invite has expired."""
        return func.now() > self.expires_at
    
    def __repr__(self):
        return f"<LeagueInvite(id={self.id}, email='{self.email}', status='{self.status}')>"
```

### PasswordReset Model (NEW)

```python
# app/models/password_reset.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class PasswordReset(Base):
    """PasswordReset model for managing password reset requests."""
    
    __tablename__ = "password_resets"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Link to user
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Unique reset token
    token = Column(String(255), unique=True, nullable=False, index=True)
    
    # When this token expires (default: 1 hour)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # When the password was actually reset using this token
    used_at = Column(DateTime(timezone=True))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="password_resets")
    
    # Index for quick lookups
    __table_args__ = (
        Index('idx_password_reset_token', 'token'),
        Index('idx_password_reset_user', 'user_id'),
    )
    
    def is_expired(self) -> bool:
        """Check if the reset token has expired."""
        return func.now() > self.expires_at
    
    def is_used(self) -> bool:
        """Check if the reset token has already been used."""
        return self.used_at is not None
    
    def __repr__(self):
        return f"<PasswordReset(id={self.id}, user_id={self.user_id})>"
```

### ConstructorWeeklySummary Model (NEW)

```python
# app/models/constructor_weekly_summary.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class ConstructorWeeklySummary(Base):
    """ConstructorWeeklySummary model for AI-generated weekly team performance summaries.
    
    Generated post-race for each constructor, providing humorous narrative analysis of
    their performance, draft picks, and overall race execution using generative AI.
    """
    
    __tablename__ = "constructor_weekly_summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Links to constructor and race
    constructor_id = Column(Integer, ForeignKey("constructors.id", ondelete="CASCADE"), nullable=False)
    race_id = Column(Integer, ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    
    # AI-generated summary text (humorous narrative about team's week)
    summary_text = Column(Text, nullable=False)
    
    # Performance context for AI generation
    points_earned = Column(Float, default=0.0)  # Total points earned this race
    rank_this_week = Column(Integer)  # Constructor's rank for this specific race
    
    # Metadata about the summary generation
    generation_model = Column(String(100))  # e.g., "gpt-4", "claude-3-opus"
    generation_version = Column(String(50))  # Model version
    
    # Timestamps
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    constructor = relationship("Constructor")
    race = relationship("Race")
    
    # Unique constraint: one summary per constructor per race
    __table_args__ = (
        Index('idx_constructor_race_summary', 'constructor_id', 'race_id', unique=True),
    )
    
    def __repr__(self):
        return f"<ConstructorWeeklySummary(const_id={self.constructor_id}, race_id={self.race_id})>"
```

---

## Database Indexes

### User Indexes

```python
# app/models/user.py

# Primary key and unique indexes are automatically created
# Additional indexes for performance:
Index('idx_user_username', 'username', unique=True)
Index('idx_user_email', 'email', unique=True)
Index('idx_user_created_at', 'created_at')
```

### Driver Indexes

```python
# app/models/driver.py

Index('idx_driver_name', 'name')
Index('idx_driver_team', 'team_name')
Index('idx_driver_status', 'status')
Index('idx_driver_total_points', 'total_points')
```

### Race Indexes

```python
# app/models/race.py

Index('idx_race_date', 'race_date')
Index('idx_race_status', 'status')
Index('idx_race_country', 'country')
```

### RaceResult Indexes

```python
# app/models/race.py

# Composite index for race+driver lookup
Index('idx_race_result_race_driver', 'race_id', 'driver_id', unique=True)
Index('idx_race_result_position', 'race_id', 'position')
```

### League Indexes

```python
# app/models/league.py

Index('idx_league_code', 'code', unique=True)
Index('idx_league_name', 'name')
Index('idx_league_manager', 'manager_id')
```

### LeagueMember Indexes

```python
# app/models/league_member.py

# Composite index for user+league lookup (unique)
Index('idx_league_member_user_league', 'user_id', 'league_id', unique=True)
Index('idx_league_member_league', 'league_id')
```

### LeagueInvite Indexes

```python
# app/models/league_invite.py

# Composite index for email+league lookup (unique for pending invites)
Index('idx_league_invite_email_league', 'email', 'league_id', unique=True)
Index('idx_league_invite_token', 'token')
```

### PasswordReset Indexes

```python
# app/models/password_reset.py

Index('idx_password_reset_token', 'token')
Index('idx_password_reset_user', 'user_id')
```

### Constructor Indexes

```python
# app/models/constructor.py

# Composite index for user+league lookup
Index('idx_constructor_user_league', 'user_id', 'league_id', unique=True)
Index('idx_constructor_points', 'total_points')
```

### DriverDraft Indexes

```python
# app/models/driver_draft.py

# Composite index for constructor+race lookup
Index('idx_constructor_race', 'constructor_id', 'race_id')
Index('idx_driver_race', 'driver_id', 'race_id')
# Unique constraint to prevent duplicate drivers in same race for same constructor
Index('idx_constructor_race_driver', 'constructor_id', 'race_id', 'driver_id', unique=True)
```

### DraftOrder Indexes

```python
# app/models/draft_order.py

Index('idx_league_race_draft', 'league_id', 'race_id', unique=True)
Index('idx_draft_races', 'race_id')
```

### ConstructorWeeklySummary Indexes

```python
# app/models/constructor_weekly_summary.py

# Composite index for constructor+race lookup (unique)
Index('idx_constructor_race_summary', 'constructor_id', 'race_id', unique=True)
```

### Notification Indexes

```python
# app/models/notification.py

Index('idx_notification_user', 'user_id')
# Composite index for unread notifications
Index('idx_notification_read', 'user_id', 'is_read')
```

---

## Database Relationships

### Many-to-Many Relationships

**User ↔ League** (via Constructor)

```python
# User is in multiple leagues as constructors
user.constructors  # Returns list of Constructor objects

# League has multiple constructors
league.constructors  # Returns list of Constructor objects

# Access league from user
for constructor in user.constructors:
    league = constructor.league
    team_name = constructor.team_name
```

### One-to-Many Relationships

**Constructor → DriverDraft**
```python
# One constructor has multiple driver drafts (one per race)
constructor.driver_drafts  # Returns list of DriverDraft objects

# Access drafts for a specific race
driver_drafts = [d for d in constructor.driver_drafts if d.race_id == race_id]
```

**Race → DriverDraft**
```python
# One race has multiple driver drafts (picks by all constructors)
race.driver_drafts  # Returns list of DriverDraft objects
```

**League → DraftOrder**
```python
# One league has draft orders for each race
league.draft_orders  # Returns list of DraftOrder objects
```

**Race → DraftOrder**
```python
# One race has draft orders for each league
race.draft_orders  # Returns list of DraftOrder objects
```

**Race → RaceResults**
```python
# One race can have multiple results
race.race_results  # Returns list of RaceResult objects
```

**User → Notifications**
```python
# One user can have multiple notifications
user.notifications  # Returns list of Notification objects
```

### Foreign Key Relationships

**Constructor → User**
```python
constructor.user  # Returns the User who owns the constructor
```

**Constructor → League**
```python
constructor.league  # Returns the League the constructor belongs to
```

**League → User (manager)**
```python
league.manager  # Returns the User who manages the league
```

**LeagueMember → User**
```python
league_member.user  # Returns the User who is a member
```

**LeagueMember → League**
```python
league_member.league  # Returns the League the user belongs to
```

**LeagueInvite → League**
```python
league_invite.league  # Returns the League being invited to
```

**LeagueInvite → User (creator)**
```python
league_invite.creator  # Returns the User who created the invite
```

**PasswordReset → User**
```python
password_reset.user  # Returns the User who requested the reset
```

**DriverDraft → Driver**
```python
driver_draft.driver  # Returns the Driver that was drafted
```

**RaceResult → Race**
```python
race_result.race  # Returns the Race object
```

**RaceResult → Driver**
```python
race_result.driver  # Returns the Driver object
```

---

## Database Constraints

### Unique Constraints

```python
# User uniqueness
Column("username", unique=True)
Column("email", unique=True)

# Driver uniqueness
Column("number", unique=True)

# League uniqueness
Column("code", unique=True)

# Constructor uniqueness (one constructor per user per league)
Index('idx_constructor_user_league', 'user_id', 'league_id', unique=True)

# DriverDraft uniqueness (prevent duplicate drivers in same race for same constructor)
Index('idx_constructor_race_driver', 'constructor_id', 'race_id', 'driver_id', unique=True)

# DraftOrder uniqueness (one draft order per league per race)
Index('idx_league_race_draft', 'league_id', 'race_id', unique=True)

# RaceResult uniqueness (one result per driver per race)
Index('idx_race_result_race_driver', 'race_id', 'driver_id', unique=True)

# LeagueMember uniqueness (one membership per user per league)
Index('idx_league_member_user_league', 'user_id', 'league_id', unique=True)

# LeagueInvite uniqueness (one pending invite per email per league)
Index('idx_league_invite_email_league', 'email', 'league_id', unique=True)

# PasswordReset token uniqueness
Column("token", unique=True)
```

### Not Null Constraints

Required fields (cannot be null):
- User: username, email, hashed_password
- Driver: name, team_name, number, price, status
- Race: name, circuit_name, country, round_number, race_date, status
- League: name, creator_id, code
- Constructor: user_id, league_id, team_name, is_active
- DriverDraft: constructor_id, race_id, driver_id, pick_number
- DraftOrder: league_id, race_id, method, order_data
- Notification: user_id, type, title, message
- RaceResult: race_id, driver_id

### Default Values

```python
# Boolean defaults
Column("is_active", Boolean, default=True)
Column("is_private", Boolean, default=True)
Column("is_read", Boolean, default=False)
Column("fastest_lap", Boolean, default=False)
Column("dnf", Boolean, default=False)
Column("allow_draft_change", Boolean, default=True)
Column("notify_on_draft_change", Boolean, default=True)

# Numeric defaults
Column("total_points", Float, default=0.0)
Column("average_points", Float, default=0.0)
Column("points_earned", Float, default=0.0)
Column("rank", Integer)

# Enum defaults
Column("role", SQLEnum(UserRole), default=UserRole.USER)
Column("status", SQLEnum(DriverStatus), default=DriverStatus.ACTIVE)
Column("status", SQLEnum(RaceStatus), default=RaceStatus.UPCOMING)

# String defaults
Column("draft_method", String(20), default="sequential")
```

### Cascade Deletes

```python
# If user is deleted, delete their constructors and notifications
relationship("Constructor", cascade="all, delete-orphan")
relationship("Notification", cascade="all, delete-orphan")

# If constructor is deleted, remove driver draft picks
relationship("DriverDraft", cascade="all, delete-orphan")

# If league is deleted, remove constructors and draft orders
relationship("Constructor", cascade="all, delete-orphan")
relationship("DraftOrder", cascade="all, delete-orphan")

# If driver is deleted, remove race results and driver draft picks
relationship("RaceResult", cascade="all, delete-orphan")
relationship("DriverDraft", cascade="all, delete-orphan")

# If race is deleted, remove all results, drafts, and draft orders
relationship("RaceResult", cascade="all, delete-orphan")
relationship("DriverDraft", cascade="all, delete-orphan")
relationship("DraftOrder", cascade="all, delete-orphan")
```

---

## Database Migrations

### Creating Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "Add Constructor and DriverDraft models"

# Create empty migration for custom SQL
alembic revision -m "Custom SQL migration"
```

### Running Migrations

```bash
# Upgrade to latest version
alembic upgrade head

# Upgrade to specific version
alembic upgrade +1

# Downgrade one version
alembic downgrade -1

# Downgrade to base (empty database)
alembic downgrade base
```

### Migration Example

```python
# alembic/versions/002_add_fantasy_models.py

def upgrade():
    # Create constructors table (replace teams table)
    op.create_table(
        'constructors',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('league_id', sa.Integer(), sa.ForeignKey('leagues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('team_name', sa.String(100), nullable=False),
        sa.Column('total_points', sa.Float(), default=0.0),
        sa.Column('rank', sa.Integer()),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=func.now()),
        sa.Index('idx_constructor_user_league', 'user_id', 'league_id', unique=True),
        sa.Index('idx_constructor_points', 'total_points')
    )
    
    # Create driver_drafts table
    op.create_table(
        'driver_drafts',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('constructor_id', sa.Integer(), sa.ForeignKey('constructors.id', ondelete='CASCADE'), nullable=False),
        sa.Column('race_id', sa.Integer(), sa.ForeignKey('races.id', ondelete='CASCADE'), nullable=False),
        sa.Column('driver_id', sa.Integer(), sa.ForeignKey('drivers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('pick_number', sa.Integer(), nullable=False),
        sa.Column('points_earned', sa.Float(), default=0.0),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=func.now()),
        sa.Index('idx_constructor_race', 'constructor_id', 'race_id'),
        sa.Index('idx_driver_race', 'driver_id', 'race_id'),
        sa.Index('idx_constructor_race_driver', 'constructor_id', 'race_id', 'driver_id', unique=True)
    )
    
    # Create draft_orders table
    op.create_table(
        'draft_orders',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('league_id', sa.Integer(), sa.ForeignKey('leagues.id', ondelete='CASCADE'), nullable=False),
        sa.Column('race_id', sa.Integer(), sa.ForeignKey('races.id', ondelete='CASCADE'), nullable=False),
        sa.Column('method', sa.String(20), nullable=False, default='sequential'),
        sa.Column('order_data', sa.String(5000), nullable=False),
        sa.Column('is_manual', sa.Boolean(), default=False),
        sa.Column('last_modified_by', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('last_modified_at', sa.DateTime(timezone=True), onupdate=func.now()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=func.now()),
        sa.Index('idx_league_race_draft', 'league_id', 'race_id', unique=True),
        sa.Index('idx_draft_races', 'race_id')
    )
    
    # Update league table with draft settings
    op.alter_column('leagues', 'max_teams', new_column_name='max_players')
    op.add_column('leagues', sa.Column('draft_method', sa.String(20), default='sequential'))
    op.add_column('leagues', sa.Column('allow_draft_change', sa.Boolean(), default=True))
    op.add_column('leagues', sa.Column('notify_on_draft_change', sa.Boolean(), default=True))

def downgrade():
    op.drop_index('idx_notification_read', 'notifications')
    op.drop_index('idx_notification_user', 'notifications')
    op.drop_table('notifications')
    
    op.drop_index('idx_draft_races', 'draft_orders')
    op.drop_index('idx_league_race_draft', 'draft_orders')
    op.drop_table('draft_orders')
    
    op.drop_index('idx_constructor_race_driver', 'driver_drafts')
    op.drop_index('idx_driver_race', 'driver_drafts')
    op.drop_index('idx_constructor_race', 'driver_drafts')
    op.drop_table('driver_drafts')
    
    op.drop_index('idx_constructor_points', 'constructors')
    op.drop_index('idx_constructor_user_league', 'constructors')
    op.drop_table('constructors')
```

---

## Data Model Summary Table

| Model | Purpose | Key Relationships | MVP Critical |
|-------|---------|------------------|--------------|
| **User** | Authentication & Profile | ↔ Constructor, League (manager), Notification, LeagueMember, LeagueInvite, PasswordReset | Yes |
| **Constructor** | User's team in league (NEW) | N:1 User, N:1 League, 1:N DriverDraft, 1:N ConstructorWeeklySummary | Yes |
| **DriverDraft** | Weekly driver picks (NEW) | N:1 Constructor, N:1 Race, N:1 Driver | Yes |
| **DraftOrder** | Draft order per race (NEW) | N:1 League, N:1 Race | Yes |
| **League** | Fantasy league with season progress | 1:N Constructor, 1:N DraftOrder, 1:N LeagueMember, 1:N LeagueInvite, N:1 Race (current) | Yes |
| **Driver** | F1 driver data | 1:N DriverDraft, 1:N RaceResult | Yes |
| **Race** | F1 race data | 1:N RaceResult, 1:N DriverDraft, 1:N DraftOrder, 1:N ConstructorWeeklySummary | Yes |
| **RaceResult** | Official race results | N:1 Race, N:1 Driver | Yes |
| **Notification** | User notifications | N:1 User | Yes |
| **LeagueMember** | User-Role-League mapping | N:1 User, N:1 League, tracks role & join history | Yes |
| **LeagueInvite** | Email-based invitations | N:1 League, N:1 User (creator), N:1 User (acceptor) | Yes |
| **PasswordReset** | Password reset tokens | N:1 User | Yes |
| **ConstructorWeeklySummary** (NEW) | AI-generated constructor summaries | N:1 Constructor, N:1 Race | Yes |

---

## Summary of Changes for Constructor Model Requirements

### Overview
The data models have been updated to fully support the constructor-based fantasy F1 system where:
- Users join leagues and become Constructors (teams)
- Each Constructor is unique per league and per user
- Constructors draft 2 drivers each race week
- League season progress is tracked
- AI-generated weekly summaries are available for each constructor

### New Models Added

**1. ConstructorWeeklySummary Model**
- Purpose: Stores AI-generated weekly performance summaries for each constructor per race
- Key fields:
  - `constructor_id`, `race_id` (foreign keys)
  - `summary_text` (AI-generated humorous narrative)
  - `points_earned`, `rank_this_week` (performance context)
  - `generation_model`, `generation_version` (model metadata)
  - Timestamps for tracking when summaries were generated
- Unique constraint: One summary per constructor per race
- Relationships: Links to Constructor and Race models

### Model Updates Made

**1. League Model Enhancements**
- Added `LeagueStatus` enum (DRAFTING, ACTIVE, COMPLETED, CANCELLED)
- Added `status` field to track league lifecycle
- Added `current_race_id` to track which race is currently active
- Added `total_races` to define season length (default: 23)
- Added `season_started_at` timestamp
- Added `season_ended_at` timestamp
- Added helper methods:
  - `get_current_race_number()` - Returns current race round number
  - `get_progress_percentage()` - Calculates season progress
  - `is_race_current(race_id)` - Checks if a race is current
- Added relationship to `current_race` (Race model)

**2. Constructor Model Updates**
- Added `weekly_summaries` relationship to ConstructorWeeklySummary
- Enables retrieval of all AI summaries for a constructor across races

**3. Race Model Updates**
- Added `weekly_summaries` relationship to ConstructorWeeklySummary
- Enables retrieval of all AI summaries for a specific race

**4. ERD Diagram Updates**
- Added ConstructorWeeklySummary table diagram
- Updated League model to show new fields (status, current_race, total_races)
- Added relationship from Race to ConstructorWeeklySummary (1:N)

### Key Capabilities Enabled

**1. Multi-League Constructor Support**
✅ Users can join multiple leagues, creating separate Constructor entities for each
✅ Each Constructor has a unique team name per league
✅ Constructor data is isolated between leagues (user_id + league_id unique constraint)

**2. Weekly Drafting System**
✅ Constructor model tracks 2 driver picks per race via DriverDraft model
✅ Pick order is tracked via pick_number field
✅ Points earned per driver per race are tracked in points_earned
✅ Constructor totals are maintained in total_points

**3. League Season Progress Tracking**
✅ League status tracks lifecycle (drafting → active → completed)
✅ current_race_id identifies the active race
✅ total_races defines season length
✅ Season start/end timestamps are recorded
✅ Progress percentage can be calculated

**4. Full Draft Visibility**
✅ All users can see which Constructor drafted which Driver
✅ Draft order (pick_number) is visible for each selection
✅ Points earned per driver per race is tracked
✅ Draft order strategy is configurable (rotation, reverse_standings, random, manual)

**5. AI-Generated Weekly Summaries**
✅ ConstructorWeeklySummary model stores AI-generated humorous summaries per constructor per race
✅ Model tracks which AI model and version generated the summary
✅ Timestamps track when summaries were last generated
✅ Unique constraint prevents duplicate summaries per constructor per race

### Database Constraints Summary

**Uniqueness Guarantees:**
- One Constructor per user per league
- One ConstructorWeeklySummary per constructor per race
- One DraftOrder per league per race
- One RaceResult per driver per race
- No duplicate driver picks for same constructor in same race

**Data Integrity:**
- All foreign keys use CASCADE delete for automatic cleanup
- Proper indexes for query performance
- Enum constraints for status fields

### Query Examples

**Get a user's constructor in a specific league:**
```python
constructor = db.query(Constructor).filter_by(
    user_id=user_id, 
    league_id=league_id
).first()
```

**Get all drivers drafted by a constructor for a race:**
```python
drafts = db.query(DriverDraft).filter_by(
    constructor_id=constructor_id,
    race_id=race_id
).order_by(DriverDraft.pick_number).all()
```

**Get current race for a league:**
```python
league = db.query(League).get(league_id)
current_race = league.current_race
progress = league.get_progress_percentage()
```

**Get AI summary for a constructor's performance in a race:**
```python
summary = db.query(ConstructorWeeklySummary).filter_by(
    constructor_id=constructor_id,
    race_id=race_id
).first()
```

**Get draft order for a league's race:**
```python
draft_order = db.query(DraftOrder).filter_by(
    league_id=league_id,
    race_id=race_id
).first()
user_order = draft_order.get_user_ids()
```

### Migration Requirements

To implement these changes, the following migrations are needed:
1. Create `constructor_weekly_summaries` table
2. Add league status, current_race_id, total_races, season_started_at, season_ended_at columns
3. Update indexes and constraints
4. Add helper methods to League model

---

## Related Documentation

- [Architecture Overview](architecture.md) - System architecture and data layer
- [Business Logic](business_logic.md) - Services that use these models (DraftService, ConstructorService)
- [API Endpoints](api_endpoints.md) - How models are exposed via API
- [Technology Stack](technology_stack.md) - Database technology details
