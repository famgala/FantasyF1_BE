@echo off
REM Script to start the FantasyF1 development environment (Windows)

echo ===================================
echo Starting FantasyF1 Dev Environment
echo ===================================
echo.

REM Check if .env.dev exists
if not exist ".env.dev" (
    echo Error: .env.dev file not found!
    echo Please copy .env.example to .env.dev first
    exit /b 1
)

echo Services starting:
echo   - PostgreSQL (internal, port 5432)
echo   - Redis (internal, port 6379)
echo   - MQTT (internal, port 1883)
echo   - FastAPI Backend (http://localhost:8000)
echo   - Celery Worker
echo   - Celery Beat
echo   - Flower (http://localhost:5555)
echo.
echo Note: Only Backend and Flower ports are exposed to host.
echo       Other services are accessible only within the dev network.
echo.

REM Start the dev environment
docker-compose -f docker-compose.dev.yml up -d

echo.
echo ===================================
echo Dev Environment Started!
echo ===================================
echo.
echo Useful commands:
echo   - View logs: docker-compose -f docker-compose.dev.yml logs -f
echo   - Stop environment: scripts\dev-stop.bat
echo   - Restart backend: docker-compose -f docker-compose.dev.yml restart backend
echo   - View backend logs: docker-compose -f docker-compose.dev.yml logs -f backend
echo   - Access PostgreSQL: docker exec -it fantasyf1_dev_postgres psql -U fantasyf1_dev
echo   - Access Redis: docker exec -it fantasyf1_dev_redis redis-cli -a dev_redis_123
echo.
echo API Documentation: http://localhost:8000/docs
echo Celery Flower: http://localhost:5555
echo.

pause
