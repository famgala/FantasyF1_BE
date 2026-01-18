# Fantasy F1 Backend MVP - Implementation Summary

## Overview

This document summarizes the key architectural changes for the Fantasy F1 MVP, transitioning from a fantasy football model to true Formula 1 fantasy mechanics with weekly drafting.

**Date**: 2026-01-09
**Status**: Ready for Development Sprints

---

## Critical Changes from Fantasy Football to F1 Fantasy

### What Changed

| Aspect | Fantasy Football (Original) | F1 Fantasy (MVP) |
|--------|---------------------------|------------------|
| **Team Model** | Static team with 5 drivers | Dynamic constructor with 2 drivers per race |
| **Driver Selection** | Fixed roster all season | Weekly draft - new drivers each race |
| **Budget** | $100M budget for drivers | No budget constraints |
| **Captain** | One captain (1.5x multiplier) | No captain - both drivers count equally |
| **Points** | Calculated from fixed roster | Calculated from weekly drafts, accumulated |
| **Team Name** | One name across all leagues | Custom name per league |
| **League Participation** | One team per league | User can be constructor in multiple leagues |

### Key MVP Mechanics

1. **Weekly Drafting**
   - Each race, constructors draft 2 drivers
   - Draft order rotates: last to draft becomes first next race
   - Two draft methods: Sequential (1,2,3,4,5;1,2,3,4,5) or Snake (1,2,3,4,5;5,4,3,2,1)

2. **Multi-League Support**
   - Users can join multiple leagues
   - Each league = separate constructor championship
   - Custom team name per league

3. **Season-Long Accumulation**
   - Constructor's total_points accumulate from all weekly drafts
   - Leaderboards show season standings (sum of all races)

---

## New Data Models

### 1. Constructor (Replaces Team)
**File**: `app/models/constructor.py`

A Constructor represents a user's team in a specific league. It's a season-long entity that accumulates points.

**Key Fields**:
- `user_id`: Owner of the constructor
- `league_id`: League this constructor belongs to
- `team_name`: Custom name of the constructor (per league)
- `total_points`: Accumulated points from all races
- `rank`: Season ranking

**Relationships**:
- User (many-to-many via Constructor)
- League (belongs to)
- DriverDraft (one-to-many)

---

### 2. DriverDraft (NEW)
**File**: `app/models/driver_draft.py`

Records which driver a constructor drafted for a specific race.

**Key Fields**:
- `constructor_id`: Who drafted the driver
- `race_id`: Which race this pick is for
- `driver_id`: Which driver was picked
- `pick_number`: Position in draft order (1st, 2nd, etc.)
- `points_earned`: Points this driver earned for this race

**Unique Constraints**:
- One driver per constructor per race (max 2 drivers)
- One driver cannot be picked by multiple constructors for same race

---

### 3. DraftOrder (NEW)
**File**: `app/models/draft_order.py`

Tracks the draft order for each race in each league.

**Key Fields**:
- `league_id`: League this draft order applies to
- `race_id`: Race this draft order applies to
- `method`: "sequential" or "snake"
- `order_data`: JSON array of user_ids [1,4,2,3,5]
- `is_manual`: Whether manually set by league manager
- `last_modified_by`: User who last changed the order
- `last_modified_at`: Timestamp of last change

**Unique Constraints**:
- One draft order per league per race

---

## New Services

### 1. DraftService (MVP Critical)
**File**: `app/services/draft_service.py`

Core service for managing weekly driver drafts.

**Key Methods**:

```python
class DraftService:
    MAX_DRIVERS_PER_RACE = 2
    
    async def generate_initial_draft_order(league_id: int) -> DraftOrder
    async def rotate_draft_order(league_id: int, previous_race_id: int) -> DraftOrder
    async def make_driver_pick(constructor_id: int, race_id: int, 
                               driver_id: int, pick_number: int) -> DriverDraft
    async def get_draft_order(league_id: int, race_id: int) -> DraftOrder
    async def get_constructor_drafts(constructor_id: int, race_id: int) -> List[DriverDraft]
    async def manually_set_draft_order(league_id: int, race_id: int, 
                                      user_ids: List[int], modifier_id: int) -> DraftOrder
```

**Business Logic**:
- Random shuffle for initial draft order
- Rotate order: `last_picked_moves_to_front`
- Validate pick order matches draft sequence
- Prevent duplicate driver picks for same race
- Notify league members on manual order changes (if enabled)

