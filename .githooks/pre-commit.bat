@echo off
REM ============================================
REM Pre-commit Hook for Windows (Auto-format version)
REM Auto-formats files and runs CI checks
REM ============================================

echo ============================================
echo Running Pre-commit Checks (Auto-format Mode)
echo ============================================

SET EXIT_CODE=0

REM Get the list of staged files
FOR /F "delims=" %%i IN ('git diff --cached --name-only --diff-filter=ACM 2^>nul') DO (
    SET STAGED_FILE=%%i
)

REM Check if there are any staged files
git diff --cached --quiet >nul 2>&1
IF %ERRORLEVEL% EQU 0 (
    echo No staged files. Skipping pre-commit checks.
    exit /b 0
)

REM Detect what changed
SET BACKEND_CHANGED=false
SET FRONTEND_CHANGED=false

FOR /F "delims=" %%i IN ('git diff --cached --name-only --diff-filter=ACM 2^>nul') DO (
    ECHO "%%i" | FINDSTR /C:"FantasyF1_BE" >nul
    IF NOT ERRORLEVEL 1 SET BACKEND_CHANGED=true
    
    ECHO "%%i" | FINDSTR /C:"frontend" >nul
    IF NOT ERRORLEVEL 1 SET FRONTEND_CHANGED=true
)

echo.
echo Changed files detected:
IF "%BACKEND_CHANGED%"=="true" echo   [x] Backend files changed
IF "%FRONTEND_CHANGED%"=="true" echo   [x] Frontend files changed
echo.

REM Run backend checks if backend changed
IF "%BACKEND_CHANGED%"=="true" (
    echo ============================================
    echo Running Backend Checks (Auto-formatting)
    echo ============================================
    
    REM Change to backend directory
    CD FantasyF1_BE
    
    REM 1. Black formatter (auto-format, then verify)
    echo.
    echo [1/5] Running Black formatter (auto-formatting)...
    black app/ tests/ 2>&1 | FINDSTR /C:"reformatted" >nul
    IF NOT ERRORLEVEL 1 (
        echo [WARN] Files were reformatted by Black
        REM Stage the reformatted files
        git add app/ tests/
        REM Verify it passes check now
        black --check app/ tests/ >nul 2>&1
        IF NOT ERRORLEVEL 1 (
            echo [OK] Black formatting applied and verified
        ) ELSE (
            echo [FAIL] Black check failed even after formatting
            SET EXIT_CODE=1
        )
    ) ELSE (
        REM No files were reformatted, just check
        black --check app/ tests/ >nul 2>&1
        IF NOT ERRORLEVEL 1 (
            echo [OK] Black check passed (no formatting needed)
        ) ELSE (
            echo [FAIL] Black check failed
            SET EXIT_CODE=1
        )
    )
    
    REM 2. Ruff linter (auto-fix, then verify)
    echo.
    echo [2/5] Running Ruff linter (auto-fixing)...
    ruff check app/ tests/ --fix >nul 2>&1
    ruff check app/ tests/ >nul 2>&1
    IF NOT ERRORLEVEL 1 (
        echo [OK] Ruff check passed
    ) ELSE (
        echo [FAIL] Ruff check failed - some issues could not be auto-fixed
        SET EXIT_CODE=1
    )
    
    REM 3. mypy type checker
    echo.
    echo [3/5] Running MyPy type checker...
    mypy app/ >nul 2>&1
    IF NOT ERRORLEVEL 1 (
        echo [OK] MyPy check passed
    ) ELSE (
        echo [FAIL] MyPy check failed - run 'mypy app/' to see issues
        SET EXIT_CODE=1
    )
    
    REM 4. pytest with coverage (only if tests directory changed or app directory changed)
    echo.
    echo [4/5] Checking if tests need to be run...
    SET TESTS_CHANGED=false
    
    FOR /F "delims=" %%i IN ('git diff --cached --name-only --diff-filter=ACM 2^>nul') DO (
        ECHO "%%i" | FINDSTR /C:"FantasyF1_BE\\tests" >nul
        IF NOT ERRORLEVEL 1 SET TESTS_CHANGED=true
        
        ECHO "%%i" | FINDSTR /C:"FantasyF1_BE\\app\\services" >nul
        IF NOT ERRORLEVEL 1 SET TESTS_CHANGED=true
        
        ECHO "%%i" | FINDSTR /C:"FantasyF1_BE\\app\\api" >nul
        IF NOT ERRORLEVEL 1 SET TESTS_CHANGED=true
    )
    
    IF "%TESTS_CHANGED%"=="true" (
        echo Running pytest with coverage...
        pytest tests/ --cov=app --cov-report=html >nul 2>&1
        IF NOT ERRORLEVEL 1 (
            echo [OK] pytest passed
        ) ELSE (
            echo [FAIL] pytest failed - run 'pytest tests/ --cov=app' to see issues
            SET EXIT_CODE=1
        )
    ) ELSE (
        echo Skipping pytest (no test files or service files changed)
    )
    
    REM 5. Stage any changes from auto-formatting/auto-fixing
    echo.
    echo [5/5] Staging auto-formatted files...
    git add app/ tests/
    echo [OK] Files staged
    
    REM Return to root directory
    CD ..
)

