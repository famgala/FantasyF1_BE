# Draft Components - AGENTS.md

## Overview
Draft-related components for the Fantasy F1 application. These components handle real-time draft room functionality including driver selection, draft order tracking, and timing.

## Components

### DraftTimer
**Purpose:** Displays countdown timer for draft opening/closing and turn-based timing.

**Key Features:**
- Displays time until draft opens - Orange warning banner
- Shows current picker's remaining time countdown
- Expiration alerts
- Draft status indicators (UPCOMING, OPEN, CLOSED, COMPLETE)

**Props:**
- `status`: Draft status ("UPCOMING" | "OPEN" | "CLOSED" | "COMPLETE")
- `opensAt`: ISO timestamp when draft opens (optional)
- `closesAt`: ISO timestamp when draft closes (optional)
- `isMyTurn`: Boolean indicating if it's the current user's turn

**State Management:**
- Uses `useEffect` to update timer every second
- Calculates time remaining from ISO timestamps
- Auto-upsdates component on tick

**API Dependencies:**
- None directly - receives timestamps as props from parent

**Usage Pattern:**
```tsx
<DraftTimer
  status={draftData.status.status}
  opensAt={draftData.status.opens_at}
  closesAt={draftData.status.closes_at}
  isMyTurn={draftData.status.is_my_turn}
/>
```

**Learning Notes:**
- Uses `setInterval` for countdown - must clean up on unmount
- Timestamp parsing requires robust handling of null/undefined
- Color coding (orange for upcoming, green for active turn) provides immediate visual feedback

---

### DriverSelectionCard
**Purpose:** Individual driver card for selection during draft.

**Key Features:**
- Displays driver info (number, name, team, country)
- Shows stats (price, total points, average points, recent results)
- Expandable details section via accordion
- Visual selection state
- Disabled state for already-drafted drivers
- Draft confirmation interaction

**Props:**
- `driver`: Driver object with all driver information
- `selected`: Boolean - whether this driver is currently selected
- `disabled`: Boolean - whether selection is disabled
- `expanded`: Boolean - whether card is expanded
- `onSelect`: Callback when user selects driver
- `onToggle`: Callback when user toggles card expansion

**State Management:**
- Local state for financial calculations
- Receives all display data via props
- Controlled component (parent manages expansion state)

**API Dependencies:**
- None - displays static data passed via props

**Usage Pattern:**
```tsx
<DriverSelectionCard
  driver={driver}
  selected={selectedDriver === driver.id}
  disabled={!canSelect || isDrafted}
  expanded={expandedDriver === driver.id}
  onSelect={() => handleSelectDriver(driver.id)}
  onToggle={() => setExpandedDriver(
    expandedDriver === driver.id ? null : driver.id
  )}
/>
```

**Learning Notes:**
- Accordion pattern: always expand one at a time (null or ID)
- disabled state must prevent all interactions
- Visual feedback (color, opacity, border) indicates selection status
- Recent results show performance trend for decision-making

---

### DraftOrderList
**Purpose:** Shows draft order with picks and current picker indicator.

**Key Features:**
- Displays all draft participants in order
- Shows current picker with visual indicator
- Highlights current user's position
- Legend for status indicators
- Real-time updates via polling

**Props:**
- `participants`: Array of DraftParticipant objects
- `currentDraftIndex`: Index of current picker in the array
- `isMyTurn`: Boolean indicating user's turn status
- `userId`: Current user's ID for "you" badge

**State Management:**
- No local state - displays data from props
- Parent component manages polling and updates

**API Dependencies:**
- None - receives data via props from parent

**Usage Pattern:**
```tsx
<DraftOrderList
  participants={draftParticipants}
  currentDraftIndex={draftData.draft_order.findIndex(
    (order) => order.is_current_picker
  )}
  isMyTurn={isMyTurn}
  userId={user?.id}
/>
```

**Learning Notes:**
- Visual hierarchy: current picker green, completed picks primary color
- "You" badge helps users quickly identify their position
- Pulsing animation on "YOUR TURN" indicator draws attention
- Sticky positioning keeps draft order visible during long scrolls

---

## Services

### draftService.ts
**Purpose:** API service for draft-related operations.

**Key Functions:**
- `getDraftRoom(leagueId, raceId)`: Fetch full draft room data
- `makePick(leagueId, raceId, driverId)`: Submit driver selection
- `getDraftStatus(leagueId, raceId)`: Get draft status info
- `getDraftHistory(leagueId, raceId)`: Get completed draft picks

**API Endpoints:**
- `GET /leagues/{leagueId}/races/{raceId}/draft` - Full room data
- `POST /leagues/{leagueId}/races/{raceId}/picks` - Submit pick
- `GET /leagues/{leagueId}/races/{raceId}/draft/status` - Status only
- `GET /leagues/{leagueId}/races/{raceId}/draft/history` - History

**Data Models:**
- `Driver`: Driver info with stats and recent results
- `ConstructorPick`: Complete pick information
- `DraftOrderConstructor`: Draft order by constructor
- `DraftParticipant`: Draft participant with selected driver
- `DraftStatus`: Draft timing and status
- `DraftRoomData`: Complete draft room data

**Usage Pattern:**
```typescript
import { getDraftRoom, makePick, Driver } from './draftService';

// Fetch draft room
const draftData = await getDraftRoom(leagueId, raceId);

// Make a pick
const pick = await makePick(leagueId, raceId, driverId);
```

**Learning Notes:**
- All functions use centralized api client with auth
- Type definitions ensure type safety
- Status endpoint is lighter for frequent polling
- History endpoint is for completed drafts only

---

## Page Components

### DraftRoomPage
**Purpose:** Main draft room page combining all draft components.

