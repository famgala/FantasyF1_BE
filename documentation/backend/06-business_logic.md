# Business Logic & Services

This document describes the service layer implementation for the Fantasy F1 Backend system, including business logic separation, service patterns, and key service implementations.

---

## Service Layer Architecture

### Overview

The service layer sits between the API endpoints and the data models, containing all business logic and application rules.

```
API Endpoints
    ↓
Feasibility Checks
    ↓
Service Layer
    ↓
Business Rules
    ↓
Data Access (Models)
    ↓
Database
```

### MVP Services

**Critical for Weekly Drafting (MVP):**
- `DraftService` - Draft order rotation, sequential/snake drafting, pick management
- `ConstructorService` - User's constructor management per league (formerly TeamService)
- `ScoringService` - Points calculation from driver drafts to constructor totals

**Supporting Services:**
- `UserService` - User management operations
- `DriverService` - Driver operations (read-only for most users)
- `RaceService` - Race operations (read-only for most users)
- `LeagueService` - League management and draft settings
- `ExternalDataService` - F1 API integration for driver/race/result data

### Benefits of Service Layer

- **Separation of Concerns**: API endpoints handle HTTP, services handle business logic
- **Reusability**: Services can be used by multiple endpoints
- **Testability**: Services can be tested independently of API
- **Maintainability**: Business logic is centralized and easier to update

---

## Service Base Class

### BaseService

All services inherit from a common base class providing shared functionality.

```python
# app/services/base_service.py
from typing import Generic, TypeVar, Optional, List
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)

class BaseService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base service with common CRUD operations."""
    
    def __init__(self, model: type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db
    
    async def get(self, id: int) -> Optional[ModelType]:
        """Get a single record by ID."""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_multi(
        self,
        skip: int = 0,
        limit: int = 100,
        **filters
    ) -> List[ModelType]:
        """Get multiple records with optional filtering."""
        query = select(self.model)
        
        # Apply filters
        for key, value in filters.items():
            if hasattr(self.model, key):
                query = query.where(getattr(self.model, key) == value)
        
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def create(self, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        obj_in_data = obj_in.model_dump()
        db_obj = self.model(**obj_in_data)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
    
    async def update(
        self,
        db_obj: ModelType,
        obj_in: UpdateSchemaType
    ) -> ModelType:
        """Update an existing record."""
        obj_data = obj_in.model_dump(exclude_unset=True)
        for field, value in obj_data.items():
            setattr(db_obj, field, value)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
    
    async def delete(self, id: int) -> bool:
        """Delete a record by ID."""
        obj = await self.get(id)
        if obj:
            await self.db.delete(obj)
            await self.db.commit()
            return True
        return False
```

---

## UserService

### Implementation

```python
# app/services/user_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import Optional
from app.models.user import User
from app.services.base_service import BaseService

class UserService(BaseService[User, UserCreate, UserUpdate]):
    """Service for user operations."""
    
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username."""
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_teams_count(self, user_id: int) -> int:
        """Get count of user's teams."""
        from app.models.team import Team
        result = await self.db.execute(
            select(Team.id).where(Team.user_id == user_id)
        )
        return len(result.all())
    
    async def get_leagues_count(self, user_id: int) -> int:
        """Get count of leagues created by user."""
        from app.models.league import League
        result = await self.db.execute(
            select(League.id).where(League.creator_id == user_id)
        )
        return len(result.all())
    
    async def search(self, query: str, limit: int = 10) -> list[User]:
        """Search users by username or email."""
        result = await self.db.execute(
            select(User)
            .where(
                or_(
                    User.username.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%")
                )
            )
            .limit(limit)
        )
        return result.scalars().all()
```

---

## DraftService (NEW - MVP Critical)

### Overview

DraftService is the core service for managing weekly driver drafts. It handles:
- Generating initial random draft order
- Rotating draft order between races
- Supporting sequential and snake draft methods
- Recording driver draft picks (2 drivers per constructor per race)
- Managing draft order changes with notifications

### Implementation