---

### 2. ConstructorService (Replaces TeamService)
**File**: `app/services/constructor_service.py`

Manages user's constructors across multiple leagues.

**Key Methods**:

```python
class ConstructorService(BaseService[Constructor, ConstructorCreate, ConstructorUpdate]):
    async def create_constructor(constructor_data: ConstructorCreate, user_id: int) -> Constructor
    async def get_user_constructor_in_league(user_id: int, league_id: int) -> Constructor
    async def get_user_constructors(user_id: int) -> List[Constructor]
    async def get_league_constructors(league_id: int) -> List[Constructor]
    async def update_team_name(constructor_id: int, team_name: str) -> Constructor
    async def update_total_points(constructor_id: int) -> float
    async def get_constructor_points_for_race(constructor_id: int, race_id: int) -> float
```

**Business Logic**:
- Prevent duplicate constructors for same user/league
- Enforce league capacity limits
- Calculate total_points from all driver drafts
- Support custom team names per league

---

### 3. ScoringService (Updated)
**File**: `app/services/scoring_service.py`

Calculates points from driver drafts to constructor totals.

**Key Changes from Fantasy Football**:
- No captain multiplier (removed 1.5x)
- Points calculated from DriverDraft, not TeamDriver
- Uses DriverDraft.points_earned to accumulate

**Key Methods**:

```python
class ScoringService:
    POSITION_POINTS = {1: 25, 2: 18, 3: 15, ...}  # F1 2024+ scoring
    FASTEST_LAP_BONUS = 1.0
    
    async def calculate_constructor_points(constructor_id: int, race_id: int) -> float
    async def calculate_driver_total_points(driver_id: int) -> float
    async def generate_leaderboard(league_id: int, race_id: int = None) -> List[Dict]
    async def update_all_constructor_scores(race_id: int = None) -> None
    async def get_constructor_points_for_race(constructor_id: int, race_id: int) -> float
```

**Scoring Logic**:
```python
# Constructor points = sum of 2 drafted drivers' points
for driver_draft in constructor.driver_drafts:
    points = race_result.points_earned
    if race_result.fastest_lap and race_result.position <= 10:
        points += 1.0  # Fastest lap bonus
    constructor_points += points
```

---

## Database Migration Plan

### Migration Steps

1. **Create new tables** (in order):
   - `constructors` (replaces `teams`)
   - `driver_drafts`
   - `draft_orders`

2. **Update existing tables**:
   - `leagues`: Add `draft_method`, `allow_draft_change`, `notify_on_draft_change`
   - `leagues`: Rename `max_teams` to `max_players`
   - `notifications`: Add `DRAFT_ORDER_CHANGED` type

3. **Drop old tables** (after data migration):
   - `team_drivers` (junction table)
   - `teams` (replaced by constructors)

### Migration File Structure

```python
# alembic/versions/002_fantasy_f1_mvp_migration.py

def upgrade():
    # 1. Create constructors table
    op.create_table('constructors', ...)
    
    # 2. Create driver_drafts table
    op.create_table('driver_drafts', ...)
    
    # 3. Create draft_orders table
    op.create_table('draft_orders', ...)
    
    # 4. Update leagues table
    op.add_column('leagues', sa.Column('draft_method', sa.String(20)))
    op.alter_column('leagues', 'max_teams', new_column_name='max_players')
    
def downgrade():
    # Reverse all changes
```

---

## API Endpoints to Implement

### Draft Management Endpoints

```python
# GET /api/v1/leagues/{league_id}/draft-order/{race_id}
# Get draft order for a race

# POST /api/v1/leagues/{league_id}/draft-order
# Generate initial random draft order

# POST /api/v1/leagues/{league_id}/draft-order/{race_id}/rotate
# Rotate draft order from previous race

# PUT /api/v1/leagues/{league_id}/draft-order/{race_id}
# Manually set draft order (league manager only)

# POST /api/v1/constructors/{constructor_id}/drafts
# Make a driver pick

# GET /api/v1/constructors/{constructor_id}/drafts/{race_id}
# Get constructor's driver picks for a race

# GET /api/v1/races/{race_id}/drafts
# Get all driver picks for a race
```

### Constructor Endpoints