REM Run frontend checks if frontend changed
IF "%FRONTEND_CHANGED%"=="true" (
    echo.
    echo ============================================
    echo Running Frontend Checks
    echo ============================================
    
    REM Change to frontend directory
    CD frontend
    
    REM 1. ESLint
    echo.
    echo [1/3] Running ESLint...
    CALL npm run lint >nul 2>&1
    IF NOT ERRORLEVEL 1 (
        echo [OK] ESLint passed
    ) ELSE (
        echo [FAIL] ESLint failed - run 'npm run lint' to see issues
        SET EXIT_CODE=1
    )
    
    REM 2. TypeScript type check
    echo.
    echo [2/3] Running TypeScript type check...
    CALL npx tsc --noEmit >nul 2>&1
    IF NOT ERRORLEVEL 1 (
        echo [OK] TypeScript check passed
    ) ELSE (
        echo [FAIL] TypeScript check failed - run 'npx tsc --noEmit' to see issues
        SET EXIT_CODE=1
    )
    
    REM 3. Build check (only if source files changed)
    echo.
    echo [3/3] Checking if build needs to be run...
    SET SOURCE_CHANGED=false
    
    FOR /F "delims=" %%i IN ('git diff --cached --name-only --diff-filter=ACM 2^>nul') DO (
        ECHO "%%i" | FINDSTR /C:"frontend\\src" >nul
        IF NOT ERRORLEVEL 1 SET SOURCE_CHANGED=true
        
        ECHO "%%i" | FINDSTR /C:"frontend\\tsconfig" >nul
        IF NOT ERRORLEVEL 1 SET SOURCE_CHANGED=true
        
        ECHO "%%i" | FINDSTR /C:"vite.config.ts" >nul
        IF NOT ERRORLEVEL 1 SET SOURCE_CHANGED=true
        
        ECHO "%%i" | FINDSTR /C:"package.json" >nul
        IF NOT ERRORLEVEL 1 SET SOURCE_CHANGED=true
    )
    
    IF "%SOURCE_CHANGED%"=="true" (
        echo Testing frontend build...
        CALL npm run build >nul 2>&1
        IF NOT ERRORLEVEL 1 (
            echo [OK] Frontend build succeeded
            REM Clean up build artifacts
            RMDIR /S /Q dist 2>nul
        ) ELSE (
            echo [FAIL] Frontend build failed - run 'npm run build' to see issues
            SET EXIT_CODE=1
        )
    ) ELSE (
        echo Skipping build (no source files changed)
    )
    
    REM Return to root directory
    CD ..
)

REM Final summary
echo.
echo ============================================
IF %EXIT_CODE% EQU 0 (
    echo All pre-commit checks passed!
    echo You are ready to commit your changes.
) ELSE (
    echo Some pre-commit checks failed.
    echo Please fix the issues above before committing.
    echo.
    echo Tips:
    echo   - Run 'bash FantasyF1_BE/scripts/run_ci_checks.sh' for backend checks
    echo   - Run 'cd frontend ^&^& npm run lint ^&^& npm run build' for frontend checks
)
echo ============================================

exit /b %EXIT_CODE%