```python
# app/services/draft_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional
import json
import random
from app.models.constructor import Constructor
from app.models.driver_draft import DriverDraft
from app.models.draft_order import DraftOrder
from app.models.league import League
from app.models.race import Race
from app.models.notification import Notification, NotificationType
from app.core.exceptions import ValidationError, BusinessLogicError

class DraftService:
    """Service for weekly driver draft management."""
    
    MAX_DRIVERS_PER_RACE = 2  # Each constructor picks 2 drivers per race
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_initial_draft_order(
        self,
        league_id: int
    ) -> DraftOrder:
        """Generate initial random draft order for first race of season."""
        # Get league
        league = await self.db.execute(
            select(League).where(League.id == league_id)
        )
        league = league.scalar_one_or_none()
        if not league:
            raise BusinessLogicError("League not found")
        
        # Get first race of season
        first_race = await self.db.execute(
            select(Race)
            .where(Race.round_number == 1)
            .order_by(Race.race_date.asc())
        )
        first_race = first_race.scalar_one_or_none()
        if not first_race:
            raise BusinessLogicError("No races found in season")
        
        # Get all constructors in league
        constructors = await self.db.execute(
            select(Constructor).where(Constructor.league_id == league_id)
        )
        constructors = constructors.scalars().all()
        
        if len(constructors) < 2:
            raise ValidationError("League must have at least 2 constructors for drafting")
        
        # Generate random order
        user_ids = [c.user_id for c in constructors]
        random.shuffle(user_ids)
        
        # Create DraftOrder
        draft_order = DraftOrder(
            league_id=league_id,
            race_id=first_race.id,
            method=league.draft_method,
            order_data=json.dumps(user_ids),
            is_manual=False
        )
        self.db.add(draft_order)
        await self.db.commit()
        await self.db.refresh(draft_order)
        
        return draft_order
    
    async def rotate_draft_order(
        self,
        league_id: int,
        previous_race_id: int
    ) -> DraftOrder:
        """Rotate draft order for next race based on previous race's last picker."""
        # Get previous draft order
        previous_draft = await self.db.execute(
            select(DraftOrder).where(
                and_(
                    DraftOrder.league_id == league_id,
                    DraftOrder.race_id == previous_race_id
                )
            )
        )
        previous_draft = previous_draft.scalar_one_or_none()
        if not previous_draft:
            raise BusinessLogicError("Previous draft order not found")
        
        # Get next race
        next_race = await self._get_next_race(previous_race_id)
        if not next_race:
            raise BusinessLogicError("No next race found")
        
        # Get league
        league = await self.db.execute(
            select(League).where(League.id == league_id)
        )
        league = league.scalar_one_or_none()
        
        # Rotate order: last picker becomes first
        user_ids = previous_draft.get_user_ids()
        rotated_user_ids = self._rotate_list(user_ids, 1)  # Rotate by 1 position
        
        # Create new DraftOrder
        draft_order = DraftOrder(
            league_id=league_id,
            race_id=next_race.id,
            method=league.draft_method,
            order_data=json.dumps(rotated_user_ids),
            is_manual=False
        )
        self.db.add(draft_order)
        await self.db.commit()
        await self.db.refresh(draft_order)
        
        return draft_order
    
    async def make_driver_pick(
        self,
        constructor_id: int,
        race_id: int,
        driver_id: int,
        pick_number: int
    ) -> DriverDraft:
        """Record a driver draft pick for a constructor in a race."""
        # Validate constructor
        constructor = await self.db.execute(
            select(Constructor).where(Constructor.id == constructor_id)
        )
        constructor = constructor.scalar_one_or_none()
        if not constructor:
            raise BusinessLogicError("Constructor not found")
        
        # Validate driver
        from app.models.driver import Driver
        driver = await self.db.execute(
            select(Driver).where(Driver.id == driver_id)
        )
        driver = driver.scalar_one_or_none()
        if not driver:
            raise ValidationError("Driver not found")
        
        # Check if constructor has already picked 2 drivers for this race
        existing_picks = await self.db.execute(
            select(DriverDraft).where(
                and_(
                    DriverDraft.constructor_id == constructor_id,
                    DriverDraft.race_id == race_id
                )
            )
        )
        existing_picks = existing_picks.scalars().all()
        
        if len(existing_picks) >= self.MAX_DRIVERS_PER_RACE:
            raise ValidationError(f"Constructor has already picked {self.MAX_DRIVERS_PER_RACE} drivers for this race")
        
        # Check if driver was already picked by another constructor for this race
        existing_driver_pick = await self.db.execute(
            select(DriverDraft).where(
                and_(
                    DriverDraft.race_id == race_id,
                    DriverDraft.driver_id == driver_id
                )
            )
        )
        if existing_driver_pick.scalar_one_or_none():
            raise ValidationError("Driver has already been picked for this race")
        
        # Validate pick order
        await self._validate_pick_order(constructor, race_id, pick_number)
        
        # Create DriverDraft
        driver_draft = DriverDraft(
            constructor_id=constructor_id,
            race_id=race_id,
            driver_id=driver_id,
            pick_number=pick_number
        )
        self.db.add(driver_draft)
        await self.db.commit()
        await self.db.refresh(driver_draft)
        
        return driver_draft
    
    async def get_draft_order(
        self,
        league_id: int,
        race_id: int
    ) -> Optional[DraftOrder]:
        """Get draft order for a league and race."""
        draft_order = await self.db.execute(
            select(DraftOrder).where(
                and_(
                    DraftOrder.league_id == league_id,
                    DraftOrder.race_id == race_id
                )
            )
        )
        return draft_order.scalar_one_or_none()
    
    async def get_constructor_drafts(
        self,
        constructor_id: int,
        race_id: int
    ) -> List[DriverDraft]:
        """Get a constructor's driver drafts for a specific race."""
        drafts = await self.db.execute(
            select(DriverDraft).where(
                and_(
                    DriverDraft.constructor_id == constructor_id,
                    DriverDraft.race_id == race_id
                )
            ).order_by(DriverDraft.pick_number)
        )
        return list(drafts.scalars().all())
    
    async def manually_set_draft_order(
        self,
        league_id: int,
        race_id: int,
        user_ids: List[int],
        modifier_id: int
    ) -> DraftOrder:
        """Manually set draft order (league manager only)."""
        # Get league
        league = await self.db.execute(
            select(League).where(League.id == league_id)
        )
        league = league.scalar_one_or_none()
        if not league:
            raise BusinessLogicError("League not found")
        
        if not league.allow_draft_change:
            raise ValidationError("League does not allow manual draft order changes")
        
        # Verify all user_ids are constructors in league
        constructors = await self.db.execute(
            select(Constructor).where(Constructor.league_id == league_id)
        )
        constructor_user_ids = {c.user_id for c in constructors.scalars().all()}
        
        if set(user_ids) != constructor_user_ids:
            raise ValidationError("Draft order must include all constructors in league")
        
        # Update or create DraftOrder
        existing_draft = await self.get_draft_order(league_id, race_id)
        
        if existing_draft:
            # Update existing
            existing_draft.order_data = json.dumps(user_ids)
            existing_draft.is_manual = True
            existing_draft.last_modified_by = modifier_id
            await self.db.commit()
            await self.db.refresh(existing_draft)
            draft_order = existing_draft
        else:
            # Create new
            draft_order = DraftOrder(
                league_id=league_id,
                race_id=race_id,
                method=league.draft_method,
                order_data=json.dumps(user_ids),
                is_manual=True,
                last_modified_by=modifier_id
            )
            self.db.add(draft_order)
            await self.db.commit()
            await self.db.refresh(draft_order)
        
        # Notify all league members if after first race
        if league.notify_on_draft_change:
            await self._notify_draft_order_change(league_id, race_id, modifier_id)
        
        return draft_order
    
    def _rotate_list(self, lst: List, positions: int) -> List:
        """Rotate list by specified positions."""
        if not lst:
            return lst
        positions = positions % len(lst)
        return lst[-positions:] + lst[:-positions]
    
    async def _get_next_race(self, current_race_id: int) -> Optional[Race]:
        """Get the next race after current race."""
        current_race = await self.db.execute(
            select(Race).where(Race.id == current_race_id)
        )
        current_race = current_race.scalar_one_or_none()
        if not current_race:
            return None
        
        next_race = await self.db.execute(
            select(Race)
            .where(
                and_(
                    Race.round_number == current_race.round_number + 1,
                    Race.season == current_race.season
                )
            )
        )
        return next_race.scalar_one_or_none()
    
    async def _validate_pick_order(
        self,
        constructor: Constructor,
        race_id: int,
        pick_number: int
    ) -> None:
        """Validate that the pick number matches the draft order."""
        draft_order = await self.get_draft_order(
            constructor.league_id,
            race_id
        )
        if not draft_order:
            raise ValidationError("Draft order not set for this race")
        
        # Get current draft order
        user_order = draft_order.get_user_ids()
        
        # Calculate expected pick number for this constructor
        # Based on previous picks (2 picks per constructor)
        from app.models.driver_draft import DriverDraft
        picks_made = await self.db.execute(
            select(func.count(DriverDraft.id))
            .where(DriverDraft.race_id == race_id)
        )
        picks_made = picks_made.scalar() or 0
        
        # Calculate which constructor should be picking now
        constructors_per_pick = self.MAX_DRIVERS_PER_RACE
        constructor_index = (picks_made // constructors_per_pick) % len(user_order)
        expected_user_id = user_order[constructor_index]
        
        if constructor.user_id != expected_user_id:
            raise ValidationError(
                f"It's not {constructor.user_id}'s turn to pick. "
                f"Expected user ID: {expected_user_id}"
            )
```

