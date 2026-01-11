# Scripts

This directory contains utility scripts for the FantasyF1 backend project.

## Contents

- **run_ci_checks.bat** - Windows script to run all CI checks (Black, Ruff, mypy, pytest)
- **run_ci_checks.sh** - Unix/Linux/Mac script to run all CI checks (Black, Ruff, mypy, pytest)

## Usage

### Running CI Checks Manually

**Windows:**
```cmd
cd FantasyF1_BE
scripts\run_ci_checks.bat
```

**Linux/Mac:**
```bash
cd FantasyF1_BE
./scripts/run_ci_checks.sh
```

### What Gets Checked

The CI scripts run the following checks in order:
1. Black formatter (code style)
2. Ruff linter (code quality)
3. mypy type checker (type annotations)
4. pytest with coverage (test suite)

All checks must pass (exit code 0) for the script to succeed.

## Pre-Commit Hook

These scripts are automatically called by the Git pre-commit hook when you attempt to commit. If any check fails, the commit will be blocked.

To bypass the hook temporarily (not recommended):
```bash
git commit --no-verify -m "your commit message"
```

## Adding New Scripts

When adding new utility scripts to this directory:

1. Keep them focused and single-purpose
2. Include clear comments at the top with:
   - Script purpose
   - Required arguments
   - Usage examples
3. Make Windows and Unix versions when applicable
4. Update this README.md with the new script
5. Ensure scripts fail with non-zero exit codes on errors