@echo off
setlocal enabledelayedexpansion

echo ============================================
echo Installing Git Hooks
echo ============================================

REM Check if githooks directory exists
if not exist ".githooks" (
    echo [ERROR] .githooks directory not found
    exit /b 1
)

echo [OK] Found githooks directory

REM Create .git/hooks directory if needed
if not exist ".git\hooks" mkdir .git\hooks

echo.
echo [INFO] Installing pre-commit hooks...

REM Copy the bash hook
if exist ".githooks\pre-commit" (
    echo [INFO] Copying pre-commit...
    copy /Y ".githooks\pre-commit" ".git\hooks\pre-commit" >nul
    echo [INFO] Converting line endings for Windows compatibility...
    powershell -Command "(Get-Content .git\hooks\pre-commit -Raw).Replace(\"`r`n\", \"`n\") | Set-Content -NoNewline .git\hooks\pre-commit"
    echo [OK] Pre-commit hook installed
) else (
    echo [WARNING] pre-commit not found
)

REM Copy the batch hook
if exist ".githooks\pre-commit.bat" (
    echo [INFO] Copying pre-commit.bat...
    copy /Y ".githooks\pre-commit.bat" ".git\hooks\pre-commit.bat" >nul
    echo [OK] Pre-commit.bat hook installed
) else (
    echo [WARNING] pre-commit.bat not found
)

echo.
echo ============================================
echo [OK] Git hooks installation complete!
echo.
echo The pre-commit hook will now run automatically
echo before each commit to:
echo   [x] Auto-format code with Black (backend)
echo   [x] Auto-fix linter issues with Ruff (backend)
echo   [x] Check type safety with MyPy (backend)
echo   [x] Run tests pytest when needed (backend)
echo   [x] Run ESLint and TypeScript checks (frontend)
echo.
echo Files will be automatically formatted when needed!
echo.
echo To skip the hook (not recommended):
echo   git commit --no-verify
echo ============================================

endlocal
