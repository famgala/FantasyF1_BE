# Race Details API Summary

## API Endpoint

### Dynamic Season URL
- **Base URL**: `https://api.jolpi.ca/ergast/f1/{season}/races/`
- **Method**: GET
- **Parameter**: `{season}` - Replace with the desired season year (e.g., 2025, 2024, 2023)
- **Returns**: Complete race schedule and circuit information for the specified F1 season

### Implementation Notes
The endpoint is designed to be **season-agnostic**. While this documentation uses 2025 as an example, the actual application implementation will:

1. **Determine the active season** dynamically based on:
   - Current year during normal operations
   - User-selected season for historical data
   - Configuration settings for season management

2. **Support multiple seasons** by:
   - Storing race data for multiple years in the database
   - Allowing users to view/select different seasons
   - Providing historical data analysis features

3. **Example dynamic calls**:
   ```python
   # Current season
   current_year = datetime.now().year
   url = f"https://api.jolpi.ca/ergast/f1/{current_year}/races/"
   
   # Specific season (e.g., 2024 for previous season data)
   url = "https://api.jolpi.ca/ergast/f1/2024/races/"
   
   # Future season (e.g., 2026 if data is available)
   url = "https://api.jolpi.ca/ergast/f1/2026/races/"
   ```

## Response Structure

The API returns a JSON response with the following hierarchical structure:

```
MRData
├── xmlns
├── series (always "f1")
├── url (API endpoint called)
├── limit (pagination limit)
├── offset (pagination offset)
├── total (total number of races)
└── RaceTable
    ├── season
    └── Races (array of race objects)
```

## Race Object Fields

Each race in the `Races` array contains the following fields:

### Basic Race Information
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `season` | String | Year of the season | "2025" |
| `round` | String | Race number in the season | "1" |
| `url` | String | Wikipedia link to the race | "https://en.wikipedia.org/wiki/2025_Australian_Grand_Prix" |
| `raceName` | String | Full name of the race | "Australian Grand Prix" |
| `date` | String | Race date (YYYY-MM-DD) | "2025-03-16" |
| `time` | String | Race start time (UTC, HH:MM:SSZ) | "04:00:00Z" |

### Circuit Information
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `Circuit.circuitId` | String | Unique circuit identifier | "albert_park" |
| `Circuit.url` | String | Wikipedia link to circuit | "https://en.wikipedia.org/wiki/Albert_Park_Circuit" |
| `Circuit.circuitName` | String | Full circuit name | "Albert Park Grand Prix Circuit" |
| `Circuit.Location.lat` | String | Latitude coordinate | "-37.8497" |
| `Circuit.Location.long` | String | Longitude coordinate | "144.968" |
| `Circuit.Location.locality` | String | City name | "Melbourne" |
| `Circuit.Location.country` | String | Country name | "Australia" |

### Session Information (Optional)
Each race may include various session objects. **Note**: Not all sessions are present for every race (e.g., Sprint weekends have different structure).

| Field | Type | Structure | Example |
|-------|------|-----------|---------|
| `FirstPractice` | Object (optional) | `{ date, time }` | Practice 1 session |
| `SecondPractice` | Object (optional) | `{ date, time }` | Practice 2 session |
| `ThirdPractice` | Object (optional) | `{ date, time }` | Practice 3 session |
| `Qualifying` | Object | `{ date, time }` | Qualifying session |
| `Sprint` | Object (optional) | `{ date, time }` | Sprint race (Sprint weekends only) |
| `SprintQualifying` | Object (optional) | `{ date, time }` | Sprint qualifying (Sprint weekends only) |

## 2025 Season Overview

- **Total Races**: 24
- **Season Start**: March 16, 2025 (Australian Grand Prix)
- **Season End**: December 7, 2025 (Abu Dhabi Grand Prix)
- **Sprint Weekends**: 6 races (China, Miami, Belgium, USA, São Paulo, Qatar)

## Fields Needed for Fantasy F1 Application

Based on our application requirements, the following fields are essential:

### ✅ Required Fields

#### Core Race Data
1. **`season`** - For filtering by season
2. **`round`** - For race ordering and identification
3. **`raceName`** - Display purposes
4. **`date`** - Scheduling and deadlines
5. **`time`** - Scheduling and deadlines

#### Circuit Information
6. **`Circuit.circuitId`** - Unique reference for circuits
7. **`Circuit.circuitName`** - Display purposes
8. **`Circuit.Location.country`** - Regional categorization
9. **`Circuit.Location.locality`** - Display purposes

#### Session Schedules
10. **`Qualifying`** - Qualifying session scheduling (critical for lineup deadlines - users must submit lineups before qualifying begins)
11. **`Sprint`** - Sprint race scheduling (important for fantasy scoring - sprint races award points)
12. **`SprintQualifying`** - Sprint qualifying scheduling (important for fantasy scoring)

### ❌ Optional/Low Priority Fields

These fields can be stored but are not critical for core functionality:

- **`FirstPractice`** - Practice sessions (not needed for Fantasy F1)
- **`SecondPractice`** - Practice sessions (not needed for Fantasy F1)
- **`ThirdPractice`** - Practice sessions (not needed for Fantasy F1)
- **`url`** (race and circuit) - Only needed for linking to external resources
- **`Circuit.Location.lat`** / **`Circuit.Location.long`** - Coordinates (not needed for Fantasy F1)
- **`Circuit.url`** - Only needed for external references
- **`xmlns`**, **`series`**, **`limit`**, **`offset`**, **`total`** - API metadata, useful for pagination but not core data

## Important Notes

1. **Time Format**: All times are in UTC (indicated by 'Z' suffix)
2. **Sprint Weekends**: Some races have sprint format with different session structure (6 in 2025)
3. **Variable Sessions**: Second and Third Practice are not present on all weekends (e.g., Sprint format)
4. **Pagination**: The API supports pagination with `limit` and `offset` parameters
5. **Unique Identifiers**: `circuitId` provides stable references to circuits across seasons

## Data Model Recommendations

For our database schema, consider:

1. **Race Entity**: Store core race info with foreign key to Circuit
2. **Circuit Entity**: Normalize circuit data to avoid duplication
3. **Session Entity**: Store Qualifying and Sprint sessions in a normalized structure (practice sessions not needed)
4. **Time Handling**: Store all times in UTC and convert to user's timezone at display time
5. **Sprint Flag**: Add a boolean field to identify sprint weekends for special logic

## Sample Race Data Processing

```python
# Example of extracting essential fields for Fantasy F1
def process_race_data(race):
    return {
        'season': race['season'],
        'round': race['round'],
        'race_name': race['raceName'],
        'date': race['date'],
        'time': race['time'],
        'circuit': {
            'id': race['Circuit']['circuitId'],
            'name': race['Circuit']['circuitName'],
            'country': race['Circuit']['Location']['country'],
            'locality': race['Circuit']['Location']['locality']
        },
        'is_sprint': 'Sprint' in race,
        'sessions': {
            'qualifying': race.get('Qualifying'),
            'sprint': race.get('Sprint'),
            'sprint_qualifying': race.get('SprintQualifying')
        }
    }    }
