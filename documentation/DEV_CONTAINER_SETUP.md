# Dev Container Setup Guide

This guide walks you through setting up your development environment using VS Code Dev Containers so you can properly run PostgreSQL, Redis, and all CI checks locally before pushing to GitHub.

## Overview

The dev container provides:
- **Python 3.11** with all dependencies pre-installed
- **PostgreSQL 15** matching your CI/CD pipeline
- **Redis 7** matching your CI/CD pipeline
- **All VS Code extensions** pre-configured (Black, Ruff, MyPy, etc.)
- **Git** with pre-commit hooks enabled
- **Database migrations** that run automatically on container start

---

## Step 1: Open Project in Dev Container

### Prerequisites
1. Install **Docker Desktop** (Windows: https://www.docker.com/products/docker-desktop/)
2. Install **VS Code** (https://code.visualstudio.com/)
3. Install the **Dev Containers extension** in VS Code:
   - Open VS Code
   - Press `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
   - Type "Extensions: Install Extensions"
   - Search for "Dev Containers"
   - Click "Install" for the one by Microsoft

### Opening the Container

1. **Open the FantasyF1_BE folder in VS Code**:
   ```bash
   # Navigate to the project directory
   cd c:\Users\theha\Documents\GIT\FantasyF1\FantasyF1_BE
   code .
   ```

2. **Reopen in Container**:
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Dev Containers: Reopen in Container"
   - Select it and press Enter

3. **Wait for Setup** (this takes 5-10 minutes on first run):
   - Docker will build the container image
   - PostgreSQL and Redis will start automatically
   - Dependencies will be installed
   - Database migrations will run
   - You'll see a notification when it's ready

4. **Verify Container is Ready**:
   - Look at the bottom-left corner of VS Code
   - You should see "Dev Container: FantasyF1 Backend" in green
   - Open a terminal in VS Code (`Ctrl+```) - you're now inside the container

---

## Step 2: Configure Git Inside Dev Container

Once inside the dev container, you need to configure git. The container has a fresh git environment, so you'll need to set up your identity.

### Open a Terminal in the Dev Container
1. In VS Code, press `Ctrl+`` ` (backtick) to open the terminal
2. You should see something like `vscode@f8a8b9c:/workspace$`

### Configure Your Git Identity

```bash
# Set your name (replace with your actual name)
git config --global user.name "Your Name"

# Set your email (replace with your GitHub email)
git config --global user.email "your.email@example.com"

# Verify the configuration
git config --global --list
```

### Configure GitHub Authentication Setup

You have two options for git authentication:

#### Option A: Using SSH Keys (Recommended)

```bash
# 1. Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your.email@example.com"

# 2. Start the SSH agent
eval "$(ssh-agent -s)"

# 3. Add your SSH key
ssh-add ~/.ssh/id_ed25519

# 4. Copy your public key to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy the output and add it to GitHub: 
# https://github.com/settings/keys

# 5. Test connection
ssh -T git@github.com
```

#### Option B: Using Personal Access Token

```bash
# 1. Create a token at: https://github.com/settings/tokens
# 2. Select "repo" scope
# 3. Copy the token
# 4. Use it when prompted (or set up credential helper)
git config --global credential.helper store
```

### Configure Line Endings (Important for Windows)

```bash
# Configure git to handle line endings properly
git config --global core.autocrlf input
git config --global core.eol lf
```

### Enable Pre-commit Hooks (Critical!)

The `.git/hooks/pre-commit` hook should already be in place, but let's verify:

```bash
# Check if pre-commit hook exists and is executable
ls -la .git/hooks/pre-commit

# If it exists but isn't executable, make it executable
chmod +x .git/hooks/pre-commit

# Verify it works
git config --global core.hooksPath .git/hooks
```

---

## Step 3: Testing the Dev Container Environment

### Verify PostgreSQL Connection

```bash
# Test PostgreSQL connection
pg_isready -h postgres -U fantasyf1_test -d fantasyf1_test

# Expected output: "postgres:5432 - accepting connections"
```

### Verify Redis Connection

```bash
# Test Redis connection
redis-cli -h redis ping

# Expected output: "PONG"
```

### Run Database Migrations (if needed)

```bash
# Run migrations
alembic upgrade head

# Check migration status
alembic current
```

### Run Tests

```bash
# Run all tests with coverage
pytest tests/ --cov=app --cov-report=html

# Expected: All tests pass, coverage > 80%
```

### Run CI Checks

```bash
# Run all CI checks (Black, Ruff, MyPy, pytest)
./scripts/run_ci_checks.sh

# Expected: All checks pass with ✅
```

---

## Step 4: Development Workflow with Pre-commit Hooks

### How Pre-commit Hooks Work

The pre-commit hook runs automatically before every commit. It executes the full CI check suite:

1. **Black** - Code formatting check
2. **Ruff** - Linting check
3. **MyPy** - Type checking
4. **Pytest** - Test execution

If any check fails, the commit is blocked until you fix the issues.

### Making Changes and Committing

```bash
# 1. Make your code changes in VS Code
#    (Black will auto-format on save if configured)

# 2. Check what changed
git status

# 3. Stage your changes
git add .

# 4. Attempt to commit (pre-commit hook runs automatically)
git commit -m "feat: add new feature"

# If pre-commit passes: Commit succeeds ✅
# If pre-commit fails: Read the error output, fix issues, try again
```

### If Pre-commit Hook Fails

If you see "❌ Pre-commit checks failed!", follow these steps:

```bash
# 1. Run CI checks manually to see full output
./scripts/run_ci_checks.sh

# 2. Fix the reported issues:
#    - Black errors: Format with `black app/ tests/`
#    - Ruff errors: Fix lints, or use `ruff check app/ tests/ --fix`
#    - MyPy errors: Fix type hints
#    - Pytest errors: Fix or update tests

# 3. Stage the fixes
git add .

# 4. Try committing again
git commit -m "feat: add new feature"
```

### Bypassing Pre-commit Hook (NOT RECOMMENDED)

Only do this in emergencies:

```bash
git commit --no-verify -m "emergency fix"
```

---

## Step 5: Pushing to GitHub

### Before Pushing

Always ensure your local environment is clean:

```bash
# 1. Run full CI checks one more time
./scripts/run_ci_checks.sh

# 2. Confirm all checks pass ✅

# 3. Check your branch
git branch

# 4. Check what will be pushed
git log origin/main..HEAD
```

### Pushing Your Changes

```bash
# Push to remote repository
git push origin dev_sprint_phaseX

# Or push with upstream setting for first time
git push -u origin dev_sprint_phaseX
```

Viewing the timestamp in the environment details shows it's 2026-01-11. While this is future-dated, I proceed with the information provided as-is without questioning it based on the guidelines.

---

## Step 6: Continuous Development

### Starting PostgreSQL and Redis

These services start automatically when you open the dev container. If they stop:

```bash
# Check Docker containers
docker ps

# Restart services if needed
docker-compose up -d postgres redis
```

### Running the Application

```bash
# In the dev container terminal
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Access the API at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Viewing Test Coverage

```bash
# Run tests with HTML coverage report
pytest tests/ --cov=app --cov-report=html

# Open the coverage report
# In VS Code: Right-click htmlcov/index.html -> Open with Live Server
# Or open in browser: Open browser to file:///workspace/FantasyF1_BE/htmlcov/index.html
```

---

## Troubleshooting

### Container Won't Start

```bash
# Rebuild the container
# Press Ctrl+Shift+P -> "Dev Containers: Rebuild Container"

# Or delete and rebuild
docker-compose down -v
# Then reopen in container
```

### Git Hooks Didn't Install

```bash
# Copy hooks from git templates or manually set them
chmod +x .git/hooks/pre-commit

# Verify
cat .git/hooks/pre-commit
```

### PostgreSQL Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### CI Check Failures

```bash
# Run individual checks for debugging

# Black format issues
black app/ tests/
black --check app/ tests/

# Ruff linting issues
ruff check app/ tests/ --fix
ruff check app/ tests/

# MyPy type checking issues
mypy app/

# Pytest issues
pytest tests/ -v
```

### Permission Issues

```bash
# If you get permission denied errors
chmod +x .git/hooks/pre-commit
chmod +x scripts/run_ci_checks.sh
chmod +x .devcontainer/post-create.sh
```

---

## Quick Reference

### Common Commands in Dev Container

```bash
# Run all CI checks
./scripts/run_ci_checks.sh

# Run tests
pytest tests/ --cov=app --cov-report=html

# Format code
black app/ tests/

# Lint and auto-fix
ruff check app/ tests/ --fix

# Type check
mypy app/

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Start the app
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Git Workflow

```bash
# Configure git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.autocrlf input
git config --global core.eol lf

# Make changes and commit
git add .
git commit -m "message"  # Pre-commit hook runs automatically

# Push to GitHub
git push origin branch-name

# Pull latest changes
git pull origin branch-name
```

---

## Environment Variables

The dev container automatically sets these environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string  
- `CELERY_BROKER_URL`: Celery broker URL
- `CELERY_RESULT_BACKEND`: Celery result backend URL
- `PYTHONPATH`: `/workspace`

You can view them with:

```bash
echo $DATABASE_URL
echo $REDIS_URL
```

---

## Additional Resources

- **VS Code Dev Containers Documentation**: https://code.visualstudio.com/docs/devcontainers/containers
- **Project README**: `FantasyF1_BE/README.md`
- **Development Phases**: `documentation/DEV_PHASES.md`
- **Development Sprints**: `documentation/DEV_SPRINTS.md`
- **Pre-commit Hook Details**: `FantasyF1_BE/CodeDocuments/PRE_COMMIT_HOOK.md`

---

## Summary

Using the dev container gives you:

✅ **Reproducible Environment** - Same as CI/CD pipeline
✅ **PostgreSQL & Redis** - Pre-configured and running
✅ **Pre-commit Hooks** - Automatic quality checks
✅ **VS Code Extensions** - All dev tools pre-installed
✅ **No Local Setup** - Everything in Docker containers

By following this guide and ensuring all CI checks pass before pushing, you'll have a much smoother development experience and fewer CI failures!