---

## ConstructorService (NEW - Replaces TeamService)

### Overview

ConstructorService manages a user's constructor (team) in a league. Key differences from fantasy football:
- No budget constraints
- No fixed roster of drivers
- Constructor is a season-long entity that accumulates points from weekly driver drafts
- Each user can have multiple constructors across different leagues
- Custom team name per league

### Implementation

```python
# app/services/constructor_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
import secrets
import string
from app.models.constructor import Constructor
from app.models.league import League
from app.models.driver_draft import DriverDraft
from app.services.base_service import BaseService
from app.core.exceptions import ValidationError, BusinessLogicError

class ConstructorService(BaseService[Constructor, ConstructorCreate, ConstructorUpdate]):
    """Service for constructor (user's team in league) operations."""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Constructor, db)
    
    async def create_constructor(
        self,
        constructor_data: ConstructorCreate,
        user_id: int
    ) -> Constructor:
        """Create a new constructor when user joins a league."""
        # Check if user already has a constructor in this league
        existing = await self.db.execute(
            select(Constructor).where(
                and_(
                    Constructor.user_id == user_id,
                    Constructor.league_id == constructor_data.league_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValidationError(
                "User already has a constructor in this league"
            )
        
        # Check league capacity
        league = await self.db.execute(
            select(League).where(League.id == constructor_data.league_id)
        )
        league = league.scalar_one_or_none()
        if not league:
            raise BusinessLogicError("League not found")
        
        constructor_count = await self.db.execute(
            select(Constructor).where(Constructor.league_id == constructor_data.league_id)
        )
        if len(constructor_count.all()) >= league.max_players:
            raise ValidationError("League is full")
        
        # Create constructor
        constructor = Constructor(
            user_id=user_id,
            league_id=constructor_data.league_id,
            team_name=constructor_data.team_name,
            is_active=True
        )
        self.db.add(constructor)
        await self.db.commit()
        await self.db.refresh(constructor)
        return constructor
    
    async def get_user_constructor_in_league(
        self,
        user_id: int,
        league_id: int
    ) -> Optional[Constructor]:
        """Get a user's constructor in a specific league."""
        result = await self.db.execute(
            select(Constructor).where(
                and_(
                    Constructor.user_id == user_id,
                    Constructor.league_id == league_id
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_user_constructors(
        self,
        user_id: int
    ) -> List[Constructor]:
        """Get all constructors for a user (across all leagues)."""
        result = await self.db.execute(
            select(Constructor).where(Constructor.user_id == user_id)
        )
        return result.scalars().all()
    
    async def get_league_constructors(
        self,
        league_id: int
    ) -> List[Constructor]:
        """Get all constructors in a league."""
        result = await self.db.execute(
            select(Constructor).where(Constructor.league_id == league_id)
        )
        return result.scalars().all()
    
    async def update_team_name(
        self,
        constructor_id: int,
        team_name: str
    ) -> Constructor:
        """Update constructor's team name."""
        constructor = await self.get(constructor_id)
        if not constructor:
            raise BusinessLogicError("Constructor not found")
        
        constructor.team_name = team_name
        await self.db.commit()
        await self.db.refresh(constructor)
        return constructor
    
    async def update_total_points(
        self,
        constructor_id: int
    ) -> float:
        """Recalculate and update constructor's total points from all drafts."""
        constructor = await self.get(constructor_id)
        if not constructor:
            raise BusinessLogicError("Constructor not found")
        
        # Sum points from all driver drafts
        result = await self.db.execute(
            select(func.sum(DriverDraft.points_earned))
            .where(DriverDraft.constructor_id == constructor_id)
        )
        total_points = result.scalar() or 0.0
        
        constructor.total_points = total_points
        await self.db.commit()
        
        return total_points
    
    async def get_constructor_points_for_race(
        self,
        constructor_id: int,
        race_id: int
    ) -> float:
        """Get points for a constructor in a specific race."""
        result = await self.db.execute(
            select(func.sum(DriverDraft.points_earned))
            .where(
                and_(
                    DriverDraft.constructor_id == constructor_id,
                    DriverDraft.race_id == race_id
                )
            )
        )
        total = result.scalar()
        return total if total else 0.0
```

