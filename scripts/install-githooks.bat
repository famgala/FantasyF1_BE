@echo off
REM ============================================
REM Git Hooks Installation Script for Windows
REM Installs git hooks from .githooks directory
REM ============================================

echo ============================================
echo Installing Git Hooks
echo ============================================

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..

REM Check if .githooks directory exists
set GITHOOKS_DIR=%PROJECT_ROOT%\.githooks
if not exist "%GITHOOKS_DIR%" (
    echo [ERROR] .githooks directory not found at %GITHOOKS_DIR%
    exit /b 1
)

echo [OK] Found githooks directory at: %GITHOOKS_DIR%
echo.

REM Copy hooks to .git/hooks
echo [INFO] Installing pre-commit hooks...
copy "%GITHOOKS_DIR%\pre-commit" "%PROJECT_ROOT%\.git\hooks\pre-commit" > nul
copy "%GITHOOKS_DIR%\pre-commit.bat" "%PROJECT_ROOT%\.git\hooks\pre-commit.bat" > nul

if %ERRORLEVEL% EQU 0 (
    echo [OK] Pre-commit hooks installed successfully
) else (
    echo [ERROR] Failed to install pre-commit hooks
    exit /b 1
)

echo.
echo [INFO] Available hooks:
dir /B "%GITHOOKS_DIR%"

echo.
echo ============================================
echo [OK] Git hooks installation complete!
echo.
echo The pre-commit hook will now run automatically
echo before each commit to check code quality.
echo.
echo To skip the hook (not recommended):
echo   git commit --no-verify
echo ============================================