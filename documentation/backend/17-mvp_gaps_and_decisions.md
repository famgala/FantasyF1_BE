# MVP Gaps and Decisions

## Document Overview

This document captures the key decisions made during the MVP planning phase, including features explicitly excluded from scope and design considerations for future implementation.

**Date**: 2026-01-09
**Status**: MVP Decision Log

---

## Table of Contents

1. [Authentication & Security](#authentication--security)
2. [League Management](#league-management)
3. [Draft System](#draft-system)
4. [Scoring & Results](#scoring--results)
5. [Notifications](#notifications)
6. [Edge Cases](#edge-cases)
7. [Frontend Integration](#frontend-integration)
8. [Data Management](#data-management)
9. [Performance & Monitoring](#performance--monitoring)
10. [Future Considerations](#future-considerations)

---

## Authentication & Security

### Admin Account Setup (MVP Decision)

**Decision**: Admin account configured via environment variables, created on application startup.

**Implementation**:
- Environment variables: `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` file
- Admin account created during application initialization if it doesn't exist
- No separate CLI command or web setup flow

**Rationale**:
- Simpler deployment and configuration
- Docker Compose can set these values at startup
- Reduces setup surface area for MVP

**Future Consideration**:
- Add setup wizard for first-time deployment
- Support multiple admin users
- Add admin role management

### Password Reset (Explicitly Out of Scope)

**Status**: Not implementing password reset functionality for MVP.

**Rationale**:
- MVP focuses on core fantasy mechanics
- Admin can manually reset passwords in database
- Reduces complexity for initial release

**Future Implementation Path**:
- Add email-based password reset
- Support security questions
- Implement 2FA option

---

## League Management

### League Creation Flow (MVP Decision)

**Decision**: User-created leagues only. No pre-populated leagues.

**User Flow**:
1. User creates a new league
2. User automatically joins as constructor and becomes manager
3. User is recorded as "creator" for posterity
4. League initially has 0 members (creator only)
5. Creator can transfer management to another user
6. Original creator always visible in league metadata

**Implementation**:
```python
async def create_league(
    name: str,
    user_id: int,
    max_players: Optional[int] = None,
    is_public: bool = True
) -> League:
    """Create a new league and automatically join the creator."""
    league = League(
        name=name,
        creator_id=user_id,
        manager_id=user_id,  # Creator becomes initial manager
        max_players=max_players,
        is_public=is_public,
        draft_method="sequential"  # MVP default
    )
    db.add(league)
    await db.commit()
    await db.refresh(league)
    
    # Automatically create constructor for creator
    constructor = await create_constructor(
        league_id=league.id,
        user_id=user_id,
        team_name=f"{user.username}'s Team"
    )
    
    return league


async def transfer_league_management(
    league_id: int,
    current_manager_id: int,
    new_manager_id: int,
    db: AsyncSession
) -> League:
    """Transfer league management to another user."""
    league = await get_league_or_404(league_id, db)
    
    if league.manager_id != current_manager_id:
        raise HTTPException(status_code=403, detail="Only current manager can transfer")
    
    # Verify new manager is member of league
    new_manager = await get_user_constructor_in_league(new_manager_id, league_id, db)
    if not new_manager:
        raise HTTPException(status_code=400, detail="New manager must be league member")
    
    league.manager_id = new_manager_id
    await db.commit()
    await db.refresh(league)
    
    return league
```

**Rationale**:
- Simple user journey
- Community-driven league creation
- Clear ownership and management

---

## Draft System

### Draft Time Limits (Out of Scope, Future-Ready)

**Status**: No time limits per pick in MVP, but designed for future implementation.

**Current Behavior (MVP)**:
- Draft opens Monday 08:00 AM EST
- Draft closes when all picks made OR qualifying starts
- No minimum time per pick
- Constructors can pick whenever during window

**Future Design Considerations**:
- Add `pick_duration_seconds` field to `DraftOrder` model
- Track pick start times
- Implement auto-pick strategies when time expires
- Support different time limits per league

**Design for Future**:
```python
# DraftOrder model extension
class DraftOrder(Base):
    # ... existing fields ...
    
    pick_duration_seconds: Optional[int] = Field(
        default=None,
        description="Seconds allowed per pick (NULL = unlimited for MVP)"
    )


# Future service method
async def get_pick_deadline(
    constructor_id: int,
    race_id: int,
    db: AsyncSession
) -> Optional[datetime]:
    """Get deadline for next pick (future implementation)."""
    # Calculate deadline based on pick start time and duration
    pass
```

### Auto-Picks (Out of Scope, Future-Ready)

**Status**: No auto-picks in MVP, but designed for future implementation.

**Current Behavior (MVP)**:
- If pick not made before draft closes, pick is simply not made
- Constructor may have fewer than 2 drivers
- No automatic selection

**Future Auto-Pick Strategies**:
1. **Highest Ranked**: Pick highest-ranked available driver
2. **Random**: Pick random available driver
3. **Preference-Based**: Pick based on constructor's saved preferences
4. **AI-Assisted**: Use ML to recommend and auto-pick

**Design for Future**:
```python
# League model extension
class League(Base):
    # ... existing fields ...
    
    auto_pick_strategy: Optional[str] = Field(
        default=None,
        description="Strategy for auto-picks (NULL = disabled in MVP)"
    )


# Future service method
async def auto_pick_for_expired_draft(
    constructor_id: int,
    race_id: int,
    strategy: str,
    db: AsyncSession
):
    """Automatically pick for constructor whose pick expired."""
    # Implement auto-pick logic based on strategy
    pass
```

### Draft Notifications (Out of Scope, Future-Ready)

**Status**: No draft alerts in MVP, but designed with extensibility.

**Current Behavior (MVP)**:
- No push notifications
- No email alerts when draft opens
- No alerts when it's constructor's turn

**Future Notification Triggers**:
- Draft opens
- Constructor's turn
- Draft closed
- Draft complete (all picks made)
- Draft order changed

**Design for Future**:
```python
# Database model already has Notification table
# Just not used for draft alerts in MVP

# Future service
class DraftNotificationService:
    """Service for draft-related notifications (future implementation)."""
    
    async def notify_draft_open(self, league_id: int, race_id: int):
        """Notify all constructors draft has opened."""
        pass
    
    async def notify_turn(self, constructor_id: int, race_id: int):
        """Notify constructor it's their turn."""
        pass
```

### Draft Method Support (MVP: Sequential Only)

**Status**: Sequential draft method only. Snake method out of scope.

**MVP Implementation**:
- Sequential: `1, 2, 3, 4, 5, 1, 2, 3, 4, 5`

**Out of Scope**:
- Snake: `1, 2, 3, 4, 5, 5, 4, 3, 2, 1`

**Future Implementation**:
```python
# Already designed in draft rules document
def generate_snake_drafter_sequence(
    constructor_ids: List[int],
    rounds: int = 2
) -> List[int]:
    """Generate snake draft sequence (future implementation)."""
    pass
```

---

## Scoring & Results

### Tie Breaking (MVP Scope)

**Decision**: Ties go to constructor with driver who earned most points.

**Implementation**:
```python
async def resolve_tie(
    constructor1: Constructor,
    constructor2: Constructor,
    race_id: int,
    db: AsyncSession
) -> Constructor:
    """
    Resolve tie between constructors.
    
    Tie goes to constructor with driver who earned most points.
    """
    # Get driver drafts for both constructors
    drafts1_result = await db.execute(
        select(DriverDraft).where(
            DriverDraft.constructor_id == constructor1.id,
            DriverDraft.race_id == race_id
        )
    )
    drafts1 = drafts1_result.scalars().all()
    
    drafts2_result = await db.execute(
        select(DriverDraft).where(
            DriverDraft.constructor_id == constructor2.id,
            DriverDraft.race_id == race_id
        )
    )
    drafts2 = drafts2_result.scalars().all()
    
    # Get race results for all drivers
    driver_ids = [d.driver_id for d in drafts1 + drafts2]
    results_result = await db.execute(
        select(RaceResult).where(
            RaceResult.race_id == race_id,
            RaceResult.driver_id.in_(driver_ids)
        )
    )
    results_map = {r.driver_id: r for r in results_result.scalars().all()}
    
    # Find max points for each constructor
    max_points1 = max([results_map.get(d.driver_id, DriverDraft()).points for d in drafts1])
    max_points2 = max([results_map.get(d.driver_id, DriverDraft()).points for d in drafts2])
    
    if max_points1 > max_points2:
        return constructor1
    elif max_points2 > max_points1:
        return constructor2
    else:
        # Still tied after rule 1 - out of scope for MVP
        # Could be resolved alphabetically or remain tied
        return constructor1  # Arbitrary choice for MVP
```

**Still Tied After Rule 1**: Out of scope for MVP.

**Future Resolution Methods**:
- Alphabetical by team name
- Random draw
- Head-to-head record
- Previous race results

### Race Cancellations (MVP Decision)

**Decision**: Cancelled races are not counted.

**Implementation**:
```python
async def is_race_counted(race_id: int, db: AsyncSession) -> bool:
    """
    Check if race should be counted for scoring.
    
    Cancelled races = not counted.
    """
    race = await get_race_or_404(race_id, db)
    
    # Check race status
    if race.status == "cancelled":
        return False
    
    # Check if race has results
    results_result = await db.execute(
        select(func.count(RaceResult.id)).where(RaceResult.race_id == race_id)
    )
    result_count = results_result.scalar() or 0
    
    return result_count > 0
```

### Postponed Races (Explicitly Out of Scope)

**Status**: Not handling postponed races in MVP.

**Rationale**:
- Postponed races are rare
- Adds schedule management complexity
- Can be handled manually by admin for now

**Future Implementation**:
- Track original and rescheduled dates
- Auto-update draft windows when race rescheduled
- Notify constructors of date changes

### Disqualifications (MVP Decision)

**Decision**: Disqualifications treated same as DNF (0 points).

**Implementation**:
```python
async def calculate_driver_points(
    driver_id: int,
    race_id: int,
    db: AsyncSession
) -> float:
    """
    Calculate points for a driver in a race.
    
    DNF, DNS, DSQ = 0 points.
    """
    result = await db.execute(
        select(RaceResult).where(
            RaceResult.race_id == race_id,
            RaceResult.driver_id == driver_id
        )
    )
    race_result = result.scalar_one_or_none()
    
    if not race_result:
        return 0.0
    
    # DNF, DNS, DSQ all result in 0 points
    if race_result.status in ["DNF", "DNS", "DSQ", "Retired"]:
        return 0.0
    
    # Check if position is a number
    if race_result.position is None:
        return 0.0
    
    return race_result.points
```

---

## Notifications

### Notification System (Explicitly Out of Scope)

**Status**: Database has Notification model, but not used for MVP.

**Rationale**:
- MVP focuses on core mechanics
- Reduces complexity
- Can be added in post-MVP phase

**Database Model Exists But Unused**:
```python
class Notification(Base):
    id: int = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id")
    type: str
    message: str
    read_status: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

**Future Notification Types**:
- Draft opened
- Your turn to pick
- Draft closed
- Draft complete
- Score updated
- League invitation
- Result corrections detected

**Design for Future**:
```python
# Database model already exists
# Just need to implement NotificationService

class NotificationService:
    """Service for user notifications (future implementation)."""
    
    async def create_notification(
        self,
        user_id: int,
        type: str,
        message: str
    ) -> Notification:
        """Create a notification for a user."""
        pass
    
    async def get_unread_notifications(
        self,
        user_id: int
    ) -> List[Notification]:
        """Get all unread notifications for a user."""
        pass
```

---

## Edge Cases

### Late Joiners (Explicitly Out of Scope)

**Status**: Not supporting users joining mid-season for MVP.

**Rationale**:
- Adds scoring complexity (pro-rated points, catch-up scenarios)
- Requires season-long point tracking changes
- Can be added in post-MVP phase

**Future Considerations**:
- Pro-rated season points
- Starting with 0 points mid-season
- Catch-up bonuses for late joiners

### Late Constructors in Draft (MVP Decision)

**Decision**: Constructors who join after first race get added to end of draft order for next race.

**Implementation**:
```python
async def rotate_draft_order(
    previous_draft_order: DraftOrder,
    current_constructors: List[Constructor],
    db: AsyncSession
) -> DraftOrder:
    """
    Rotate draft order from previous race.
    
    New constructors get added to end of order.
    """
    previous_order = previous_draft_order.order_data
    
    # Find last constructor who actually drafted
    last_constructor_id = previous_order[-1]
    
    # Rotate: move last to front
    rotated_order = [last_constructor_id] + [
        c for c in previous_order if c != last_constructor_id
    ]
    
    # Handle constructors who joined after previous race
    existing_ids = set(rotated_order)
    new_constructors = [c.id for c in current_constructors if c.id not in existing_ids]
    rotated_order.extend(new_constructors)  # Added to end
    
    return rotated_order
```

### Multi-League Draft Conflicts (MVP Decision)

**Decision**: Each league has independent draft windows. No special handling for overlapping drafts.

**Rationale**:
- Backend handles races independently
- Frontend handles multi-league UX
- No special backend logic needed

**Backend Responsibility**:
- Calculate draft windows per race/league pair
- Validate picks per league
- Track draft order per league

---

## Frontend Integration

### WebSocket Requirements (MVP Decision)

**Decision**: Backend supports WebSockets for real-time updates, implemented with security best practices.

**WebSocket Use Cases** (Future):
- Real-time draft updates
- Live scoring during race
- Real-time leaderboard updates

**Security Implementation**:
```python
# WebSocket authentication
async def websocket_authenticate(
    websocket: WebSocket,
    token: str,
    db: AsyncSession
) -> User:
    """Authenticate WebSocket connection."""
    user = await decode_token(token, db)
    if not user:
        await websocket.close(code=1008)
        raise Exception("Invalid token")
    return user
```

**Best Practices**:
- WebSocket connections authenticated via JWT
- Rate limiting on connections
- Message validation
- Secure WebSocket (wss://) in production

### API Response Formats (MVP Decision)

**Decision**: Comprehensive OpenAPI/Swagger specs required.

**Implementation**:
- FastAPI auto-generates OpenAPI specs
- All endpoints documented with Pydantic schemas
- Response examples provided
- Error responses documented

**Swagger UI**: Available at `/docs` endpoint by default.

### Pagination (MVP Decision)

**Decision**: Backend API must support pagination for list endpoints.

**Implementation Pattern**:
```python
class PaginationParams(BaseModel):
    """Standard pagination parameters."""
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")


class PaginatedResponse[T](BaseModel, Generic[T]):
    """Standard paginated response."""
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


@router.get("/leagues")
async def list_leagues(
    pagination: PaginationParams = Depends()
) -> PaginatedResponse[League]:
    """List all leagues with pagination."""
    result = await db.execute(select(League).offset(
        (pagination.page - 1) * pagination.page_size
    ).limit(pagination.page_size))
    leagues = result.scalars().all()
    
    total_result = await db.execute(func.count(League.id))
    total = total_result.scalar()
    
    return PaginatedResponse(
        items=leagues,
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
        total_pages=ceil(total / pagination.page_size)
    )
```

---

## Data Management

### Season Data Loading (MVP Decision)

**Decision**: Season data loaded from Jolpica API on first admin setup.

**Flow**:
1. Application starts
2. Checks for admin account in database
3. If admin doesn't exist, creates from environment variables
4. Once admin successfully logs in, triggers season data sync
5. Jolpica API pulls all circuits, drivers, races, seasons for current year
6. Data stored in PostgreSQL

**Implementation**:
```python
async def initialize_application(db: AsyncSession):
    """
    Initialize application on startup.
    
    Creates admin account if needed and triggers data sync.
    """
    # Check if admin exists
    admin_result = await db.execute(
        select(User).where(User.username == settings.ADMIN_USERNAME)
    )
    admin = admin_result.scalar_one_or_none()
    
    if not admin:
        # Create admin
        admin = User(
            username=settings.ADMIN_USERNAME,
            email="admin@fantasyf1.com",
            is_admin=True
        )
        admin.set_password(settings.ADMIN_PASSWORD)
        db.add(admin)
        await db.commit()
        await db.refresh(admin)
        
        logger.info(f"Admin account created: {admin.username}")
    
    # Check if season data exists
    current_year = datetime.now().year
    season_result = await db.execute(
        select(Race).where(Race.season == current_year).limit(1)
    )
    has_season_data = season_result.scalar_one_or_none() is not None
    
    if not has_season_data:
        logger.info(f"No data for {current_year}, triggering sync...")
        
        # Trigger background task to sync data
        sync_season_data_task.delay(current_year)
```

### Nightly Data Checks (MVP Decision)

**Decision**: Nightly validation checks for data inconsistencies, logs discrepancies, supports manual admin refresh.

**Scope**:
- Validates current season race, circuit, and driver data
- Validates race results for previous 2 races only (not all historical data)
- Logs discrepancies to application logs
- Provides endpoint for admin to trigger manual refresh

**Not Included**:
- Automatic data correction without admin approval
- User notifications of corrections
- Bulk historical data validation

**Implementation**: See Jolpica API integration document.

### Manual Data Entry Fallback (MVP Decision)

**Decision**: Admin can manually enter race results if Jolpica API is unavailable.

**Use Case**:
- Jolpica API down for extended period
- API format changes breaking integration
- Data discrepancies requiring manual correction

**Implementation**:
```python
# Admin-only endpoint
@router.post("/admin/races/{race_id}/results", response_model=RaceResult)
async def manual_enter_race_result(
    race_id: int,
    result_data: RaceResultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Manually enter race result (admin only)."""
    # Validate admin权限
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Create or update race result
    # Bypass Jolpica API sync
    
    race_result = RaceResult(
        race_id=race_id,
        driver_id=result_data.driver_id,
        position=result_data.position,
        points=result_data.points,
        status=result_data.status,
        has_fastest_lap=result_data.has_fastest_lap
    )
    
    db.add(race_result)
    await db.commit()
    await db.refresh(race_result)
    
    logger.info(
        f"Admin {current_user.username} manually entered result for "
        f"race {race_id}, driver {result_data.driver_id}"
    )
    
    return race_result
```

---

## Performance & Monitoring

### Performance Benchmarks (Explicitly Out of Scope)

**Status**: No performance benchmarking in MVP.

**Rationale**:
- MVP focuses on functionality
- Performance can be optimized later
- PostgreSQL + FastAPI should suffice for MVP scale

**Future Implementation**:
- API response time monitoring
- Database query profiling
- Load testing
- Performance alerts

### Monitoring (MVP Decision)

**Decision**: Basic logging only. No comprehensive monitoring stack.

**Implementation**:
- Structured JSON logging
- Application logs via Docker
- Database query logging in development
- Error tracking optional (Sentry)

**Not Included**:
- Metrics collection (Prometheus)
- Dashboards (Grafana)
- APM (Application Performance Monitoring)

### Error Handling (MVP Decision)

**Decision**: Global exception handler with standardized error responses.

**Implementation**:
```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected error occurred",
            "type": type(exc).__name__
        }
    )
```

---

## Future Considerations

### Post-MVP Enhancements

These features are planned for post-MVP development:

#### Short-Term (Post-MVP)

1. **Password Reset**: Email-based password recovery
2. **Notifications**: Draft alerts, score updates, league invitations
3. **Draft Time Limits**: Per-pick time limits with auto-picks
4. **Snake Draft Method**: Alternative draft order method

#### Medium-Term

1. **Late Joiner Support**: Join mid-season with special rules
2. **WebSockets**: Real-time draft and scoring updates
3. **Advanced League Settings**: Custom scoring systems, transfer windows
4. **Performance Monitoring**: Prometheus + Grafana integration

#### Long-Term

1. **AI-Powered Draft Recommendations**: ML-based driver suggestions
2. **Social Features**: Chat, forums, user profiles
3. **Mobile Push Notifications**: Native mobile app
4. **Advanced Analytics**: Driver performance trends, predictive models

### Design Principles for Future Development

1. **Extensibility First**: Design APIs and data models to support future features
2. **Backward Compatibility**: Ensure new features don't break existing functionality
3. **Configuration Over Code**: Use settings to enable/disable features
4. **Feature Flags**: Support gradual rollout of new features

### Technical Debt Tracking

Track areas that need improvement post-MVP:

1. **Database indexes**: Add more indexes as query patterns emerge
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Query optimization**: Review and optimize slow queries
4. **Code organization**: Refactor services as they grow complex

---

## Decision Summary

### Explicitly Decided for MVP

| Area | Decision | Rationale |
|------|----------|-----------|
| Admin Setup | Environment variables | Simpler deployment |
| Notifications | Out of scope | Focus on core mechanics |
| Draft Time Limits | Out of scope | Complexity trade-off |
| Auto-Picks | Out of scope | Complexity trade-off |
| Late Joiners | Out of scope | Scoring complexity |
| Snake Draft | Out of scope | Sequential sufficient |
| Password Reset | Out of scope | Admin can reset manually |
| Postponed Races | Out of scope | Rare occurrence |
| Performance Benchmarks | Out of scope | Functionality first |
| Monitoring | Basic logging only | Minimize infrastructure |

### Designed for Future

| Feature | Design Consideration |
|---------|---------------------|
| Draft Time Limits | `pick_duration_seconds` field in DraftOrder |
| Auto-Picks | `auto_pick_strategy` field in League |
| Notifications | Database model exists, service stubbed |
| WebSockets | Authentication and security designed |
| Snake Draft | Method field in DraftOrder |
| Multi-League | Independent draft windows per league |

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-09 | Project Lead | Initial MVP gaps and decisions documentation |