@echo off
REM ============================================
REM Fast Pre-commit Check Script for Windows
REM Runs fast but thorough checks locally (target: <30 seconds)
REM Ensures high likelihood of CI passing
REM ============================================

cd /d "%~dp0.."
set SCRIPT_DIR=%CD%
cd /d "%~dp0"

echo ============================================
echo Fast Pre-commit Checks (Backend)
echo Working directory: %SCRIPT_DIR%
echo ============================================

set EXIT_CODE=0

REM 1. Black formatter check (FAST)
echo.
echo [1/3] Checking code formatting with Black...
black --check app/ tests/ --line-length=100 > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   ❌ Black check failed - run 'black app/ tests/' to fix
    set EXIT_CODE=1
) else (
    echo   ✅ Black check passed
)

REM 2. Ruff linter (FAST)
echo.
echo [2/3] Running Ruff linter...
ruff check app/ tests/ > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   ❌ Ruff check failed - run 'ruff check app/ tests/ --fix' to fix
    set EXIT_CODE=1
) else (
    echo   ✅ Ruff check passed
)

REM 3. mypy type checker (FAST)
echo.
echo [3/3] Running mypy type checker...
mypy app/ > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo   ❌ mypy check failed - run 'mypy app/' to see issues
    set EXIT_CODE=1
) else (
    echo   ✅ mypy check passed
)

REM Final summary
echo.
echo ============================================
if %EXIT_CODE% equ 0 (
    echo ✅ All pre-commit checks passed!
    echo   Time: ~10-15 seconds
    echo   Static analysis only (no tests)
    echo   Ready to commit. CI will run full tests.
) else (
    echo ❌ Some checks failed.
    echo   Please fix the issues above before committing.
)
echo ============================================
echo.
echo For full validation with tests, run: .\scripts\run_ci_checks.bat
echo ============================================

exit /b %EXIT_CODE%