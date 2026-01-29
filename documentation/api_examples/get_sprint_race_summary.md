# Sprint Races API Summary

**API Endpoint:** `GET https://api.jolpi.ca/ergast/f1/2025/sprint/`

**Purpose:** Fetches sprint race results for the 2025 F1 season from the Jolpica API.

---

## ⚠️ IMPORTANT: NOT USED IN MVP

**This API endpoint and data structure is documented for future reference only.**
- Sprint races are **NOT implemented** in the MVP
- This documentation should be used when sprint race features are added post-MVP
- Keep this as a reference for future implementation

---

## API Response Structure

The API returns a JSON response with the following structure:

```json
{
  "MRData": {
    "xmlns": "",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2025/sprint/",
    "limit": "30",
    "offset": "0",
    "total": "120",
    "RaceTable": {
      "season": "2025",
      "Races": [
        {
          "season": "2025",
          "round": "2",
          "url": "https://en.wikipedia.org/wiki/2025_Chinese_Grand_Prix",
          "raceName": "Chinese Grand Prix",
          "Circuit": {
            "circuitId": "shanghai",
            "url": "https://en.wikipedia.org/wiki/Shanghai_International_Circuit",
            "circuitName": "Shanghai International Circuit",
            "Location": {
              "lat": "31.3389",
              "long": "121.22",
              "locality": "Shanghai",
              "country": "China"
            }
          },
          "date": "2025-03-23",
          "time": "07:00:00Z",
          "SprintResults": [
            {
              "number": "44",
              "position": "1",
              "positionText": "1",
              "points": "8",
              "Driver": {
                "driverId": "hamilton",
                "permanentNumber": "44",
                "code": "HAM",
                "url": "http://en.wikipedia.org/wiki/Lewis_Hamilton",
                "givenName": "Lewis",
                "familyName": "Hamilton",
                "dateOfBirth": "1985-01-07",
                "nationality": "British"
              },
              "Constructor": {
                "constructorId": "ferrari",
                "url": "https://en.wikipedia.org/wiki/Scuderia_Ferrari",
                "name": "Ferrari",
                "nationality": "Italian"
              },
              "grid": "1",
              "laps": "19",
              "status": "Finished",
              "Time": {
                "millis": "1839965",
                "time": "30:39.965"
              },
              "FastestLap": {
                "rank": "1",
                "lap": "2",
                "Time": {
                  "time": "1:35.399"
                }
              }
            },
            ...
          ]
        },
        ...
      ]
    }
  }
}
```

---

## Field Descriptions

### MRData (Root Object)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `xmlns` | string | XML namespace (empty for JSON) | `""` |
| `series` | string | Series identifier | `"f1"` |
| `url` | string | API endpoint URL | `"https://api.jolpi.ca/ergast/f1/2025/sprint/"` |
| `limit` | string | Maximum results per page | `"30"` |
| `offset` | string | Pagination offset | `"0"` |
| `total` | string | Total number of sprint results | `"120"` |

### RaceTable

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `season` | string | F1 season year | `"2025"` |
| `Races` | array | Array of sprint race objects | See below |

### Sprint Race Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `season` | string | F1 season year | `"2025"` |
| `round` | string | Race round number | `"2"` |
| `raceName` | string | Name of the grand prix | `"Chinese Grand Prix"` |
| `Circuit` | object | Circuit information | See below |
| `date` | string | Race date (YYYY-MM-DD) | `"2025-03-23"` |
| `time` | string | Race time (UTC) | `"07:00:00Z"` |
| `url` | string | Wikipedia link | `"https://en.wikipedia.org/wiki/2025_Chinese_Grand_Prix"` |
| `SprintResults` | object | Array of sprint results | See below |

### Circuit Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `circuitId` | string | Unique circuit identifier | `"shanghai"` |
| `circuitName` | string | Circuit name | `"Shanghai International Circuit"` |
| `Location` | object | Location details | See below |

### Location Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `lat` | string | Latitude | `"31.3389"` |
| `long` | string | Longitude | `"121.22"` |
| `locality` | string | City name | `"Shanghai"` |
| `country` | string | Country name | `"China"` |

