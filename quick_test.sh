#!/bin/bash

# Quick Test Script for FantasyF1 Backend
# This script performs basic validation tests on the running application

echo "==================================================="
echo "FantasyF1 Backend - Quick Test Suite"
echo "==================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((FAILED++))
    fi
    echo ""
}

# Function to print section header
print_header() {
    echo -e "${BLUE}=== $1 ===${NC}"
    echo ""
}

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: docker-compose or docker command not found${NC}"
    exit 1
fi

# Use docker compose if available, otherwise docker-compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

print_header "1. Checking Docker Services"

# Check if all containers are running
echo "Checking container status..."
$DOCKER_COMPOSE ps > /dev/null 2>&1
if [ $? -eq 0 ]; then
    # Check if all required services are up
    RUNNING_CONTAINERS=$($DOCKER_COMPOSE ps --services --filter "status=running" | wc -l)
    if [ $RUNNING_CONTAINERS -ge 3 ]; then
        print_result 0 "Docker containers are running ($RUNNING_CONTAINERS containers)"
        
        # Show container details
        echo "Running containers:"
        $DOCKER_COMPOSE ps --filter "status=running" --format "  - {{.Service}} ({{.Status}})"
        echo ""
    else
        print_result 1 "Not all containers are running (expected at least 3, found $RUNNING_CONTAINERS)"
    fi
else
    print_result 1 "Failed to check Docker containers"
fi

print_header "2. Testing Health Endpoint"

echo "Testing GET /health..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/health)
HEALTH_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HEALTH_CODE" == "200" ]; then
    echo "Response: $HEALTH_BODY"
    print_result 0 "Health endpoint returned 200 OK"
    
    # Check if response contains required fields
    if echo "$HEALTH_BODY" | grep -q "status" && echo "$HEALTH_BODY" | grep -q "version"; then
        print_result 0 "Health response contains required fields"
    else
        print_result 1 "Health response missing required fields"
    fi
else
    print_result 1 "Health endpoint returned code $HEALTH_CODE (expected 200)"
fi

print_header "3. Testing API Documentation"

echo "Checking Swagger UI..."
SWAGGER_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/docs)
print_result $( [ "$SWAGGER_CODE" == "200" ] && echo 0 || echo 1 ) "Swagger UI accessible (code: $SWAGGER_CODE)"

echo "Checking ReDoc..."
REDOC_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/redoc)
print_result $( [ "$REDOC_CODE" == "200" ] && echo 0 || echo 1 ) "ReDoc accessible (code: $REDOC_CODE)"

print_header "4. Testing Database Connection"

echo "Testing PostgreSQL connection..."
DB_RESPONSE=$($DOCKER_COMPOSE exec -T postgres pg_isready 2>&1)
if echo "$DB_RESPONSE" | grep -q "accepting connections"; then
    print_result 0 "PostgreSQL accepting connections"
else
    print_result 1 "PostgreSQL not accepting connections: $DB_RESPONSE"
fi

echo "Testing database tables..."
TABLES=$($DOCKER_COMPOSE exec -T postgres psql -U fantasyf1_user -d fantasyf1_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1)
if [ $? -eq 0 ]; then
    TABLE_COUNT=$(echo "$TABLES" | tr -d ' ')
    print_result 0 "Database contains $TABLE_COUNT tables"
else
    print_result 1 "Failed to query database tables"
fi

print_header "5. Testing Redis Connection"

echo "Testing Redis connection..."
REDIS_RESPONSE=$($DOCKER_COMPOSE exec -T redis redis-cli ping 2>&1)
if [ "$REDIS_RESPONSE" == "PONG" ]; then
    print_result 0 "Redis responding correctly"
else
    print_result 1 "Redis not responding: $REDIS_RESPONSE"
fi

print_header "6. Testing Authentication Endpoints"

echo "Testing user registration..."
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"quicktest","email":"quicktest@example.com","password":"TestPass123!","full_name":"Quick Test"}')

REGISTER_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)

if [ "$REGISTER_CODE" == "200" ] || [ "$REGISTER_CODE" == "201" ]; then
    print_result 0 "User registration successful (code: $REGISTER_CODE)"
    
    # Try login
    echo "Testing user login..."
    LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:8000/api/v1/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"quicktest","password":"TestPass123!"}')
    
    LOGIN_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
    LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')
    
    if [ "$LOGIN_CODE" == "200" ]; then
        print_result 0 "User login successful (code: $LOGIN_CODE)"
        
        # Extract token if login was successful
        TOKEN=$(echo "$LOGIN_BODY" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        
        if [ ! -z "$TOKEN" ]; then
            echo "Testing protected endpoint with token..."
            ME_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET http://localhost:8000/api/v1/auth/me \
              -H "Authorization: Bearer $TOKEN" 2>/dev/null)
            
            ME_CODE=$(echo "$ME_RESPONSE" | tail -n1)
            
            if [ "$ME_CODE" == "200" ]; then
                print_result 0 "Protected endpoint accessible with valid token"
            else
                print_result 1 "Protected endpoint returned code $ME_CODE"
            fi
        else
            print_result 1 "Could not extract access token from login response"
        fi
    else
        print_result 1 "User login failed (code: $LOGIN_CODE)"
    fi
else
    print_result 1 "User registration failed (code: $REGISTER_CODE)"
    echo "Response: $REGISTER_BODY"
fi

print_header "7. Testing Data Endpoints"

echo "Testing drivers endpoint..."
DRIVERS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/drivers)
print_result $( [ "$DRIVERS_CODE" == "200" ] && echo 0 || echo 1 ) "Drivers endpoint (code: $DRIVERS_CODE)"

echo "Testing races endpoint..."
RACES_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/races)
print_result $( [ "$RACES_CODE" == "200" ] && echo 0 || echo 1 ) "Races endpoint (code: $RACES_CODE)"

echo "Testing leagues endpoint..."
LEAGUES_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/leagues)
print_result $( [ "$LEAGUES_CODE" == "200" ] && echo 0 || echo 1 ) "Leagues endpoint (code: $LEAGUES_CODE)"

print_header "8. Testing Celery Tasks"

echo "Checking Celery worker status..."
CELERY_STATUS=$($DOCKER_COMPOSE logs celery --tail=5 2>&1)
if echo "$CELERY_STATUS" | grep -q "celery.*ready"; then
    print_result 0 "Celery worker appears to be running"
else
    print_result 1 "Celery worker may not be running properly"
fi

print_header "Test Summary"

echo -e "${BLUE}Total Tests:${NC} $((PASSED + FAILED))"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}==================================================="${NC}
    echo -e "${GREEN}All tests passed! 🎉${NC}"
    echo -e "${GREEN}===================================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Open http://localhost:8000/docs for interactive API testing"
    echo "  2. Run full test suite: cd FantasyF1_BE && pytest tests/"
    echo "  3. Check code quality: cd FantasyF1_BE && scripts/run_ci_checks.bat"
    exit 0
else
    echo -e "${YELLOW}===================================================${NC}"
    echo -e "${YELLOW}Some tests failed. Check the logs above.${NC}"
    echo -e "${YELLOW}===================================================${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Check container logs: docker-compose logs [service]"
    echo "  2. Restart services: docker-compose restart"
    echo "  3. See TESTING_GUIDE.md for detailed troubleshooting"
    exit 1
fi