---

## TeamService

### Implementation

```python
# app/services/team_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import Optional, List
from datetime import datetime
from app.models.team import Team, TeamDriver
from app.models.driver import Driver
from app.models.league import League
from app.models.user import User
from app.services.base_service import BaseService
from app.core.exceptions import ValidationError, BusinessLogicError

class TeamService(BaseService[Team, TeamCreate, TeamUpdate]):
    """Service for team operations."""
    
    BUDGET_LIMIT = 100.0  # 100 million
    MAX_DRIVERS_PER_TEAM = 5
    MAX_DRIVERS_FROM_SAME_TEAM = 2
    
    def __init__(self, db: AsyncSession):
        super().__init__(Team, db)
    
    async def create_team(
        self,
        team_data: TeamCreate,
        user_id: int
    ) -> Team:
        """Create a new team with validation."""
        # Check if user already has a team in this league
        existing = await self.db.execute(
            select(Team).where(
                and_(
                    Team.user_id == user_id,
                    Team.league_id == team_data.league_id
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValidationError(
                "User already has a team in this league"
            )
        
        # Validate drivers
        await self.validate_team_selection(
            team_data.driver_ids,
            team_data.captain_id
        )
        
        # Check league capacity
        league = await self.db.execute(
            select(League).where(League.id == team_data.league_id)
        )
        league = league.scalar_one_or_none()
        if not league:
            raise BusinessLogicError("League not found")
        
        team_count = await self.db.execute(
            select(Team).where(Team.league_id == team_data.league_id)
        )
        if len(team_count.all()) >= league.max_teams:
            raise ValidationError("League is full")
        
        # Create team
        team = Team(
            name=team_data.name,
            user_id=user_id,
            league_id=team_data.league_id,
            is_active=True
        )
        self.db.add(team)
        await self.db.flush()
        
        # Add drivers to team
        await self.add_team_drivers(
            team.id,
            team_data.driver_ids,
            team_data.captain_id
        )
        
        # Calculate initial budget
        team.budget_spent = await self.calculate_team_budget(team.id)
        
        await self.db.commit()
        await self.db.refresh(team)
        return team
    
    async def validate_team_selection(
        self,
        driver_ids: List[int],
        captain_id: int
    ) -> None:
        """Validate team driver selection."""
        # Check correct number of drivers
        if len(driver_ids) != self.MAX_DRIVERS_PER_TEAM:
            raise ValidationError(
                f"Must select exactly {self.MAX_DRIVERS_PER_TEAM} drivers"
            )
        
        # Check captain is in selection
        if captain_id not in driver_ids:
            raise ValidationError("Captain must be one of the selected drivers")
        
        # Get driver details
        result = await self.db.execute(
            select(Driver).where(Driver.id.in_(driver_ids))
        )
        drivers = result.scalars().all()
        
        if len(drivers) != len(driver_ids):
            raise ValidationError("One or more drivers not found")
        
        # Check budget
        total_cost = sum(driver.price for driver in drivers)
        if total_cost > self.BUDGET_LIMIT:
            raise ValidationError(
                f"Team cost {total_cost}M exceeds budget {self.BUDGET_LIMIT}M"
            )
        
        # Check max 2 drivers from same team
        team_counts = {}
        for driver in drivers:
            team_counts[driver.team_name] = team_counts.get(driver.team_name, 0) + 1
        
        duplicates = [
            team_name for team_name, count in team_counts.items()
            if count > self.MAX_DRIVERS_FROM_SAME_TEAM
        ]
        
        if duplicates:
            raise ValidationError(
                f"Cannot select more than {self.MAX_DRIVERS_FROM_SAME_TEAM} "
                f"drivers from the same team: {', '.join(duplicates)}"
            )
    
    async def add_team_drivers(
        self,
        team_id: int,
        driver_ids: List[int],
        captain_id: int
    ) -> None:
        """Add drivers to team."""
        for driver_id in driver_ids:
            team_driver = TeamDriver(
                team_id=team_id,
                driver_id=driver_id,
                is_captain=(driver_id == captain_id)
            )
            self.db.add(team_driver)
    
    async def calculate_team_budget(self, team_id: int) -> float:
        """Calculate total team cost."""
        result = await self.db.execute(
            select(Driver.price)
            .join(TeamDriver, Driver.id == TeamDriver.driver_id)
            .where(TeamDriver.team_id == team_id)
        )
        prices = result.scalars().all()
        return sum(prices)
    
    async def update_team_drivers(
        self,
        team_id: int,
        driver_ids: List[int],
        captain_id: int
    ) -> Team:
        """Update team driver selection."""
        team = await self.get(team_id)
        if not team:
            raise BusinessLogicError("Team not found")
        
        # Validate new selection
        await self.validate_team_selection(driver_ids, captain_id)
        
        # Remove existing drivers
        await self.db.execute(
            select(TeamDriver).where(TeamDriver.team_id == team_id).delete()
        )
        
        # Add new drivers
        await self.add_team_drivers(team_id, driver_ids, captain_id)
        
        # Update budget
        team.budget_spent = await self.calculate_team_budget(team_id)
        
        await self.db.commit()
        await self.db.refresh(team)
        return team
```