```python
# POST /api/v1/constructors
# Create constructor when joining league

# GET /api/v1/constructors/{constructor_id}
# Get constructor details

# GET /api/v1/users/{user_id}/constructors
# Get all constructors for a user

# GET /api/v1/leagues/{league_id}/constructors
# Get all constructors in a league

# PUT /api/v1/constructors/{constructor_id}/name
# Update constructor team name

# GET /api/v1/constructors/{constructor_id}/points/{race_id}
# Get points for a race
```

### League Endpoints (Updated)

```python
# PUT /api/v1/leagues/{league_id}/settings
# Update draft method and settings

# GET /api/v1/leagues/{league_id}/draft-settings
# Get draft settings
```

---

## Implementation Sprints

### Sprint 1: Core Data Models (Week 1-2)

**Goals**:
- Create Constructor, DriverDraft, DraftOrder models
- Update League model with draft settings
- Write database migration
- Test model relationships

**Tasks**:
- [ ] Implement `app/models/constructor.py`
- [ ] Implement `app/models/driver_draft.py`
- [ ] Implement `app/models/draft_order.py`
- [ ] Update `app/models/league.py`
- [ ] Create Alembic migration
- [ ] Run migration and test
- [ ] Write model unit tests

---

### Sprint 2: DraftService (Week 2-3)

**Goals**:
- Implement DraftService with all business logic
- Test draft order generation and rotation
- Test driver pick validation

**Tasks**:
- [ ] Implement `app/services/draft_service.py`
- [ ] Write unit tests for `generate_initial_draft_order()`
- [ ] Write unit tests for `rotate_draft_order()`
- [ ] Write unit tests for `make_driver_pick()`
- [ ] Write unit tests for `make_driver_pick()` order validation
- [ ] Write unit tests for `manually_set_draft_order()`
- [ ] Integration test: complete draft flow

---

### Sprint 3: ConstructorService (Week 3)

**Goals**:
- Implement ConstructorService
- Test constructor creation and management
- Test multi-league support

**Tasks**:
- [ ] Implement `app/services/constructor_service.py`
- [ ] Write unit tests for `create_constructor()`
- [ ] Write unit tests for `get_user_constructor_in_league()`
- [ ] Write unit tests for `update_total_points()`
- [ ] Integration test: user joins multiple leagues

---

### Sprint 4: ScoringService Update (Week 3-4)

**Goals**:
- Update ScoringService for F1 fantasy
- Test point calculations
- Test leaderboard generation

**Tasks**:
- [ ] Update `app/services/scoring_service.py`
- [ ] Remove captain multiplier logic
- [ ] Implement `calculate_constructor_points()`
- [ ] Write unit tests for point calculations
- [ ] Write unit tests for `generate_leaderboard()`
- [ ] Integration test: race results → points update

---

### Sprint 5: API Endpoints (Week 4-5)

**Goals**:
- Implement draft management API
- Implement constructor API
- Implement updated league API

**Tasks**:
- [ ] Create `app/api/v1/endpoints/drafts.py`
- [ ] Create `app/api/v1/endpoints/constructors.py`
- [ ] Update `app/api/v1/endpoints/leagues.py`
- [ ] Write API tests (pytest + httpx)
- [ ] Test authentication and authorization
- [ ] Test error handling

---

### Sprint 6: Background Tasks (Week 5-6)

**Goals**:
- Implement draft order rotation automation
- Implement auto-score updates after races

**Tasks**:
- [ ] Create Celery task for draft order rotation
- [ ] Create Celery task for score updates
- [ ] Schedule tasks with Celery Beat
- [ ] Test task execution
- [ ] Monitor task logs

---

### Sprint 7: Testing & Polish (Week 6-7)

**Goals**:
- End-to-end testing
- Performance optimization
- Documentation

**Tasks**:
- [ ] Write end-to-end tests (pytest)
- [ ] Test complete user flow: join league → draft → scores
- [ ] Test draft order rotation across multiple races
- [ ] Add database query logging
- [ ] Add caching for leaderboards
- [ ] Update API documentation
- [ ] Create developer guide

---

## Database Schema Summary

### Tables Created

| Table | Purpose | Rows Expected (MVP) |
|-------|---------|---------------------|
| `constructors` | User's teams in leagues | 1,000 (100 users × 10 leagues) |
| `driver_drafts` | Weekly driver picks | 200,000 (1,000 constructors × 20 races × 2 drivers) |
| `draft_orders` | Draft order per race | 2,000 (100 leagues × 20 races) |

