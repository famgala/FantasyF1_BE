# Git Pre-Commit Hook Documentation

## Overview

This project includes a pre-commit git hook that automatically runs all CI checks before allowing a commit. If any checks fail, the commit will be blocked until the issues are fixed.

## Purpose

The pre-commit hook ensures that:

1. Code quality standards are maintained (Black formatting)
2. Linting rules pass (Ruff)
3. Type checking succeeds (mypy)
4. All tests pass with coverage (pytest)

This prevents committing code that would fail in CI, saving time and ensuring code quality.

## How It Works

When you run `git commit`, the pre-commit hook automatically:

1. Detects your operating system (Windows or Unix-like)
2. Runs the appropriate CI script (`run_ci_checks.bat` for Windows, `run_ci_checks.sh` for Unix)
3. Runs all 4 checks:
   - Black formatter check
   - Ruff linter
   - mypy type checker
   - pytest with coverage
4. If all checks pass, the commit proceeds
5. If any check fails, the commit is blocked with a clear error message

## Requirements

Before the pre-commit hook can run, ensure you have:

1. All project dependencies installed: `pip install -r requirements-dev.txt`
2. PostgreSQL and Redis running (for tests): `docker-compose up postgres redis`
3. All linting/testing tools available:
   - `black` (code formatter)
   - `ruff` (linter)
   - `mypy` (type checker)
   - `pytest` (test runner)

## Running Checks Manually

You can run the same checks manually before committing:

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

## Bypassing the Hook (NOT RECOMMENDED)

If you absolutely need to bypass the pre-commit hook (not recommended), use:

```bash
git commit --no-verify -m "your commit message"
```

This should only be used in emergencies, as it bypasses all code quality checks.

## Common Issues

### "run_ci_checks.bat/sh not found"

Ensure you're in the `FantasyF1_BE` directory when committing. The hook expects to find the CI scripts in the root of the Git repository.

### Checks Pass Some Time but Fail Others

This is usually due to:

- PostgreSQL/Redis not running
- Environment variables not set
- Dependencies not installed

Always ensure your dev environment is fully set up before committing.

### Black Check Failed

Run `black app/ tests/` to auto-format your code, then commit again.

### Ruff Check Failed

Run `ruff check app/ tests/ --fix` to auto-fix many issues, then manually fix the rest.

### mypy Check Failed

Check the error messages and add proper type hints to your code.

### pytest Failed

Ensure PostgreSQL and Redis are running with `docker-compose up postgres redis`, then check test failures for details.

## Troubleshooting

If the pre-commit hook isn't running:

1. Verify the hook file exists: `FantasyF1_BE/.git/hooks/pre-commit`
2. If using Git Bash/WSL on Windows, make it executable: `chmod +x .git/hooks/pre-commit`
3. Check the Git configuration: `git config core.hooksPath` (should be empty or `.git/hooks`)

## What Gets Checked

| Check | Tool | Purpose |
|-------|------|---------|
| Format | Black | Code styling consistency |
| Lint | Ruff | Code quality and potential issues |
| Types | mypy | Type annotations correctness |
| Tests | pytest | Functionality test suite coverage |

## CI Consistency

These checks match exactly what runs in GitHub Actions CI/CD. Passing the pre-commit hook means your code should pass the CI pipeline automatically.