---

## ScoringService (Updated for F1 Fantasy)

### Overview

ScoringService calculates points for constructors based on weekly driver drafts. Key differences from fantasy football:
- No captain multiplier (1.5x)
- Points are calculated from DriverDraft entries (2 drivers per constructor per race)
- Points accumulate to Constructor's seasonal total from all races

### Implementation

```python
# app/services/scoring_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Dict
from app.models.race import Race, RaceResult
from app.models.constructor import Constructor
from app.models.driver_draft import DriverDraft
from app.models.driver import Driver
from app.models.user import User

class ScoringService:
    """Service for scoring calculations and leaderboards (F1 Fantasy MVP)."""
    
    # F1 Scoring System (2024+)
    POSITION_POINTS = {
        1: 25,
        2: 18,
        3: 15,
        4: 12,
        5: 10,
        6: 8,
        7: 6,
        8: 4,
        9: 2,
        10: 1,
    }
    
    FASTEST_LAP_BONUS = 1.0
    
    # F1 Fantasy: No captain multiplier - both drivers count equally
    # Each constructor drafts 2 drivers per race
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def calculate_constructor_points(
        self,
        constructor_id: int,
        race_id: int
    ) -> float:
        """Calculate total points for a constructor in a race based on driver drafts."""
        # Get constructor's driver drafts for this race
        result = await self.db.execute(
            select(DriverDraft, Driver, RaceResult)
            .join(Driver, DriverDraft.driver_id == Driver.id)
            .join(
                RaceResult,
                and_(
                    RaceResult.driver_id == Driver.id,
                    RaceResult.race_id == race_id
                ),
                isouter=True
            )
            .where(DriverDraft.constructor_id == constructor_id)
            .where(DriverDraft.race_id == race_id)
        )
        driver_drafts = result.all()
        
        total_points = 0.0
        
        for driver_draft, driver, race_result in driver_drafts:
            # Get points earned by driver
            points = 0.0
            
            if race_result and not race_result.dnf:
                # Position points
                points += self.POSITION_POINTS.get(
                    race_result.position,
                    0.0
                )
                
                # Fastest lap bonus (only if driver finished in top 10)
                if race_result.fastest_lap and race_result.position <= 10:
                    points += self.FASTEST_LAP_BONUS
            
            # No captain multiplier - all drivers count equally
            total_points += points
            
            # Update driver draft with points earned
            driver_draft.points_earned = points
        
        await self.db.commit()
        return total_points
    
    async def calculate_driver_total_points(
        self,
        driver_id: int
    ) -> float:
        """Calculate total points for a driver across all races."""
        result = await self.db.execute(
            select(func.sum(RaceResult.points_earned))
            .where(RaceResult.driver_id == driver_id)
        )
        total = result.scalar()
        return total if total else 0.0
    
    async def generate_leaderboard(
        self,
        league_id: int,
        race_id: int = None
    ) -> List[Dict]:
        """Generate leaderboard for a league."""
        if race_id:
            return await self._generate_race_leaderboard(league_id, race_id)
        else:
            return await self._generate_overall_leaderboard(league_id)
    
    async def _generate_race_leaderboard(
        self,
        league_id: int,
        race_id: int
    ) -> List[Dict]:
        """Generate leaderboard for a specific race."""
        # Get all constructors in league
        result = await self.db.execute(
            select(Constructor, User)
            .join(User, Constructor.user_id == User.id)
            .where(Constructor.league_id == league_id)
        )
        constructors = result.all()
        
        leaderboard = []
        for constructor, user in constructors:
            points = await self.calculate_constructor_points(constructor.id, race_id)
            leaderboard.append({
                "constructor_id": constructor.id,
                "team_name": constructor.team_name,
                "username": user.username,
                "total_points": points,
                "race_id": race_id
            })
        
        # Sort by points descending
        leaderboard.sort(key=lambda x: x["total_points"], reverse=True)
        
        # Add ranks
        for i, entry in enumerate(leaderboard, 1):
            entry["rank"] = i
        
        return leaderboard
    
    async def _generate_overall_leaderboard(
        self,
        league_id: int
    ) -> List[Dict]:
        """Generate overall leaderboard for a league (season standings)."""
        # Get all constructors in league
        result = await self.db.execute(
            select(Constructor, User)
            .join(User, Constructor.user_id == User.id)
            .where(Constructor.league_id == league_id)
        )
        constructors = result.all()
        
        leaderboard = []
        for constructor, user in constructors:
            # Get constructor's total_points from database
            # This is accumulated from all weekly driver drafts
            total_points = constructor.total_points or 0.0
            
            leaderboard.append({
                "constructor_id": constructor.id,
                "team_name": constructor.team_name,
                "username": user.username,
                "total_points": total_points
            })
        
        # Sort by points descending
        leaderboard.sort(key=lambda x: x["total_points"], reverse=True)
        
        # Add ranks
        for i, entry in enumerate(leaderboard, 1):
            entry["rank"] = i
        
        return leaderboard
    
    async def update_all_constructor_scores(self, race_id: int = None) -> None:
        """Update scores for all constructors (usually called after race results are posted)."""
        if race_id:
            # Update scores for specific race
            result = await self.db.execute(select(Constructor))
            constructors = result.scalars().all()
            
            for constructor in constructors:
                # Calculate points for this race
                race_points = await self.calculate_constructor_points(
                    constructor.id,
                    race_id
                )
                
                # Update constructor's total_points (accumulate across all races)
                constructor.total_points = await self._calculate_overall_constructor_points(constructor.id)
                
            await self.db.commit()
        else:
            # Recalculate all scores (e.g., after data correction)
            result = await self.db.execute(select(Constructor))
            constructors = result.scalars().all()
            
            for constructor in constructors:
                constructor.total_points = await self._calculate_overall_constructor_points(constructor.id)
            
            await self.db.commit()
    
    async def _calculate_overall_constructor_points(self, constructor_id: int) -> float:
        """Calculate overall points for a constructor across all races."""
        # Sum points from all driver drafts
        result = await self.db.execute(
            select(func.sum(DriverDraft.points_earned))
            .where(DriverDraft.constructor_id == constructor_id)
        )
        total_points = result.scalar()
        return total_points if total_points else 0.0
    
    async def get_constructor_points_for_race(
        self,
        constructor_id: int,
        race_id: int
    ) -> float:
        """Get points for a constructor in a specific race."""
        result = await self.db.execute(
            select(func.sum(DriverDraft.points_earned))
            .where(
                and_(
                    DriverDraft.constructor_id == constructor_id,
                    DriverDraft.race_id == race_id
                )
            )
        )
        total = result.scalar()
        return total if total else 0.0
```