**Key Features:**
- Real-time draft room state updates (10s polling)
- Driver filtering (search by name, filter by team)
- Turn-based pick submission
- Draft order sidebar
- Status banner when draft not open
- Submission loading overlay

**Route:** `/leagues/:leagueId/races/:raceId/draft`

**State Management:**
- `draftData`: Complete draft room state
- `loading`, `error`: UI state
- `selectedDriver`: Currently selected driver ID
- `expandedDriver`: Currently expanded card ID
- `filterTeam`: Team filter state
- `filterSearch`: Search text state
- `isSubmitting`: Pick submission state

**Dependencies:**
- `useAuth`: For current user context
- `getDraftRoom`: Fetch draft room data
- `makePick`: Submit driver selection
- Child components: DraftTimer, DriverSelectionCard, DraftOrderList

**API Calls:**
- `getDraftRoom` on mount and every 10 seconds (polling)
- `makePick` when user selects driver

**Usage Pattern:**
```tsx
const { leagueId, raceId } = useParams();
const [draftData, setDraftData] = useState(null);

useEffect(() => {
  fetchDraftRoom();
  const interval = setInterval(fetchDraftRoom, 10000);
  return () => clearInterval(interval);
}, [fetchDraftRoom]);
```

**Learning Notes:**
- Polling interval (10s) balances real-time needs and performance
- Filters are applied client-side for immediate feedback
- Only the current picker can select (enforced in UI and API)
- Overlay prevents double-submission during API call
- Convert `DraftOrderConstructor` to `DraftParticipant` for consistency

---

## Common Patterns

### Polling Pattern
```tsx
const fetchDraftRoom = useCallback(async () => {
  const data = await getDraftRoom(leagueId, raceId);
  setDraftData(data);
}, [leagueId, raceId]);

useEffect(() => {
  fetchDraftRoom();
  const interval = setInterval(fetchDraftRoom, 10000);
  return () => clearInterval(interval);
}, [fetchDraftRoom]);
```

### Accordion Pattern
```tsx
<DriverSelectionCard
  expanded={expandedDriver === driver.id}
  onToggle={() => setExpandedDriver(
    expandedDriver === driver.id ? null : driver.id
  )}
/>
```

### Filter Pattern
```tsx
const filteredDrivers = drivers.filter((driver) => {
  if (filterTeam !== "all" && driver.team !== filterTeam) return false;
  if (filterSearch &&
      !driver.name.toLowerCase().includes(filterSearch.toLowerCase())) 
    return false;
  return true;
});
```

### Preventing Double-Submit
```tsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  if (isSubmitting) return;  // Guard
  setIsSubmitting(true);
  try {
    await apiCall();
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## Backend Requirements

### API Endpoints Needed
```
GET    /leagues/{leagueId}/races/{raceId}/draft
POST   /leagues/{leagueId}/races/{raceId}/picks
GET    /leagues/{leagueId}/races/{raceId}/draft/status
GET    /leagues/{leagueId}/races/{raceId}/draft/history
```

### Data Models Expected
**DraftRoomData:**
```json
{
  "race_id": 1,
  "race_name": "British Grand Prix",
  "circuit": "Silverstone",
  "race_date": "2026-07-06",
  "league_id": 1,
  "league_name": "My F1 League",
  "draft_order": [
    {
      "constructor_id": 1,
      "constructor_name": "Mercedes AMG Petronas",
      "user_id": 1,
      "username": "john_doe",
      "picks": [],
      "is_current_picker": true
    }
  ],
  "available_drivers": [],
  "drafted_drivers": [],
  "status": {
    "status": "OPEN",
    "opens_at": "2026-07-06T12:00:00Z",
    "closes_at": "2026-07-06T12:30:00Z",
    "current_picker": null,
    "is_my_turn": true,
    "my_picks": []
  }
}
```

**Make Pick Request:**
```json
{
  "driver_id": 1
}
```

---

## Testing Considerations

### Unit Tests
- DraftTimer countdown accuracy and timezone handling
- DriverSelectionCard selection/toggle callbacks
- Filter logic with edge cases (empty search, no matches)
- Polling interval cleanup on unmount

### Integration Tests
- Draft room loads with correct data
- Successful pick submission updates UI
- Filter changes update displayed drivers
- Navigation to draft room with valid/invalid IDs

### E2E Tests
- Complete draft flow from start to finish
- Multiple users picking in sequence
- Timer expiration behavior
- Draft closure handling

---

## Performance Optimizations

1. **Polling Optimization**: Consider WebSocket for real-time updates in production
2. **Memoization**: Driver cards can be memoized if drivers don't change between polls
3. **Lazy Loading**: Driver stats/details could be loaded on expand vs. all upfront
4. **Debouncing**: Search filter could be debounced for large driver lists

---

## Known Issues & Edge Cases

1. **Browser Tab Inactive**: Polling may be throttled when tab is inactive - use visibility API
2. **Network Lag**: Fast back-to-back picks could cause race conditions - add optimistic UI updates
3. **Timer Sync**: Server time vs. client time difference could cause display issues - use server timestamp
4. **Mobile View**: Draft order sidebar takes significant space - consider collapsible or bottom sheet on mobile

---

## Future Enhancements

1. **WebSocket Integration**: Replace polling with real-time socket connection
2. **Draft Chat**: Add real-time chat during draft
3. **Auto-Pick Queue**: Allow users to queue preferred drivers if they miss their turn
4. **Draft Analysis**: Show projected picks, value proposition, AI suggestions
5. **Draft Replay**: Ability to review completed drafts step-by-step
6. **Export/Share**: Share draft results or export to CSV/PDF

---

Last Updated: 2026-01-25
