@echo off
REM Quick Test Script for FantasyF1 Backend (Windows)
REM This script performs basic validation tests on the running application

echo ===================================================
echo FantasyF1 Backend - Quick Test Suite (Windows)
echo ===================================================
echo.

REM Test counter
set /a PASSED=0
set /a FAILED=0

REM Function to print test result
:print_result
if %1==0 (
    echo [OK] %2
    set /a PASSED=%PASSED%+1
) else (
    echo [FAIL] %2
    set /a FAILED=%FAILED%+1
)
echo.
goto :eof

REM Check which docker compose command is available
docker-compose version >nul 2>&1
if %errorlevel%==0 (
    set DOCKER_COMPOSE=docker-compose
) else (
    docker compose version >nul 2>&1
    if %errorlevel%==0 (
        set DOCKER_COMPOSE=docker compose
    ) else (
        echo [ERROR] docker-compose or docker command not found
        exit /b 1
    )
)

echo === 1. Checking Docker Services ===
echo.

echo Checking container status...
%DOCKER_COMPOSE% ps >nul 2>&1
if %errorlevel%==0 (
    echo Docker containers are running
    echo.
    echo Running containers:
    %DOCKER_COMPOSE% ps --filter "status=running" --format "  - {{.Service}} ({{.Status}})"
    echo.
    call :print_result 0 "Docker containers are running"
) else (
    call :print_result 1 "Failed to check Docker containers"
)

echo === 2. Testing Health Endpoint ===
echo.

echo Testing GET /health...
curl -s -w "\n%%{http_code}" http://localhost:8000/health > health_response.txt
set /p HEALTH_CODE=<health_response.txt
set /p HEALTH_BODY=<health_response.txt

findstr /C:"200" health_response.txt >nul
if %errorlevel%==0 (
    echo Response: %HEALTH_BODY%
    call :print_result 0 "Health endpoint returned 200 OK"
    
    findstr /C:"status" health_response.txt >nul
    if %errorlevel%==0 (
        findstr /C:"version" health_response.txt >nul
        if %errorlevel%==0 (
            call :print_result 0 "Health response contains required fields"
        ) else (
            call :print_result 1 "Health response missing version field"
        )
    ) else (
        call :print_result 1 "Health response missing status field"
    )
) else (
    call :print_result 1 "Health endpoint returned code %HEALTH_CODE% (expected 200)"
)

del health_response.txt

echo === 3. Testing API Documentation ===
echo.

echo Checking Swagger UI...
curl -s -o nul -w "%%{http_code}" http://localhost:8000/docs > swagger_code.txt
set /p SWAGGER_CODE=<swagger_code.txt
if "%SWAGGER_CODE%"=="200" (
    call :print_result 0 "Swagger UI accessible (code: %SWAGGER_CODE%)"
) else (
    call :print_result 1 "Swagger UI not accessible (code: %SWAGGER_CODE%)"
)

echo Checking ReDoc...
curl -s -o nul -w "%%{http_code}" http://localhost:8000/redoc > redoc_code.txt
set /p REDOC_CODE=<redoc_code.txt
if "%REDOC_CODE%"=="200" (
    call :print_result 0 "ReDoc accessible (code: %REDOC_CODE%)"
) else (
    call :print_result 1 "ReDoc not accessible (code: %REDOC_CODE%)"
)

del swagger_code.txt redoc_code.txt

echo === 4. Testing Database Connection ===
echo.

echo Testing PostgreSQL connection...
%DOCKER_COMPOSE% exec -T postgres pg_isready > db_response.txt 2>&1
findstr /C:"accepting connections" db_response.txt >nul
if %errorlevel%==0 (
    call :print_result 0 "PostgreSQL accepting connections"
) else (
    call :print_result 1 "PostgreSQL not accepting connections"
    type db_response.txt
)

del db_response.txt

echo === 5. Testing Redis Connection ===
echo.