---

## LeagueService

### Implementation

```python
# app/services/league_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
import secrets
import string
from app.models.league import League
from app.services.base_service import BaseService

class LeagueService(BaseService[League, LeagueCreate, LeagueUpdate]):
    """Service for league operations."""
    
    def __init__(self, db: AsyncSession):
        super().__init__(League, db)
    
    async def create_league(
        self,
        league_data: LeagueCreate,
        creator_id: int
    ) -> League:
        """Create a new league with unique code."""
        # Generate unique code
        code = self._generate_unique_code()
        
        league = League(
            name=league_data.name,
            description=league_data.description,
            creator_id=creator_id,
            code=code,
            max_teams=league_data.max_teams,
            is_private=league_data.is_private or True,
            scoring_system=league_data.scoring_system or "standard"
        )
        
        self.db.add(league)
        await self.db.commit()
        await self.db.refresh(league)
        return league
    
    def _generate_unique_code(self) -> str:
        """Generate a unique league code."""
        chars = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(chars) for _ in range(6))
    
    async def join_league(
        self,
        league_id: int,
        user_id: int
    ) -> Optional[League]:
        """Join a league (enforces max teams)."""
        league = await self.get(league_id)
        if not league:
            raise BusinessLogicError("League not found")
        
        if league.is_private:
            raise ValidationError("Cannot join private league")
        
        # Check if league is full
        result = await self.db.execute(
            select(Team).where(Team.league_id == league_id)
        )
        team_count = len(result.all())
        
        if team_count >= league.max_teams:
            raise ValidationError("League is full")
        
        return league
    
    async def get_league_teams(
        self,
        league_id: int
    ) -> List[Team]:
        """Get all teams in a league."""
        result = await self.db.execute(
            select(Team).where(Team.league_id == league_id)
        )
        return result.scalars().all()
    
    async def get_league_members_count(self, league_id: int) -> int:
        """Get count of teams in a league."""
        result = await self.db.execute(
            select(Team.id).where(Team.league_id == league_id)
        )
        return len(result.all())
    
    async def search_public_leagues(
        self,
        query: str = None,
        limit: int = 20
    ) -> List[League]:
        """Search for public leagues."""
        search = select(League).where(League.is_private == False)
        
        if query:
            search = search.where(League.name.ilike(f"%{query}%"))
        
        search = search.limit(limit)
        result = await self.db.execute(search)
        return result.scalars().all()
```

---

## DriverService

### Implementation

**Architecture Note**: DriverService is primarily a **read-only service** that queries driver data from the local database. All CRUD operations (create, update, delete) should be handled via the Jolpica API through the ExternalDataService. Manual admin edits are possible but should be rare and require admin permissions.

```python
# app/services/driver_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.models.driver import Driver
from app.services.base_service import BaseService
from app.core.exceptions import PermissionError

class DriverService(BaseService[Driver, DriverCreate, DriverUpdate]):
    """Service for driver operations (read-only for most users)."""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Driver, db)
    
    async def get_active_drivers(self) -> List[Driver]:
        """Get all active drivers."""
        result = await self.db.execute(
            select(Driver).where(Driver.status == "active")
        )
        return result.scalars().all()
    
    async def get_drivers_by_team(self, team_name: str) -> List[Driver]:
        """Get drivers by team name."""
        result = await self.db.execute(
            select(Driver).where(Driver.team_name == team_name)
        )
        return result.scalars().all()
    
    async def get_driver_rankings(self) -> List[Driver]:
        """Get drivers ranked by total points."""
        result = await self.db.execute(
            select(Driver)
            .where(Driver.status == "active")
            .order_by(Driver.total_points.desc())
        )
        return result.scalars().all()
    
    async def update_driver_stats(self, driver_id: int) -> None:
        """Update driver statistics (called by ScoringService)."""
        from app.models.race import RaceResult
        
        driver = await self.get(driver_id)
        if not driver:
            return
        
        # Calculate total points
        result = await self.db.execute(
            select(func.sum(RaceResult.points_earned))
            .where(RaceResult.driver_id == driver_id)
        )
        total_points = result.scalar() or 0.0
        
        # Calculate average points
        count_result = await self.db.execute(
            select(func.count(RaceResult.id))
            .where(RaceResult.driver_id == driver_id)
        )
        race_count = count_result.scalar() or 0
        
        average_points = total_points / race_count if race_count > 0 else 0.0
        
        driver.total_points = total_points
        driver.average_points = average_points
        
        await self.db.commit()
    
    async def search_drivers(
        self,
        query: str,
        limit: int = 10
    ) -> List[Driver]:
        """Search drivers by name."""
        result = await self.db.execute(
            select(Driver)
            .where(Driver.name.ilike(f"%{query}%"))
            .limit(limit)
        )
        return result.scalars().all()
    
    async def admin_update_driver(
        self,
        driver_id: int,
        driver_in: DriverUpdate,
        user_id: int,
        is_admin: bool
    ) -> Optional[Driver]:
        """Admin-only manual driver update (rare use case)."""
        if not is_admin:
            raise PermissionError("Only admins can manually update driver data")
        
        # Log manual update for audit purposes
        # TODO: Add audit logging
        
        return await self.update(await self.get(driver_id), driver_in)
```