### Tables Updated

| Table | Changes |
|-------|---------|
| `leagues` | Added `draft_method`, `allow_draft_change`, `notify_on_draft_change` |
| `notifications` | Added `DRAFT_ORDER_CHANGED` type |

### Tables Removed

| Table | Replaced By |
|-------|-------------|
| `team_drivers` | `driver_drafts` |
| `teams` | `constructors` |

---

## Key Business Rules

### Draft Rules

1. **Initial Draft Order**: Random shuffle of all constructors in league
2. **Draft Rotation**: Last constructor to draft becomes first to draft next race
3. **Picks Per Constructor**: Exactly 2 drivers per race
4. **Duplicate Prevention**: One driver cannot be picked by multiple constructors for same race
5. **Pick Validation**: Must pick in correct draft order

### Constructor Rules

1. **One Per League**: User can have only one constructor per league
2. **Multiple Leagues**: User can be constructor in multiple leagues simultaneously
3. **Custom Names**: Each constructor can have unique team name
4. **League Capacity**: Limited by `league.max_players`

### Scoring Rules

1. **Point System**: F1 2024+ scoring (25pts for 1st, 18pts for 2nd, etc.)
2. **Fastest Lap Bonus**: +1 point if driver finishes in top 10
3. **No Multiplier**: Both drafted drivers count equally (no captain)
4. **Accumulation**: Constructor's total_points = sum of all driver draft points

---

## Testing Strategy

### Unit Tests

- **Model Tests**: Validate relationships, constraints, cascades
- **Service Tests**: Test each service method independently
- **Repository Tests**: Test database queries

### Integration Tests

- **Draft Flow**: Create league → join → draft order → pick drivers
- **Scoring Flow**: Race results → calculate points → update constructor
- **Multi-League**: User in multiple leagues with different constructions

### End-to-End Tests

- **Season Simulation**: Complete 20-race season with drafting and scoring
- **Leaderboard Updates**: Verify leaderboard changes after each race
- **Draft Rotation**: Verify draft order rotates correctly across races

---

## Performance Considerations

### Database Indexes

Critical indexes for performance:
- `constructors`: `(user_id, league_id)`, `total_points`
- `driver_drafts`: `(constructor_id, race_id)`, `(driver_id, race_id)`, `(constructor_id, race_id, driver_id)`
- `draft_orders`: `(league_id, race_id)`

### Caching Strategy

- **Leaderboards**: Cache for 5 minutes, invalidate on score updates
- **Draft Orders**: Cache for current race only
- **Constructor Points**: Cache per race, aggregate from cache

### Query Optimization

- Use `select()` with specific columns instead of `*`
- Batch operations where possible (e.g., update all constructors after race)
- Use `asyncio.gather()` for parallel independent queries

---

## Security Considerations

### Authorization

- **Draft Order Changes**: League manager only
- **Constructor Creation**: Verified users only
- **League Joining**: Enforce league capacity and private/public settings

### Input Validation

- Validate `pick_number` matches draft order
- Validate `driver_id` is active driver
- Validate `constructor_id` belongs to requesting user

### Audit Logging

- Log all manual draft order changes
- Log constructor creation/deletion
- Log scoring updates (for debugging)

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, e2e)
- [ ] Database migration tested on staging
- [ ] API documentation updated
- [ ] Performance benchmarks met
- [ ] Security review completed

### Deployment

- [ ] Deploy database migration
- [ ] Deploy backend code
- [ ] Start Celery workers
- [ ] Verify health checks
- [ ] Monitor error logs

### Post-Deployment

- [ ] Smoke tests: create league, join, draft, score
- [ ] Monitor database performance
- [ ] Check Celery task execution
- [ ] Verify caching is working
- [ ] Gather user feedback

---

## Documentation Links

- [Architecture Overview](backend/01-architecture.md) - System architecture
- [Data Models](backend/03-data_models.md) - Complete schema documentation
- [Business Logic](backend/06-business_logic.md) - Service implementations
- [API Endpoints](backend/04-api_endpoints.md) - API specification
- [Celery Tasks](backend/08-celery_tasks.md) - Background tasks

---

## Questions?

Contact the development team or review the individual documentation files for more details on specific components.