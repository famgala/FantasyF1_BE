# Constructors/Teams API Summary

**API Endpoint:** `GET https://api.jolpi.ca/ergast/f1/2025/constructors/`

**Purpose:** Fetches all constructor (team) information for the specified F1 season from the Jolpica API.

**CRITICAL FOR MVP**: This data is essential because the Driver model requires `team_name` field, which is NOT provided by the driver endpoint.

---

## API Response Structure

The API returns a JSON response with the following structure:

```json
{
  "MRData": {
    "xmlns": "",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2025/constructors/",
    "limit": "30",
    "offset": "0",
    "total": "10",
    "ConstructorTable": {
      "season": "2025",
      "Constructors": [
        {
          "constructorId": "alpine",
          "url": "https://en.wikipedia.org/wiki/Alpine_F1_Team",
          "name": "Alpine F1 Team",
          "nationality": "French"
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
| `url` | string | API endpoint URL | `"https://api.jolpi.ca/ergast/f1/2025/constructors/"` |
| `limit` | string | Maximum results per page | `"30"` |
| `offset` | string | Pagination offset | `"0"` |
| `total` | string | Total number of constructors | `"10"` |

### ConstructorTable

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `season` | string | Season year | `"2025"` |
| `Constructors` | array | Array of constructor objects | See below |

### Constructor Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `constructorId` | string | Unique constructor identifier (slug) | `"alpine"` |
| `name` | string | Full constructor name | `"Alpine F1 Team"` |
| `url` | string | Wikipedia link | `"https://en.wikipedia.org/wiki/Alpine_F1_Team"` |
| `nationality` | string | Constructor nationality | `"French"` |

---

## All Constructors in 2025 Season (10 Total)

| constructorId | Team Name | Nationality |
|---------------|-----------|-------------|
| alpine | Alpine F1 Team | French |
| aston_martin | Aston Martin | British |
| ferrari | Ferrari | Italian |
| haas | Haas F1 Team | American |
| mclaren | McLaren | British |
| mercedes | Mercedes | German |
| rb | RB F1 Team | Italian |
| red_bull | Red Bull | Austrian |
| sauber | Sauber | Swiss |
| williams | Williams | British |

---

## Usage Notes

### When to Use This Endpoint

1. **Get Team List**: Fetch all constructors/teams for a season
2. **Team Info**: Get basic team details and nationalities
3. **Driver-Team Mapping**: Use with race results to link drivers to their teams
4. **Reference**: Wikipedia links for detailed team information

### Example Endpoints

```bash
# Get all constructors for a specific season
GET /f1/2025/constructors

# Get constructors without year specification
GET /f1/constructors  # May return all historical constructors

# Get specific constructor within a season
GET /f1/2025/constructors/ferrari
```

---

## Integration Notes

### For Fantasy F1 App

**CRITICAL REQUIREMENT:**
- The Driver model has a mandatory `team_name` field
- The `/f1/2025/drivers` endpoint does NOT provide team information
- This endpoint is REQUIRED to populate `Driver.team_name`

**Recommended Integration Strategy:**

```python
# Step 1: Fetch drivers (no team info)
GET /f1/2025/drivers

# Step 2: Fetch constructors (team info)
GET /f1/2025/constructors

# Step 3: Link drivers to teams using race results
GET /f1/2025/{round}/results
# Returns each driver's constructor for each race

# Alternative: Use driver-constructor endpoint
GET /f1/2025/drivers/{driverId}/constructors
```

**Linking Drivers to Teams:**

The constructor endpoint alone doesn't tell you which driver drives for which team. You have two options:

**Option 1: Use Race Results (Recommended)**
```python
GET /f1/2025/races  # Get all races
# For each race, get results which include Driver + Constructor
GET /f1/2025/1/results
# Returns: positionText, Driver {driverId}, Constructor {name}
```

**Option 2: Use Driver-Constructor Endpoint**
```python
GET /f1/2025/drivers/{driverId}/constructors
# Returns: Driver {driverId}, Constructor {name}
# Need to call this for each driver

# Example:
GET /f1/2025/drivers/hamilton/constructors
# Returns Ferrari (Hamilton's team in 2025)
```

**Recommended Approach:** Use Option 1 (race results) as it's more efficient and provides context for each race.

---

## Mapping to Fantasy F1 Driver Model

### Our Driver Model (from data_models.md)

```python
class Driver(Base):
    """Driver model for F1 drivers."""
    
    __tablename__ = "drivers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    team_name = Column(String(100), nullable=False, index=True)  # Real F1 team name
    number = Column(Integer, nullable=False, unique=True)
    country = Column(String(50))
    date_of_birth = Column(DateTime(timezone=True))
    
    # Fantasy-related fields
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
```

### Integration Example

```python
def populate_driver_teams():
    """Populate driver team_name field using race results."""
    
    # Fetch first race results to get driver-team mapping
    race_results = fetch_race_results(2025, 1)
    
    for result in race_results:
        driver_id = result['Driver']['driverId']
        constructor_name = result['Constructor']['name']
        
        # Update driver with team name
        driver = db.query(Driver).filter_by(driver_id=driver_id).first()
        if driver:
            driver.team_name = constructor_name
            db.commit()
```

---

## Related API Endpoints

1. **Driver-Constructor Mapping (per driver):**
   ```
   GET /f1/2025/drivers/{driverId}/constructors
   ```
   - Returns which constructor a specific driver drives for

2. **Race Results with Driver-Constructor pairs:**
   ```
   GET /f1/2025/{round}/results
   ```
   - Returns race results with Driver and Constructor objects

3. **Constructor Standings:**
   ```
   GET /f1/2025/constructorStandings
   ```
   - Returns current season standings for all constructors

4. **Specific Constructor within Season:**
   ```
   GET /f1/2025/constructors/{constructorId}
   ```
   - Returns details for a specific constructor

---

## Summary

**What This API Provides:**
- ✅ All 10 constructors/teams for 2025 season
- ✅ Team names and IDs
- ✅ Team nationalities
- ✅ Wikipedia reference links

**What This API Does NOT Provide:**
- ❌ Driver-team mapping (which driver drives for which team)
- ❌ Driver rosters for each team
- ❌ Current season standings or performance

**Key Characteristics:**
- 10 teams in 2025 F1 grid (standard for modern F1)
- Includes all major teams (Red Bull, Ferrari, Mercedes, McLaren)
- Team names are official F1 constructor names
- Sauber will become Audi in 2026 (note for future updates)

**CRITICAL INTEGRATION REQUIREMENT:**
This endpoint is essential for populating the `Driver.team_name` field. You MUST use this in combination with race results or driver-constructor endpoints to link drivers to their teams, as this information is NOT provided by the driver endpoint alone.