---

## RaceService

### Implementation

**Architecture Note**: RaceService is primarily a **read-only service** that queries race data from the local database. All CRUD operations (create, update, delete) should be handled via the Jolpica API through the ExternalDataService. Manual admin edits are possible but should be rare and require admin permissions.

```python
# app/services/race_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
from app.models.race import Race
from app.models.driver import Driver
from app.services.base_service import BaseService
from app.core.exceptions import PermissionError

class RaceService(BaseService[Race, RaceCreate, RaceUpdate]):
    """Service for race operations (read-only for most users)."""
    
    def __init__(self, db: AsyncSession):
        super().__init__(Race, db)
    
    async def get_upcoming_races(self, limit: int = 10) -> List[Race]:
        """Get upcoming races."""
        result = await self.db.execute(
            select(Race)
            .where(Race.status == "upcoming")
            .order_by(Race.race_date.asc())
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_completed_races(self, limit: int = 10) -> List[Race]:
        """Get completed races."""
        result = await self.db.execute(
            select(Race)
            .where(Race.status == "completed")
            .order_by(Race.race_date.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_race_by_date(self, date: datetime) -> Optional[Race]:
        """Get race by date."""
        result = await self.db.execute(
            select(Race).where(Race.race_date == date)
        )
        return result.scalar_one_or_none()
    
    async def admin_update_race(
        self,
        race_id: int,
        race_in: RaceUpdate,
        user_id: int,
        is_admin: bool
    ) -> Optional[Race]:
        """Admin-only manual race update (rare use case)."""
        if not is_admin:
            raise PermissionError("Only admins can manually update race data")
        
        # Log manual update for audit purposes
        # TODO: Add audit logging
        
        return await self.update(await self.get(race_id), race_in)
```

---

## ExternalDataService

### Implementation

**Architecture Note**: ExternalDataService is the primary service for all CRUD operations on drivers, races, and race results. This service interacts with the Jolpica API to fetch and sync F1 data. It's called by Celery background tasks to keep the local database synchronized with official F1 data.

