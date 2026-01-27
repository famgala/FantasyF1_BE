# Loading Components - AI Agent Documentation

## Overview
This directory contains reusable loading and skeleton screen components for the Fantasy F1 frontend application. These components provide visual feedback during data loading states and improve user experience.

## Components

### 1. SkeletonLoader (Base Component)
**File:** `SkeletonLoader/SkeletonLoader.tsx`

The base skeleton component that provides a shimmering animation effect for placeholder content.

**Props:**
- `className?: string` - Optional CSS class name for custom styling
- `width?: string` - Optional width (e.g., "100%", "200px")
- `height?: string` - Optional height (e.g., "100%", "50px")
- `variant?: 'default' | 'text' | 'circular' | 'rounded'` - Visual variant of the skeleton

**Usage Example:**
```tsx
import { SkeletonLoader } from '../../components/loading';

<SkeletonLoader width="100%" height="40px" variant="rounded" />
```

### 2. LoadingSpinner
**File:** `LoadingSpinner/LoadingSpinner.tsx`

A circular loading spinner for indicating loading states.

**Props:**
- `size?: 'small' | 'medium' | 'large'` - Size of the spinner (default: 'medium')
- `className?: string` - Optional CSS class name

**Usage Example:**
```tsx
import { LoadingSpinner } from '../../components/loading';

<LoadingSpinner size="large" />
```

### 3. CardSkeleton
**File:** `CardSkeleton/CardSkeleton.tsx`

A pre-configured skeleton for card-shaped content.

**Props:**
- `className?: string` - Optional CSS class name

**Usage Example:**
```tsx
import { CardSkeleton } from '../../components/loading';

<CardSkeleton />
```

### 4. TableSkeleton
**File:** `TableSkeleton/TableSkeleton.tsx`

A pre-configured skeleton for table-based content displaying driver and grid information.

**Props:**
- `rows?: number` - Number of rows to display (default: 5)
- `className?: string` - Optional CSS class name

**Usage Example:**
```tsx
import { TableSkeleton } from '../../components/loading';

<TableSkeleton rows={5} />
```

### 5. ListSkeleton
**File:** `ListSkeleton/ListSkeleton.tsx`

A pre-configured skeleton for list-based content displaying grid items.

**Props:**
- `count?: number` - Number of items to display (default: 6)
- `className?: string` - Optional CSS class name

**Usage Example:**
```tsx
import { ListSkeleton } from '../../components/loading';

<ListSkeleton count={12} />
```

### 6. LoadingOverlay
**File:** `LoadingOverlay/LoadingOverlay.tsx`

A full-screen or container overlay with a loading spinner.

**Props:**
- `show: boolean` - Whether to show the overlay
- `message?: string` - Optional loading message
- `transparent?: boolean` - Whether the overlay should be transparent

**Usage Example:**
```tsx
import { LoadingOverlay } from '../../components/loading';

<LoadingOverlay show={true} message="Loading drivers..." />
```

## Integration Status

The loading components have been successfully integrated into the following pages:

### Completed Integration:
1. ✅ **DashboardPage** - CardSkeleton for league cards, QuickStats skeleton for stats
2. ✅ **LeagueDashboardPage** - CardSkeleton for overview cards, TableSkeleton for standings list
3. ✅ **LeagueStandingsPage** - TableSkeleton for standings table and league tables
4. ✅ **DraftRoomPage** - ListSkeleton for driver lists, CardSkeleton for draft components
5. ✅ **RaceCalendarPage** - CardSkeleton for page header, ListSkeleton for race grid
6. ✅ **AdminDashboardPage** - Multiple CardSkeleton instances for stats and leagues
7. ✅ **LeagueSettingsPage** - CardSkeleton for settings form skeleton
8. ✅ **LeagueInvitationsPage** - CardSkeleton for invitations list skeleton
9. ✅ **TeamRosterPage** - CardSkeleton for team overview, ListSkeleton for drivers
10. ✅ **RaceResults** - TableSkeleton for results table
11. ✅ **ScoringPage** - CardSkeleton for scoring overview
12. ✅ **DriverListPage** - CardSkeleton for header/filter, ListSkeleton for driver grid

## Design Guidelines

### Color Scheme
- Primary skeleton color: `#e0e0e0`
- Shimmer animation: `#f0f0f0` to `#e0e0e0`
- Overlay background: `rgba(255, 255, 255, 0.9)` (transparent: `rgba(255, 255, 255, 0.7)`)

### Animation
- Skeleton shimmer animation: 1.5s infinite linear
- Spinner animation: 0.8s infinite linear

### Spacing
- Card gap: 20px
- Row height: 40px
- Padding: 16px

## Best Practices

1. **Use appropriate loading states:**
   - Use `CardSkeleton` for card-based layouts (leagues, stats)
   - Use `TableSkeleton` for table-based content (standings, results)
   - Use `ListSkeleton` for grid-based content (drivers, races)
   - Use `LoadingSpinner` for button or inline loading states
   - Use `LoadingOverlay` for full-page or major section loading

2. **Match the actual content dimensions:**
   - Skeletons should match the approximate size of the actual content
   - This minimizes layout shifts when content loads

3. **Provide meaningful feedback:**
   - Use `LoadingOverlay` with a message for long operations
   - Keep loading states short and responsive

4. **Accessibility:**
   - Ensure loading states are announced to screen readers
   - Use `aria-busy="true"` on loading containers

5. **Performance:**
   - Skeletons are lightweight and should not impact performance
   - Prefer skeleton screens over full page loaders when possible

## Testing

All loading components should be tested with:
- Component rendering
- Prop variations
- Animation behavior
- Responsive behavior

## Future Enhancements

Potential future improvements:
- Additional skeleton variants (avatar, button, etc.)
- Customization options for colors and animations
- Lazy loading skeleton support
- Integration with error boundaries
- Progress indicators for multi-step loading

## Related Documentation

- PRD: User Story "Loading States and Skeleton Screens"
- Progress: See `progress.txt`
- Backend API: Data loading endpoint documentation
