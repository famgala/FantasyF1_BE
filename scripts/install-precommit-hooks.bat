@echo off
REM ============================================
REM Install Pre-commit Hooks for Windows
REM This script copies the pre-commit hooks from .githooks to .git/hooks
REM ============================================

echo ============================================
echo Installing Pre-commit Hooks
echo ============================================

REM Check if we're in the right directory
if not exist ".git" (
    echo ERROR: .git directory not found. Please run this script from the repository root.
    exit /b 1
)

REM Create .git/hooks directory if it doesn't exist
if not exist ".git\hooks" (
    echo Creating .git\hooks directory...
    mkdir ".git\hooks"
)

REM Copy the pre-commit.bat file
echo Copying pre-commit.bat...
copy /Y ".git\hooks\pre-commit.bat" ".git\hooks\pre-commit.bat" > nul

echo.
echo ✅ Pre-commit hooks installed successfully for Windows!
echo.
echo The pre-commit hook will run before each commit.
echo It performs fast static analysis (Black, Ruff, mypy for backend)
echo and (ESLint, TypeScript for frontend).
echo.
echo Target time: ~10-20 seconds
echo ============================================