# Pre-commit Check System

## Overview

This project has a fast, automated pre-commit check system that runs before each commit to catch code quality issues early. The checks are designed to complete in under 30 seconds while providing high confidence that CI will pass.

## What Gets Checked

### Backend (FantasyF1_BE)
- **Black** - Python code formatting (target line length: 100)
- **Ruff** - Python code linting and quality checks
- **MyPy** - Python static type checking

### Frontend
- **ESLint** - JavaScript/TypeScript code linting
- **TypeScript** - Type checking with `tsc --noEmit`

## Installation

### Windows
Run from repository root:
```batch
scripts\install-precommit-hooks.bat
```

### Linux/Mac/WSL
Run from repository root:
```bash
chmod +x scripts/install-precommit-hooks.sh
./scripts/install-precommit-hooks.sh
```

## Usage

### Automatic (Recommended)
The pre-commit hooks run automatically when you run `git commit`. If any checks fail, the commit is aborted and you'll see instructions on how to fix the issues.

### Manual Testing
To run precommit checks manually without committing:

**Windows:**
```batch
cd FantasyF1_BE
scripts\run_precommit_checks.bat
```

**Linux/Mac/WSL:**
```bash
cd FantasyF1_BE
./scripts/run_precommit_checks.sh
```

### Full CI Checks (with Tests)
For complete validation including pytest tests:

**Windows:**
```batch
cd FantasyF1_BE
scripts\run_ci_checks.bat
```

**Linux/Mac/WSL:**
```bash
cd FantasyF1_BE
./scripts/run_ci_checks.sh
```

## Fixing Issues

### Backend

**Fix formatting:**
```bash
cd FantasyF1_BE
black app/ tests/ --line-length=100
```

**Fix linting:**
```bash
cd FantasyF1_BE
ruff check app/ tests/ --fix
```

**Check type issues:**
```bash
cd FantasyF1_BE
mypy app/
```

**Fix All:**
```bash
cd FantasyF1_BE
black app/ tests/ --line-length=100 && \
ruff check app/ tests/ --fix
```

### Frontend

**Fix linting:**
```bash
cd frontend
npm run lint
```

**Check type issues:**
```bash
cd frontend
npx tsc --noEmit
```

## Performance

- **Pre-commit (fast):** ~10-20 seconds
  - Pure static analysis
  - No test execution required
  - Catches most code quality issues

- **Full CI (with tests):** ~1-2 minutes
  - All pre-commit checks
  - Pytest with coverage
  - Security scans

## CI Pipeline

The GitHub Actions CI runs all pre-commit checks PLUS:
- Pytest with coverage reporting
- Docker build tests
- Security vulnerability scans

## Troubleshooting

### "Black check failed"
Run: `cd FantasyF1_BE && black app/ tests/ --line-length=100`

### "Ruff check failed"
Run: `cd FantasyF1_BE && ruff check app/ tests/ --fix`

### "mypy check failed"
Run: `cd FantasyF1_BE && mypy app/` to see specific errors

### "ESLint failed"
Run: `cd frontend && npm run lint`

### "TypeScript check failed"
Run: `cd frontend && npx tsc --noEmit`

## File Locations

- **Windows pre-commit hook:** `.git/hooks/pre-commit.bat`
- **Linux/Mac pre-commit hook:** `.git/hooks/pre-commit`
- **Backend check script:** `FantasyF1_BE/scripts/run_precommit_checks.bat` (or `.sh`)
- **Full CI check script:** `FantasyF1_BE/scripts/run_ci_checks.bat` (or `.sh`)

## Compliance

Before any git commit:
1. ✅ Pre-commit hook runs automatically (~10-20 seconds)
2. ✅ ALL checks must pass 100%
3. ✅ Fix failures, re-commit until 100% pass
4. ✅ Only then push to remote

GitHub CI will run full validation including tests before allowing merge.