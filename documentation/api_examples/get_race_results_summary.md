# Race Results API Summary

**API Endpoint:** `GET https://api.jolpi.ca/ergast/f1/{year}/{round}/results/`

**Purpose:** Fetches official race results for a specific race, including positions, points, DNF status, and driver-team mappings.

**CRITICAL FOR MVP**: This is the MOST IMPORTANT endpoint for the Fantasy F1 app. It provides:
- Actual race positions and points earned
- Driver-team mappings (links drivers to their constructors)
- DNF/Retired status for each driver
- Grid positions and lap data

---

## API Response Structure

```json
{
  "MRData": {
    "xmlns": "",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2025/1/results/",
    "limit": "30",
    "offset": "0",
    "total": "20",
    "RaceTable": {
      "season": "2025",
      "round": "1",
      "Races": [
        {
          "season": "2025",
          "round": "1",
          "url": "https://en.wikipedia.org/wiki/2025_Australian_Grand_Prix",
          "raceName": "Australian Grand Prix",
          "Circuit": { ... },
          "date": "2025-03-16",
          "time": "04:00:00Z",
          "Results": [
            {
              "number": "4",
              "position": "1",
              "positionText": "1",
              "points": "25",
              "Driver": { "driverId": "norris", "permanentNumber": "4", "code": "NOR", ... },
              "Constructor": { "constructorId": "mclaren", "name": "McLaren", ... },
              "grid": "1",
              "laps": "57",
              "status": "Finished",
              "Time": { "millis": "6126304", "time": "1:42:06.304" },
              "FastestLap": { "rank": "1", "lap": "43", "Time": { "time": "1:22.167" } }
            },
            ...
          ]
        }
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
| `url` | string | API endpoint URL | `"https://api.jolpi.ca/ergast/f1/2025/1/results/"` |
| `limit` | string | Maximum results per page | `"30"` |
| `offset` | string | Pagination offset | `"0"` |
| `total` | string | Total number of results (drivers) | `"20"` |

### RaceTable

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `season` | string | Season year | `"2025"` |
| `round` | string | Race round number | `"1"` |
| `Races` | array | Array of race objects | See below |

### Race Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `season` | string | Season year | `"2025"` |
| `round` | string | Race round number | `"1"` |
| `raceName` | string | Grand Prix name | `"Australian Grand Prix"` |
| `Circuit` | object | Circuit details | Refer to circuits API |
| `date` | string | Race date (YYYY-MM-DD) | `"2025-03-16"` |
| `time` | string | Race start time (UTC) | `"04:00:00Z"` |
| `Results` | array | Array of result objects | See below |

### Result Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `number` | string | Driver's car number | `"4"` |
| `position` | string | Final finishing position (1-20) | `"1"` |
| `positionText` | string | Position text (number or "R" for retired) | `"1"` or `"R"` |
| `points` | string | Championship points earned | `"25"` |
| `grid` | string | Starting grid position | `"1"` |
| `laps` | string | Number of laps completed | `"57"` |
| `status` | string | Race status ("Finished" or "Retired") | `"Finished"` |
| `Driver` | object | Driver information | See below |
| `Constructor` | object | Constructor/team information | See below |
| `Time` | object | Race time (null for winners) | See below |
| `FastestLap` | object | Fastest lap details | See below |

### Driver Object (within Result)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `driverId` | string | Unique driver identifier | `"norris"` |
| `permanentNumber` | string | Driver's permanent number | `"4"` |
| `code` | string | 3-letter abbreviation | `"NOR"` |
| `givenName` | string | First name | `"Lando"` |
| `familyName` | string | Last name | `"Norris"` |
| `dateOfBirth` | string | Birth date (YYYY-MM-DD) | `"1999-11-13"` |
| `nationality` | string | Driver nationality | `"British"` |
| `url` | string | Wikipedia link | `"http://en.wikipedia.org/wiki/Lando_Norris"` |

### Constructor Object (within Result) - CRITICAL FOR DRIVER-TEAM MAPPING

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `constructorId` | string | Unique constructor identifier | `"mclaren"` |
| `name` | string | Full constructor name | `"McLaren"` |
| `nationality` | string | Constructor nationality | `"British"` |
| `url` | string | Wikipedia link | `"https://en.wikipedia.org/wiki/McLaren"` |

**IMPORTANT**: This is the PRIMARY way to determine which team each driver drives for!

### Time Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `millis` | string | Time difference from winner in milliseconds | `"6127199"` |
| `time` | string | Time difference format | `"+0.895"` (for winner: `"1:42:06.304"`) |

### FastestLap Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `rank` | string | Rank of fastest lap (1 = fastest) | `"1"` |
| `lap` | string | Lap number when fastest lap was set | `"43"` |
| `Time` | object | Lap time | `{ "time": "1:22.167" }` |

---

## Example Results - Australian Grand Prix 2025 (Round 1)

| Position | Driver | Team | Grid | Points | Status | Time | fastestLap |
|----------|--------|------|------|--------|--------|------|------------|
| 1 | Lando Norris | McLaren | 1 | 25 | Finished | 1:42:06.304 | 1:22.167 (rank 1) |
| 2 | Max Verstappen | Red Bull | 3 | 18 | Finished | +0.895 | 1:23.081 (rank 3) |
| 3 | George Russell | Mercedes | 4 | 15 | Finished | +8.481 | 1:25.065 (rank 11) |
| 4 | Andrea Kimi Antonelli | Mercedes | 16 | 12 | Finished | +10.135 | 1:24.901 (rank 9) |
| 5 | Alexander Albon | Williams | 6 | 10 | Finished | +12.773 | 1:24.597 (rank 8) |
| 6 | Lance Stroll | Aston Martin | 13 | 8 | Finished | +17.413 | 1:25.538 (rank 14) |
| 7 | Nico Hülkenberg | Sauber | 17 | 6 | Finished | +18.423 | 1:25.243 (rank 12) |
| 8 | Charles Leclerc | Ferrari | 7 | 4 | Finished | +19.826 | 1:25.271 (rank 13) |
| 9 | Oscar Piastri | McLaren | 2 | 2 | Finished | +20.448 | 1:23.242 (rank 4) |
| 10 | Lewis Hamilton | Ferrari | 8 | 1 | Finished | +22.473 | 1:24.218 (rank 7) |
| 11 | Pierre Gasly | Alpine | 9 | 0 | Finished | +26.502 | 1:25.020 (rank 10) |
| 12 | Yuki Tsunoda | RB | 5 | 0 | Finished | +29.884 | 1:24.194 (rank 6) |
| 13 | Esteban Ocon | Haas | 19 | 0 | Finished | +33.161 | 1:26.764 (rank 15) |
| 14 | Oliver Bearman | Haas | 20 | 0 | Finished | +40.351 | 1:27.603 (rank 16) |
| 15 | Liam Lawson** | Red Bull | 18 | 0 | Retired (46/57 laps) | - | 1:22.970 (rank 2) |
| 16 | Gabriel Bortoleto | Sauber | 15 | 0 | Retired (45/57 laps) | - | 1:24.192 (rank 5) |
| 17 | Fernando Alonso | Aston Martin | 12 | 0 | Retired (32/57 laps) | - | 1:28.819 (rank 17) |
| 18 | Carlos Sainz | Williams | 10 | 0 | Retired (0 laps) | - | - |
| 19 | Jack Doohan | Alpine | 14 | 0 | Retired (0 laps) | - | - |
| 20 | Isack Hadjar | RB | 11 | 0 | Retired (0 laps) | - | - |

**Key Observations:**
- Hamilton driving for Ferrari (confirmed from driver docs)
- Antonelli at Mercedes (new rookie)
- Lawson at Red Bull (after being reserve)
- 6 retirements (including Sainz, Alonso, Doohan)
- Norris wins with fastest lap (bonus point)

---

## Usage Notes

### When to Use This Endpoint

1. **Calculate Fantasy Points**: Primary source for race positions and points
2. **Update Driver Stats**: Track wins, podiums, DNFs per driver
3. **Driver-Team Mapping**: Link drivers to their constructors
4. **Standings Update**: Update season standings after each race
5. **Race Analysis**: Track performance, DNFs, penalties

### Example Endpoints

```bash
# Get results for a specific race
GET /f1/2025/1/results  # Round 1 (Australian GP)
GET /f1/2025/2/results  # Round 2 (Saudi Arabian GP)

