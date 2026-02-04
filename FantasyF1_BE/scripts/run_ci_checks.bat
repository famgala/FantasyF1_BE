@echo off
cd /d "%~dp0.."
REM ============================================
REM Run All CI Checks Locally
REM This script runs all the same tests that GitHub Actions will run
REM ============================================

echo ============================================
echo Running CI Checks Locally
echo ============================================
echo Working directory: %CD%

REM Set error codes
set EXIT_CODE=0

REM 1. Black formatter check
echo.
echo [1/4] Running Black formatter check...
black --check app/ tests/ > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Black check failed
    set EXIT_CODE=1
) else (
    echo ✅ Black check passed
)

REM 2. Ruff linter
echo.
echo [2/4] Running Ruff linter...
ruff check app/ tests/ > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ Ruff check failed
    set EXIT_CODE=1
) else (
    echo ✅ Ruff check passed
)

REM 3. mypy type checker
echo.
echo [3/4] Running mypy type checker...
mypy app/ > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ mypy check failed
    set EXIT_CODE=1
) else (
    echo ✅ mypy check passed
)

REM 4. pytest with coverage
echo.
echo [4/4] Running pytest with coverage...
pytest tests/ --cov=app --cov-report=html > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ❌ pytest failed
    set EXIT_CODE=1
) else (
    echo ✅ pytest passed
)

REM Final summary
echo.
echo ============================================
if %EXIT_CODE% equ 0 (
    echo ✅ All CI checks passed!
    echo You're ready to push your changes.
) else (
    echo ❌ Some CI checks failed.
    echo Please fix the issues above before pushing.
)
echo ============================================

exit /b %EXIT_CODE%