### SprintResult Object (per driver)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `number` | string | Driver number | `"44"` |
| `position` | string | Finishing position | `"1"` |
| `positionText` | string | Position text display | `"1"` |
| `points` | string | Points earned | `"8"` |
| `Driver` | object | Driver information | See below |
| `Constructor` | object | Constructor information | See below |
| `grid` | string | Grid/start position | `"1"` |
| `laps` | string | Laps completed | `"19"` |
| `status` | string | Race status | `"Finished"` |
| `Time` | object | Race time information | See below |
| `FastestLap` | object | Fastest lap information | See below |

### Time Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `millis` | string | Time in milliseconds | `"1839965"` |
| `time` | string | Time display | `"30:39.965"` |

### FastestLap Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `rank` | string | Fastest lap rank | `"1"` |
| `lap` | string | Lap number of fastest lap | `"2"` |
| `Time` | object | Lap time | See below |

---

## Sprint Races in 2025 Season

The API shows sprint races at the following events:

| Round | Race Name | Date | Circuit |
|-------|-----------|------|---------|
| 2 | Chinese Grand Prix | 2025-03-23 | Shanghai International Circuit |
| 6 | Miami Grand Prix | 2025-05-04 | Miami International Autodrome |

*Note: Only 2 sprint races shown in sample data, season typically has ~6 sprint races*

---

## Sprint Points System

Based on the API response, sprint points are awarded as follows:

| Position | Points |
|----------|--------|
| 1st | 8 |
| 2nd | 7 |
| 3rd | 6 |
| 4th | 5 |
| 5th | 4 |
| 6th | 3 |
| 7th | 2 |
| 8th | 1 |
| 9th-20th | 0 |

---

## Key Differences from Main Race

1. **Shorter Distance**: Sprint races are ~100km vs ~300km for main race
   - Example: Shanghai sprint 19 laps vs main race 50+ laps
   - Example: Miami sprint 18 laps vs main race 50+ laps

2. **Different Points System**: Sprint uses 8-1 vs main race 25-1

3. **Grid Position**: Starts based on qualifying, not previous race results

4. **Separate Results**: Sprint results are independent from main race results

---

## Data Returned (Sample: Shanghai Sprint 2025)

**Winner:** Lewis Hamilton (Ferrari) - 8 points
**Laps:** 19 laps
**Fastest Lap:** Hamilton (1:35.399)

Top 8 finishers with points:
1. Hamilton (Ferrari) - 8 pts
2. Piastri (McLaren) - 7 pts
3. Verstappen (Red Bull) - 6 pts
4. Russell (Mercedes) - 5 pts
5. Leclerc (Ferrari) - 4 pts
6. Tsunoda (RB) - 3 pts
7. Antonelli (Mercedes) - 2 pts
8. Norris (McLaren) - 1 pt

---

## Future Implementation Notes

When adding sprint race support post-MVP:

1. **Database Schema**: Will need to add sprint-specific result tables
   - `SprintResults` table similar to `RaceResults`
   - Link to existing `Race` and `Driver` models
   - Track sprint-specific fields (grid, sprint time, sprint fastest lap)

2. **Scoring Integration**: Need to determine if sprint points:
   - Add to main season totals
   - Are tracked separately
   - Impact fantasy scoring differently

3. **API Integration**:
   - Call this endpoint to fetch sprint results
   - Sync sprint results with main race data
   - Update driver/constructor standings accordingly

4. **Fantasy Impact**: Consider how sprint results affect:
   - Weekly driver performance
   - Drafting strategy (if drafting per sprint)
   - Overall season points

---

## Related API Endpoints

### Other Sprint Endpoints

1. **Sprint Qualifying Results:**
   ```
   GET /f1/2025/sprint/{round}/qualifying
   ```

2. **Sprint Results by Round:**
   ```
   GET /f1/2025/{round}/sprint
   ```

3. **Sprint Results by Driver:**
   ```
   GET /f1/2025/drivers/{driverId}/sprints
   ```

---

## Summary

**What This API Provides:**
- ✅ Complete sprint race schedule for 2025
- ✅ Detailed results for each sprint (positions, points, times)
- ✅ Circuit information for sprint venues
- ✅ Driver and constructor info for each result
- ✅ Grid positions and lap counts
- ✅ Fastest lap data

**Key Characteristics:**
- Shorter races (~100km, 18-19 laps)
- Different points system (8 points for 1st vs 25 in main race)
- Separate from main race results
- Independent grid based on qualifying

**Current Status:** NOT USED IN MVP - Documented for future reference