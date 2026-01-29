# Circuits API Summary

**API Endpoint:** `GET https://api.jolpi.ca/ergast/f1/2025/circuits/`

**Purpose:** Fetches all circuit information for the specified F1 season from the Jolpica API.

---

## API Response Structure

The API returns a JSON response with the following structure:

```json
{
  "MRData": {
    "xmlns": "",
    "series": "f1",
    "url": "https://api.jolpi.ca/ergast/f1/2025/circuits/",
    "limit": "30",
    "offset": "0",
    "total": "24",
    "CircuitTable": {
      "season": "2025",
      "Circuits": [
        {
          "circuitId": "albert_park",
          "url": "https://en.wikipedia.org/wiki/Albert_Park_Circuit",
          "circuitName": "Albert Park Grand Prix Circuit",
          "Location": {
            "lat": "-37.8497",
            "long": "144.968",
            "locality": "Melbourne",
            "country": "Australia"
          }
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
| `url` | string | API endpoint URL | `"https://api.jolpi.ca/ergast/f1/2025/circuits/"` |
| `limit` | string | Maximum results per page | `"30"` |
| `offset` | string | Pagination offset | `"0"` |
| `total` | string | Total number of circuits | `"24"` |

### CircuitTable

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `season` | string | Season year | `"2025"` |
| `Circuits` | array | Array of circuit objects | See below |

### Circuit Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `circuitId` | string | Unique circuit identifier (slug) | `"albert_park"` |
| `circuitName` | string | Full circuit name | `"Albert Park Grand Prix Circuit"` |
| `url` | string | Wikipedia link | `"https://en.wikipedia.org/wiki/Albert_Park_Circuit"` |
| `Location` | object | Location details | See below |

### Location Object

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `lat` | string | Latitude | `"-37.8497"` |
| `long` | string | Longitude | `"144.968"` |
| `locality` | string | City name | `"Melbourne"` |
| `country` | string | Country name | `"Australia"` |

---

## All Circuits in 2025 Season (24 Total)

| circuitId | Circuit Name | Locality | Country | Lat | Long |
|-----------|--------------|----------|---------|-----|------|
| albert_park | Albert Park Grand Prix Circuit | Melbourne | Australia | -37.8497 | 144.968 |
| americas | Circuit of the Americas | Austin | USA | 30.1328 | -97.6411 |
| bahrain | Bahrain International Circuit | Sakhir | Bahrain | 26.0325 | 50.5106 |
| baku | Baku City Circuit | Baku | Azerbaijan | 40.3725 | 49.8533 |
| catalunya | Circuit de Barcelona-Catalunya | Barcelona | Spain | 41.57 | 2.26111 |
| hungaroring | Hungaroring | Budapest | Hungary | 47.5789 | 19.2486 |
| imola | Autodromo Enzo e Dino Ferrari | Imola | Italy | 44.3439 | 11.7167 |
| interlagos | Autódromo José Carlos Pace | São Paulo | Brazil | -23.7036 | -46.6997 |
| jeddah | Jeddah Corniche Circuit | Jeddah | Saudi Arabia | 21.6319 | 39.1044 |
| losail | Losail International Circuit | Lusail | Qatar | 25.49 | 51.4542 |
| marina_bay | Marina Bay Street Circuit | Marina Bay | Singapore | 1.2914 | 103.864 |
| miami | Miami International Autodrome | Miami | USA | 25.9581 | -80.2389 |
| monaco | Circuit de Monaco | Monte Carlo | Monaco | 43.7347 | 7.42056 |
| monza | Autodromo Nazionale di Monza | Monza | Italy | 45.6156 | 9.28111 |
| red_bull_ring | Red Bull Ring | Spielberg | Austria | 47.2197 | 14.7647 |
| rodriguez | Autódromo Hermanos Rodríguez | Mexico City | Mexico | 19.4042 | -99.0907 |
| shanghai | Shanghai International Circuit | Shanghai | China | 31.3389 | 121.22 |
| silverstone | Silverstone Circuit | Silverstone | UK | 52.0786 | -1.01694 |
| spa | Circuit de Spa-Francorchamps | Spa | Belgium | 50.4372 | 5.97139 |
| suzuka | Suzuka Circuit | Suzuka | Japan | 34.8431 | 136.541 |
| vegas | Las Vegas Strip Street Circuit | Las Vegas | USA | 36.1147 | -115.173 |
| villeneuve | Circuit Gilles Villeneuve | Montreal | Canada | 45.5 | -73.5228 |
| yas_marina | Yas Marina Circuit | Abu Dhabi | UAE | 24.4672 | 54.6031 |
| zandvoort | Circuit Park Zandvoort | Zandvoort | Netherlands | 52.3888 | 4.54092 |

---

## Usage Notes

### When to Use This Endpoint

1. **Get Circuit List**: Fetch all circuits for a season
2. **Circuit Info**: Get basic circuit details and locations
3. **Geographic Data**: Coordinates for mapping/display
4. **Reference**: Wikipedia links for detailed circuit information

### Example Endpoints

```bash
# Get all circuits for a specific season
GET /f1/2025/circuits

# Get circuits without year specification
GET /f1/circuits  # May return all historical circuits

# Get specific circuit info within a season
GET /f1/2025/circuits/albert_park
```

---

## Integration Notes

### For Fantasy F1 App

**Nice to Have (Optional):**
- Display circuit names and locations in UI
- Show race locations on maps
- Provide links to circuit info

**Not Critical for MVP:**
- Circuit data is already available via `/f1/2025/races` endpoint
- This endpoint is useful for getting all circuits without race context
- Consider using if you need circuit-specific features (e.g., circuit filter, circuit stats)

**Recommended Use:**
- Use `/f1/2025/races` for race-specific circuit information (including dates and race context)
- Use `/f1/2025/circuits` if you need to display all circuits independently

---

## Related API Endpoints

1. **Race Schedule with Circuit Info:**
   ```
   GET /f1/2025/races
   ```
   - Returns races with circuit information (same fields but with race context)

2. **Specific Circuit within Season:**
   ```
   GET /f1/2025/circuits/{circuitId}
   ```
   - Returns details for a specific circuit

3. **Circuit Lap Times (Qualifying/Race):**
   ```
   GET /f1/2025/circuits/{circuitId}/laps
   ```
   - Returns lap data for specific circuit

---

## Summary

**What This API Provides:**
- ✅ All 24 circuits for 2025 season
- ✅ Circuit names and IDs
- ✅ Geographic coordinates (lat/long)
- ✅ City and country locations
- ✅ Wikipedia reference links

**Key Characteristics:**
- 24 distinct circuits in 2025 calendar
- Geographic distribution: 6 in Europe, 5 in Asia, 5 in Americas, 4 in Middle East, 4 others
- Mix of permanent circuits and street circuits
- Includes all classic venues (Monaco, Silverstone, Monza, Spa, Suzuka)

**Recommendation:** Useful for displaying circuit information, maps, and location-based features. For race-specific context, use the `/f1/{year}/races` endpoint instead, which includes circuit data along with race timing and scheduling.