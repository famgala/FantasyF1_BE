@echo off
REM Script to stop the FantasyF1 development environment (Windows)

echo ===================================
echo Stopping FantasyF1 Dev Environment
echo ===================================

REM Stop the dev environment
docker-compose -f docker-compose.dev.yml down

echo.
echo ===================================
echo Dev Environment Stopped!
echo ===================================
echo.
echo To remove all volumes (including data):
echo   docker-compose -f docker-compose.dev.yml down -v
echo.
echo To start again:
echo   scripts\dev-start.bat
echo.

pause