# Get all race results for a season (needs multiple calls)
GET /f1/2025/1/results
GET /f1/2025/2/results
...
GET /f1/2025/24/results
```

---

## Integration Notes

### For Fantasy F1 App - CRITICAL IMPLEMENTATION

**This endpoint is the BACKBONE of the Fantasy F1 app.**

### 1. Driver-Team Mapping

```python
def update_driver_teams():
    """Update driver team_name field using race results."""
    
    # Get first race results of season
    race_results = fetch_race_results(2025, 1)
    
    for result in race_results['Results']:
        driver_id = result['Driver']['driverId']
        constructor_name = result['Constructor']['name']
        
        # Update driver with team name
        driver = db.query(Driver).filter_by(driver_id=driver_id).first()
        if driver:
            driver.team_name = constructor_name
            db.commit()
```

**Important Notes:**
- Driver-team mappings can change mid-season (rare but possible)
- Use latest race results to determine current team
- Backup drivers may appear if regular driver is injured

### 2. Calculating Fantasy Points

```python
def calculate_fantasy_points(result):
    """Calculate fantasy points based on race result."""
    
    points = 0
    
    # Base championship points (for finishing position)
    championship_points = int(result['points'])
    points += championship_points
    
    # Add custom fantasy rules if needed
    # Example: Bonus for fastest lap (already included in championship points)
    if result.get('FastestLap') and result['FastestLap']['rank'] == '1':
        points += 1  # Already in championship points for 2025 F1 rules
    
    # Penalty for DNF
    if result['status'] == 'Retired':
        points -= 5  # Example fantasy rule
    
    return points