echo Testing Redis connection...
%DOCKER_COMPOSE% exec -T redis redis-cli ping > redis_response.txt 2>&1
findstr /C:"PONG" redis_response.txt >nul
if %errorlevel%==0 (
    call :print_result 0 "Redis responding correctly"
) else (
    call :print_result 1 "Redis not responding"
    type redis_response.txt
)

del redis_response.txt

echo === 6. Testing Data Endpoints ===
echo.

echo Testing drivers endpoint...
curl -s -o nul -w "%%{http_code}" http://localhost:8000/api/v1/drivers > drivers_code.txt
set /p DRIVERS_CODE=<drivers_code.txt
if "%DRIVERS_CODE%"=="200" (
    call :print_result 0 "Drivers endpoint (code: %DRIVERS_CODE%)"
) else (
    call :print_result 1 "Drivers endpoint failed (code: %DRIVERS_CODE%)"
)

echo Testing races endpoint...
curl -s -o nul -w "%%{http_code}" http://localhost:8000/api/v1/races > races_code.txt
set /p RACES_CODE=<races_code.txt
if "%RACES_CODE%"=="200" (
    call :print_result 0 "Races endpoint (code: %RACES_CODE%)"
) else (
    call :print_result 1 "Races endpoint failed (code: %RACES_CODE%)"
)

echo Testing leagues endpoint...
curl -s -o nul -w "%%{http_code}" http://localhost:8000/api/v1/leagues > leagues_code.txt
set /p LEAGUES_CODE=<leagues_code.txt
if "%LEAGUES_CODE%"=="200" (
    call :print_result 0 "Leagues endpoint (code: %LEAGUES_CODE%)"
) else (
    call :print_result 1 "Leagues endpoint failed (code: %LEAGUES_CODE%)"
)

del drivers_code.txt races_code.txt leagues_code.txt

echo === 7. Testing Authentication Endpoints ===
echo.

echo Testing user registration...
curl -s -w "%%{http_code}" -X POST http://localhost:8000/api/v1/auth/register -H "Content-Type: application/json" -d "{\"username\":\"quicktest\",\"email\":\"quicktest@example.com\",\"password\":\"TestPass123!\",\"full_name\":\"Quick Test\"}" > register_response.txt

findstr /C:"200" register_response.txt >nul
if %errorlevel%==0 (
    call :print_result 0 "User registration successful"
    
    echo Testing user login...
    curl -s -w "%%{http_code}" -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"quicktest\",\"password\":\"TestPass123!\"}" > login_response.txt
    
    findstr /C:"200" login_response.txt >nul
    if %errorlevel%==0 (
        call :print_result 0 "User login successful"
    ) else (
        call :print_result 1 "User login failed"
    )
) else (
    call :print_result 1 "User registration failed"
)

del register_response.txt login_response.txt

echo === 8. Checking Service Logs ===
echo.

echo Checking recent app logs...
%DOCKER_COMPOSE% logs app --tail=3 > app_logs.txt 2>&1
type app_logs.txt
del app_logs.txt

echo.
echo === Test Summary ===
echo.
echo Total Tests: %PASSED%
echo Passed: %PASSED%
echo Failed: %FAILED%
echo.

if %FAILED%==0 (
    echo ===================================================
    echo All tests passed!
    echo ===================================================
    echo.
    echo Next steps:
    echo   1. Open http://localhost:8000/docs for interactive API testing
    echo   2. Run full test suite: cd FantasyF1_BE ^&^& pytest tests/
    echo   3. Check code quality: cd FantasyF1_BE ^&^& scripts\run_ci_checks.bat
    pause
) else (
    echo ===================================================
    echo Some tests failed. Check the logs above.
    echo ===================================================
    echo.
    echo Troubleshooting:
    echo   1. Check container logs: docker-compose logs [service]
    echo   2. Restart services: docker-compose restart
    echo   3. See TESTING_GUIDE.md for detailed troubleshooting
    pause
)