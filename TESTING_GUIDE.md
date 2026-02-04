# FantasyF1 Backend Testing Guide

This guide provides comprehensive instructions for testing your FantasyF1 application running on port 8000 via docker-compose.

## Table of Contents
1. [Quick Health Check](#quick-health-check)
2. [API Endpoint Testing](#api-endpoint-testing)
3. [Unit Testing](#unit-testing)
4. [Code Quality Checks](#code-quality-checks)
5. [Database Testing](#database-testing)
6. [Celery Tasks Testing](#celery-tasks-testing)
7. [API Documentation](#api-documentation)

---

## Quick Health Check

### 1. Verify Service Status
Check that all containers are running:
```bash
docker-compose ps
```

Expected output: All containers should show "Up" status (app, postgres, redis, celery)

### 2. Test Health Endpoint
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-30T23:57:00.000000",
  "version": "0.1.0"
}
```

### 3. Check API Documentation
Open in browser:
```
http://localhost:8000/docs
```
This shows the interactive Swagger UI for all API endpoints.

---

## API Endpoint Testing

### Authentication Endpoints

#### Register a New User
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "full_name": "Test User"
  }'
```

Expected response:
```json
{
  "id": 1,
  "username": "testuser",
  "email": "test@example.com",
  "full_name": "Test User",
  "is_active": true,
  "is_superuser": false,
  "created_at": "2026-01-30T23:57:00"
}
```

#### Login
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPass123!"
  }'
```

Save the `access_token` from the response for subsequent requests.

**Expected response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer"
}
```

#### Check If Email Exists
```bash
curl "http://localhost:8000/api/v1/auth/check-email?email=test@example.com"
```

**Expected response:**
```json
{
  "exists": true
}
```

#### Get Current User Profile
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Drivers Endpoints

#### List All Drivers
```bash
curl -X GET http://localhost:8000/api/v1/drivers
```

#### Get Specific Driver
```bash
curl -X GET http://localhost:8000/api/v1/drivers/1
```

#### Search Drivers
```bash
curl "http://localhost:8000/api/v1/drivers/search?query=Ver"
```

### Races Endpoints

#### List All Races
```bash
curl -X GET http://localhost:8000/api/v1/races
```

#### Get Upcoming Races
```bash
curl "http://localhost:8000/api/v1/races?status=upcoming"
```

#### Get Past Races
```bash
curl "http://localhost:8000/api/v1/races?status=past"
```

#### Get Race Results
```bash
curl -X GET http://localhost:8000/api/v1/races/1/results
```

### Leagues Endpoints

#### Create a League (requires authentication)
```bash
curl -X POST http://localhost:8000/api/v1/leagues \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Test League",
    "description": "A test league for testing purposes",
    "max_teams": 10,
    "is_private": false
  }'
```

#### List Leagues
```bash
curl -X GET http://localhost:8000/api/v1/leagues
```

#### Get Specific League
```bash
curl -X GET http://localhost:8000/api/v1/leagues/1
```

#### Get League Leaderboard
```bash
curl -X GET http://localhost:8000/api/v1/leagues/1/leaderboard
```

### Notifications Endpoints

#### List User Notifications
```bash
curl -X GET http://localhost:8000/api/v1/notifications \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Mark Notification as Read
```bash
curl -X PATCH http://localhost:8000/api/v1/notifications/1/read \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Mark All Notifications as Read
```bash
curl -X POST http://localhost:8000/api/v1/notifications/read-all \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Admin Endpoints (requires superuser)

#### Get Admin Statistics
```bash
curl -X GET http://localhost:8000/api/v1/admin/statistics \
  -H "Authorization: Bearer SUPERUSER_TOKEN"
```

#### Get Error Logs
```bash
curl "http://localhost:8000/api/v1/admin/logs?limit=10" \
  -H "Authorization: Bearer SUPERUSER_TOKEN"
```

---

## Unit Testing

**IMPORTANT: pytest tests do NOT run against localhost:8000**

The pytest test suite uses:
- **In-memory SQLite database** (not PostgreSQL)
- **Direct function calls** to FastAPI app (not HTTP requests)
- **Dependency injection** for database sessions
- **Test-only fixtures** in `tests/conftest.py`

This allows for fast, isolated testing that doesn't require the running Docker containers.

### Run All Tests
Navigate to backend directory and run:
```bash
cd FantasyF1_BE
pytest tests/ --cov=app --cov-report=html --cov-report=term
```

### Run Specific Test File
```bash
pytest tests/test_user_service.py -v
```

### Run Tests by Pattern
```bash
pytest tests/ -k "test_driver" -v
```

### Run Tests with Coverage Report
```bash
pytest tests/ --cov=app --cov-report=html
```

View the coverage report:
```bash
# Open htmlcov/index.html in your browser
start htmlcov/index.html  # Windows
open htmlcov/index.html    # Mac
xdg-open htmlcov/index.html  # Linux
```

### Run Tests with Verbose Output
```bash
pytest tests/ -vv --tb=short
```

### Test Summary Commands

**Test count by category:**
```bash
# Tests for services
pytest tests/test_*_service.py --collect-only

# Tests for endpoints
pytest tests/test_*_endpoints.py --collect-only

# Total test count
pytest tests/ --collect-only | grep "test session starts" -A 2
```

---

## Code Quality Checks

### 1. Format Code with Black
```bash
cd FantasyF1_BE
black app/ tests/
```

### 2. Lint with Ruff
```bash
cd FantasyF1_BE
ruff check app/ tests/ --fix
```

### 3. Type Check with MyPy
```bash
cd FantasyF1_BE
mypy app/
```

### 4. Run All CI Checks (Windows)
```bash
cd FantasyF1_BE
scripts\run_ci_checks.bat
```

**Or on Linux/Mac:**
```bash
cd FantasyF1_BE
./scripts/run_ci_checks.sh
```

### Expected Results
- **Black**: Should exit with code 0 (no formatting issues)
- **Ruff**: Should show "0 errors, 0 warnings"
- **MyPy**: Should show "Success: no issues found"
- **pytest**: Should show all tests passing

---

## Database Testing

### Summary of Database Usage

| Component | Database | Purpose |
|-----------|----------|---------|
| **Running App (localhost:8000)** | PostgreSQL in Docker | Production-like environment |
| **pytest tests** | SQLite in-memory | Fast isolated testing |
| **pytest fixtures** | SQLite in-memory | Test data management |

### Check Production Database (Running App)
```bash
# Connect to PostgreSQL via docker
cd FantasyF1_BE
docker-compose exec postgres psql -U fantasyf1_user -d fantasyf1_db
```

### Run SQL Queries
Once connected:
```sql
-- List all tables
\dt

-- Check users
SELECT id, username, email, is_active FROM users LIMIT 5;

-- Check drivers
SELECT id, name, team_name, number FROM drivers LIMIT 5;

-- Check races
SELECT id, name, round_number, race_date FROM races LIMIT 5;

-- Check leagues
SELECT id, name, code, is_private FROM leagues LIMIT 5;

-- Check migrations
SELECT version_id FROM alembic_version;

-- Exit
\q
```

### Run Database Migrations
```bash
# Navigate to backend directory
cd FantasyF1_BE

# Run migrations
docker-compose exec app alembic upgrade head

# Check migration status
docker-compose exec app alembic current
```

### Rollback Migrations
```bash
cd FantasyF1_BE
docker-compose exec app alembic downgrade -1
```

### Reset Database (use with caution!)
```bash
cd FantasyF1_BE
docker-compose exec app alembic downgrade base
docker-compose exec app alembic upgrade head
```

---

## Celery Tasks Testing

### Check Celery Worker Status
```bash
docker-compose logs celery | tail -20
```

### Inspect Active Tasks
```bash
docker-compose exec app celery -A app.tasks.celery_app inspect active
```

### List Registered Tasks
```bash
docker-compose exec app celery -A app.tasks.celery_app inspect registered
```

### Manual Task Execution (for testing)

#### Sync Drivers
```bash
docker-compose exec app celery -A app.tasks.celery_app call tasks.sync_drivers
```

#### Sync Race Results
```bash
docker-compose exec app celery -A app.tasks.celery_app call tasks.sync_race_results
```

#### Cleanup Old Notifications
```bash
docker-compose exec app celery -A app.tasks.celery_app call tasks.cleanup_old_notifications
```

---

## API Documentation

### Interactive Swagger UI
Open in browser:
```
http://localhost:8000/docs
```

Features:
- List of all available endpoints
- Request/response schemas
- Try it out functionality
- Authentication testing

### ReDoc Documentation
Open in browser:
```
http://localhost:8000/redoc
```

Features:
- Alternative, more detailed documentation
- Better for printing/sharing
- Includes all endpoint details

### OpenAPI Schema
Download the full schema:
```bash
curl http://localhost:8000/openapi.json > openapi-schema.json
```

---

## Comprehensive Test Scenarios

### Scenario 1: Complete User Flow
```bash
# 1. Register new user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"flowtest","email":"flowtest@example.com","password":"FlowTest123!","full_name":"Flow Test"}'

# 2. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"flowtest","password":"FlowTest123!"}' | \
  jq -r '.access_token')

echo "Token: $TOKEN"

# 3. Get profile
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Check email exists
curl "http://localhost:8000/api/v1/auth/check-email?email=flowtest@example.com"
```

### Scenario 2: League Creation and Testing
```bash
# 1. Create league
RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/leagues \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test League","description":"Testing","max_teams":8,"is_private":false}')

LEAGUE_ID=$(echo $RESPONSE | jq -r '.id')
echo "League ID: $LEAGUE_ID"

# 2. Get league details
curl -X GET http://localhost:8000/api/v1/leagues/$LEAGUE_ID

# 3. Get leaderboard
curl -X GET http://localhost:8000/api/v1/leagues/$LEAGUE_ID/leaderboard
```

### Scenario 3: Data Exploration
```bash
# 1. List all drivers
curl -X GET http://localhost:8000/api/v1/drivers | jq '.items | length'

# 2. Get upcoming races
curl "http://localhost:8000/api/v1/races?status=upcoming" | jq '.items[] | {name, race_date}'

# 3. Search for specific driver
curl "http://localhost:8000/api/v1/drivers/search?query=Ver" | jq '.items[].name'
```

---

## Troubleshooting

### Common Issues

**Issue: Connection refused**
```bash
# Check if services are running
docker-compose ps

# Restart services if needed
docker-compose restart
```

**Issue: Database connection error**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify database is ready
docker-compose exec postgres pg_isready
```

**Issue: Tests failing due to database state**
```bash
# Reset test database
cd FantasyF1_BE
docker-compose down -v
docker-compose up -d postgres redis
# Wait for databases to be ready
sleep 10
docker-compose up -d app celery
```

**Issue: Redis connection error**
```bash
# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

**Issue: Celery tasks not running**
```bash
# Check Celery logs
docker-compose logs celery

# Restart Celery
docker-compose restart celery
```

### View All Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f celery
docker-compose logs -f postgres
docker-compose logs -f redis
```

---

## Performance Testing

### Load Test an Endpoint
```bash
# Install Apache Bench if not available
# Ubuntu/Debian: sudo apt-get install apache2-utils
# Mac: brew install httpd

# Test health endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:8000/health

# Test drivers endpoint
ab -n 50 -c 5 http://localhost:8000/api/v1/drivers
```

### Check Response Times
```bash
# Use curl with timing
time curl http://localhost:8000/health

# Or with curl-verbose
curl -w "@-" -o /dev/null -s "http://localhost:8000/health" <<'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
```

---

## Security Testing

### Test Rate Limiting
```bash
# Make 11 requests (limit is 10 per minute for auth endpoints)
for i in {1..11}; do
  echo "Request $i"
  curl "http://localhost:8000/api/v1/auth/check-email?email=test$i@example.com"
  sleep 1
done
```

Expected: Last request should return 429 status

### Test Authentication
```bash
# Try accessing protected endpoint without token
curl -X GET http://localhost:8000/api/v1/auth/me

# Expected: 401 Unauthorized

# Try with invalid token
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer invalid_token"

# Expected: 401 Unauthorized
```

### Test CORS
```bash
# Test CORS headers
curl -I -H "Origin: http://localhost:3000" \
  http://localhost:8000/health
```

Expected: Should include `Access-Control-Allow-Origin` header

---

## Summary Checklist

Use this checklist to verify everything is working:

### Basic Functionality
- [ ] Docker containers are running (docker-compose ps)
- [ ] Health endpoint returns 200 OK
- [ ] Swagger UI accessible at http://localhost:8000/docs
- [ ] PostgreSQL connection working
- [ ] Redis connection working

### Authentication
- [ ] User registration works
- [ ] User login returns valid token
- [ ] Protected endpoints require authentication
- [ ] Token refresh works
- [ ] Logout works

### API Endpoints
- [ ] Drivers endpoints working
- [ ] Races endpoints working
- [ ] Leagues endpoints working
- [ ] Notifications endpoints working
- [ ] Admin endpoints work for superuser

### Testing (pytest)
These test the application code directly (NOT via localhost:8000):

- [ ] All unit tests pass (cd FantasyF1_BE && pytest tests/)
- [ ] Test coverage > 80%
- [ ] Code formatted (Black)
- [ ] No linting errors (Ruff)
- [ ] Type checking passes (MyPy)

**Note:** pytest tests use in-memory SQLite and don't require Docker containers

### Background Tasks
- [ ] Celery worker running
- [ ] Celery tasks successful
- [ ] Scheduled tasks executing
- [ ] Task results visible in Redis

### Database
- [ ] All migrations applied
- [ ] Tables created correctly
- [ ] Can query data
- [ ] Relationships work

---

## Next Steps

After confirming everything is working:

1. **Explore the API** using Swagger UI
2. **Run the test suite** to verify all functionality
3. **Review test coverage** to identify gaps
4. **Test edge cases** and error scenarios
5. **Monitor performance** under load
6. **Review logs** for any issues

For more information, see:
- [DEV_PHASES.md](documentation/DEV_PHASES.md)
- [DEV_SPRINTS.md](documentation/DEV_SPRINTS.md)
- [FantasyF1_BE/README.md](FantasyF1_BE/README.md)