```python
# app/services/external_data_service.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional, Dict
import httpx
from app.models.driver import Driver
from app.models.race import Race, RaceResult
from app.core.logging import logger

class ExternalDataService:
    """Service for interacting with external F1 API (Jolpica)."""
    
    JOLPICA_API_BASE = "https://api.jolpica.com/v1"
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.http_client = httpx.AsyncClient(timeout=30.0)
    
    async def sync_drivers(self, season: int = 2024) -> int:
        """Fetch and sync drivers from Jolpica API."""
        try:
            response = await self.http_client.get(
                f"{self.JOLPICA_API_BASE}/drivers?season={season}"
            )
            response.raise_for_status()
            drivers_data = response.json()
            
            sync_count = 0
            for driver_data in drivers_data:
                # Check if driver exists
                existing = await self.db.execute(
                    select(Driver).where(
                        Driver.external_id == driver_data["driverId"]
                    )
                )
                driver = existing.scalar_one_or_none()
                
                if driver:
                    # Update existing driver
                    driver.name = driver_data["givenName"] + " " + driver_data["familyName"]
                    driver.team_name = driver_data.get("team", "")
                    driver.number = driver_data.get("number")
                    driver.code = driver_data.get("code")
                    driver.status = "active"
                else:
                    # Create new driver
                    driver = Driver(
                        external_id=driver_data["driverId"],
                        name=driver_data["givenName"] + " " + driver_data["familyName"],
                        team_name=driver_data.get("team", ""),
                        number=driver_data.get("number"),
                        code=driver_data.get("code"),
                        status="active",
                        price=10.0  # Default price, should be set by admin
                    )
                    self.db.add(driver)
                
                sync_count += 1
            
            await self.db.commit()
            logger.info(f"Synced {sync_count} drivers from Jolpica API")
            return sync_count
            
        except httpx.HTTPError as e:
            logger.error(f"Error fetching drivers from Jolpica: {e}")
            raise
    
    async def sync_race_calendar(self, season: int = 2024) -> int:
        """Fetch and sync race calendar from Jolpica API."""
        try:
            response = await self.http_client.get(
                f"{self.JOLPICA_API_BASE}/races?season={season}"
            )
            response.raise_for_status()
            races_data = response.json()
            
            sync_count = 0
            for race_data in races_data:
                # Check if race exists
                existing = await self.db.execute(
                    select(Race).where(
                        Race.external_id == race_data["raceId"]
                    )
                )
                race = existing.scalar_one_or_none()
                
                if race:
                    # Update existing race
                    race.name = race_data.get("raceName", "")
                    race.circuit_name = race_data.get("circuit", {}).get("circuitName", "")
                    race.country = race_data.get("circuit", {}).get("location", {}).get("country", "")
                    race.round_number = race_data.get("round", 0)
                    race.laps = race_data.get("laps", 0)
                    # Don't update date from API to preserve original schedule
                else:
                    # Create new race
                    race = Race(
                        external_id=race_data["raceId"],
                        name=race_data.get("raceName", ""),
                        circuit_name=race_data.get("circuit", {}).get("circuitName", ""),
                        country=race_data.get("circuit", {}).get("location", {}).get("country", ""),
                        round_number=race_data.get("round", 0),
                        laps=race_data.get("laps", 0),
                        status="upcoming"
                    )
                    self.db.add(race)
                
                sync_count += 1
            
            await self.db.commit()
            logger.info(f"Synced {sync_count} races from Jolpica API")
            return sync_count
            
        except httpx.HTTPError as e:
            logger.error(f"Error fetching races from Jolpica: {e}")
            raise
    
    async def sync_race_results(self, race_id: str) -> int:
        """Fetch and sync race results from Jolpica API."""
        try:
            response = await self.http_client.get(
                f"{self.JOLPICA_API_BASE}/races/{race_id}/results"
            )
            response.raise_for_status()
            results_data = response.json()
            
            # Find local race
            result = await self.db.execute(
                select(Race).where(Race.external_id == race_id)
            )
            race = result.scalar_one_or_none()
            
            if not race:
                logger.warning(f"Race {race_id} not found in local database")
                return 0
            
            sync_count = 0
            for result_data in results_data:
                driver_id = result_data.get("driver", {}).get("driverId")
                position = result_data.get("position")
                
                if not driver_id or not position:
                    continue
                
                # Check if result exists
                existing = await self.db.execute(
                    select(RaceResult).where(
                        RaceResult.race_id == race.id,
                        RaceResult.driver_external_id == driver_id
                    )
                )
                race_result = existing.scalar_one_or_none()
                
                if race_result:
                    # Update existing result
                    race_result.position = position
                    race_result.points_earned = float(result_data.get("points", 0))
                    race_result.dnf = result_data.get("status") != "Finished"
                    race_result.fastest_lap = result_data.get("fastestLap", False)
                else:
                    # Create new result
                    race_result = RaceResult(
                        race_id=race.id,
                        driver_external_id=driver_id,
                        position=position,
                        points_earned=float(result_data.get("points", 0)),
                        dnf=result_data.get("status") != "Finished",
                        fastest_lap=result_data.get("fastestLap", False)
                    )
                    self.db.add(race_result)
                
                sync_count += 1
            
            await self.db.commit()
            logger.info(f"Synced {sync_count} race results from Jolpica API")
            return sync_count
            
        except httpx.HTTPError as e:
            logger.error(f"Error fetching race results from Jolpica: {e}")
            raise
    
    async def close(self):
        """Close HTTP client."""
        await self.http_client.aclose()
```

---

## Service Usage Examples

### In API Endpoints

```python
# app/api/v1/endpoints/teams.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.team_service import TeamService
from app.services.scoring_service import ScoringService
from app.db.session import get_db

router = APIRouter()

@router.post("/teams")
async def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new team."""
    team_service = TeamService(db)
    team = await team_service.create_team(team_data, current_user.id)
    return team

@router.get("/teams/{team_id}")
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get team details."""
    team_service = TeamService(db)
    return await team_service.get(team_id)

@router.get("/leagues/{league_id}/leaderboard")
async def get_leaderboard(
    league_id: int,
    race_id: int = None,
    db: AsyncSession = Depends(get_db)
):
    """Get league leaderboard."""
    scoring_service = ScoringService(db)
    leaderboard = await scoring_service.generate_leaderboard(
        league_id,
        race_id
    )
    return {"leaderboard": leaderboard}
```

### Using ExternalDataService in Celery Tasks

```python
# app/celery_tasks.py
from celery import Celery
from app.db.session import async_session
from app.services.external_data_service import ExternalDataService

celery_app = Celery("tasks")

@celery_app.task
def sync_drivers_task():
    """Sync drivers from Jolpica API."""
    async def _sync():
        async with async_session() as db:
            service = ExternalDataService(db)
            try:
                count = await service.sync_drivers()
                return f"Synced {count} drivers"
            finally:
                await service.close()
    
    return asyncio.run(_sync())

@celery_app.task
def sync_race_calendar_task():
    """Sync race calendar from Jolpica API."""
    async def _sync():
        async with async_session() as db:
            service = ExternalDataService(db)
            try:
                count = await service.sync_race_calendar()
                return f"Synced {count} races"
            finally:
                await service.close()
    
    return asyncio.run(_sync())

@celery_app.task
def sync_race_results_task(race_external_id: str):
    """Sync race results from Jolpica API."""
    async def _sync():
        async with async_session() as db:
            service = ExternalDataService(db)
            try:
                count = await service.sync_race_results(race_external_id)
                return f"Synced {count} race results"
            finally:
                await service.close()
    
    return asyncio.run(_sync())
```

---

## Related Documentation

- [Architecture Overview](architecture.md) - Service layer in system architecture
- [Data Models](data_models.md) - Database models used by services
- [API Endpoints](api_endpoints.md) - How services are exposed via API
- [Celery Tasks](celery_tasks.md) - Background tasks using services
- [Result Polling](result_polling.md) - Automated result polling and verification