```

### 3. Updating Driver Statistics

```python
def update_driver_stats():
    """Update driver wins, podiums, DNFs after each race."""
    
    race_results = fetch_race_results(2025, current_round)
    
    for result in race_results['Results']:
        driver = get_driver(result['Driver']['driverId'])
        
        # Update points
        driver.total_points += int(result['points'])
        
        # Update wins
        if result['position'] == '1':
            driver.wins += 1
        
        # Update podiums
        if result['position'] in ['1', '2', '3']:
            driver.podiums += 1
        
        # Track DNFs (critical for fantasy)
        if result['status'] == 'Retired':
            driver.dnfs += 1
        
        driver.updated_at = datetime.now(timezone.utc)
        db.commit()
```

### 4. Handling DNF Status

```python
def is_dnf(result):
    """Check if driver did not finish race."""
    
    status = result.get('status', '')
    
    # Various DNF indicators
    dnf_indicators = ['Retired', 'Accident', 'Collision', 'Engine', 'Gearbox']
    
    return any(indicator in status for indicator in dnf_indicators)

def get_dnf_drivers(race_results):
    """Get list of drivers who did not finish."""
    
    return [
        result['Driver']['driverId'] 
        for result in race_results 
        if is_dnf(result)
    ]
```

---

## F1 Points System (2025 Rules)

The `points` field uses the standard F1 championship points system:

| Position | Points |
|----------|--------|
| 1st | 25 |
| 2nd | 18 |
| 3rd | 15 |
| 4th | 12 |
| 5th | 10 |
| 6th | 8 |
| 7th | 6 |
| 8th | 4 |
| 9th | 2 |
| 10th | 1 |
| 11th-20th | 0 |

**Additional Points:**
- Fastest lap (if driver finishes in top 10): +1 point (already included in `points` field)

---

## Related API Endpoints

1. **Qualifying Results:**
   ```
   GET /f1/2025/1/qualifying
   ```
   - Returns grid positions and qualifying times

2. **Sprint Race Results (if applicable):**
   ```
   GET /f1/2025/1/sprint
   ```
   - Returns sprint race results (points awarded separately)

3. **Driver Standings:**
   ```
   GET /f1/2025/driverStandings
   ```
   - Returns current championship standings

4. **Constructor Standings:**
   ```
   GET /f1/2025/constructorStandings
   ```
   - Returns team championship standings

---

## Summary

**What This API Provides:**
- ✅ Official race finishing positions (1-20)
- ✅ Championship points earned per driver
- ✅ Driver-team mappings (CRITICAL for linking drivers to teams)
- ✅ Grid positions vs finishing positions
- ✅ DNF/Retired status for each driver
- ✅ Fastest lap information
- ✅ Race time differences
- ✅ Laps completed per driver

**What This API Does NOT Provide:**
- ❌ Qualifying results (use `/f1/{year}/{round}/qualifying`)
- ❌ Sprint results (use `/f1/{year}/{round}/sprint`)
- ❌ Season standings (use `/f1/{year}/driverStandings`)

**CRITICAL FOR MVP:**
This endpoint is ESSENTIAL for the Fantasy F1 app to function. Without it, you cannot:
- Calculate fantasy points
- Update driver statistics
- Determine driver-team mappings
- Track DNFs and retirements
- Update standings and leaderboards

**Recommendation:** Call this endpoint after every race to update all fantasy data. Use it in combination with the schedule API to know when races occur and to poll for results.