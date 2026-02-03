# CI/CD Pipeline Setup Documentation

## Overview

This document describes the CI/CD pipeline setup for the FantasyF1 project, including GitHub Actions workflow and pre-commit hooks.

## GitHub Actions Workflow

The CI pipeline is configured in `.github/workflows/ci.yml` and includes:

### Trigger Conditions

The workflow triggers on:
- **Push events** to branches: `main`, `dev_sprint_phase**`, `develop`, `backend-dev`, `frontend-dev`
- **Pull requests** to `main` branch

### Path-Based Conditional Execution

The workflow uses `dorny/paths-filter@v2` to detect which parts of the codebase changed and only runs relevant tests and builds:

#### Backend Changes
- Runs when files in `FantasyF1_BE/**` change
- Includes: source code, requirements, Dockerfile, docker-compose files
- Excludes: test files (handled separately)
- Triggers:
  1. Backend tests (Black, Ruff, MyPy, pytest)
  2. Backend Docker image build
  3. Backend security scan (Trivy)

#### Frontend Changes
- Runs when files in `frontend/**` change
- Includes: source files (`src/`, `public/`) and config files (`package.json`, `tsconfig*.json`, etc.)
- Triggers:
  1. Frontend tests (ESLint, TypeScript check)
  2. Frontend build
  3. Frontend Docker image build

#### Test Changes
- Runs when files in `FantasyF1_BE/tests/**` change
- Triggers backend test suite

#### Workflow Changes
- Runs when `.github/workflows/**` changes
- Triggers all checks to validate workflow changes

### Jobs

#### 1. detect-changes
- Runs on all pushes and PRs
- Detects which files changed using path filters
- Outputs flags for subsequent jobs

#### 2. test-backend
- Runs when backend files, tests, dockerfiles, compose files, or workflow files change
- Steps:
  - Checkout code
  - Log in to Docker Hub
  - Build backend image locally
  - Create .env file for testing
  - Start services with docker-compose.test.yml
  - Wait for services to be healthy (PostgreSQL, Redis, Backend)
  - Show service logs
  - Run Black formatter check
  - Run Ruff linter
  - Run MyPy type checker
  - Run pytest with coverage
  - Upload coverage reports
  - Cleanup test containers

#### 3. test-frontend
- Runs when frontend files or workflow files change
- Steps:
  - Checkout code
  - Setup Node.js 20
  - Install frontend dependencies
  - Run ESLint
  - Run TypeScript type check
  - Build frontend
  - Upload frontend build artifacts

#### 4. build-backend
- Runs on push events when backend files change
- Depends on: detect-changes, test-backend
- Steps:
  - Checkout repository
  - Generate version (CalVer format with branch and SHA)
  - Setup Docker Buildx
  - Log in to Docker Hub
  - Extract metadata
  - Build and push Docker image
  - Print image summary

#### 5. build-frontend
- Runs on push events when frontend files change
- Depends on: detect-changes, test-frontend
- Steps:
  - Checkout repository
  - Setup Node.js 20
  - Generate version
  - Install dependencies
  - Build frontend
  - Upload build artifacts
  - Build and push Docker image
  - Print image summary

#### 6. security-scan-backend
- Runs on push events when backend files change
- Depends on: detect-changes, build-backend
- Steps:
  - Checkout repository
  - Pull Docker image for scanning
  - Run Trivy vulnerability scanner
  - Upload scan results as artifacts
  - Display scan summary

### Docker Images

#### Backend Image
- Registry: `docker.io/famgala/fantasyf1-be`
- Tags:
  - Branch name (e.g., `main`, `dev_sprint_phase1`)
  - SHA prefix (e.g., `main-d387b57`)
  - Version (e.g., `2025.02.03-dev-d387b57`)
  - `latest` (for default branch)

#### Frontend Image
- Registry: `docker.io/famgala/fantasyf1-fe`
- Tags:
  - Version (e.g., `2025.02.03-dev-d387b57`)
  - Branch name
  - `latest-{branch}`

### Artifacts

#### Coverage Reports
- Backend coverage uploaded to Codecov
- XML format for CI summary

#### Frontend Build
- Uploaded as `frontend-dist-{version}`
- Retention: 30 days
- Path: `frontend/dist/`

#### Security Scans
- Backend Trivy results: `trivy-backend-security-scan`
- Format: SARIF
- Retention: 30 days

## Pre-commit Hook

### Installing Git Hooks

The project uses git hooks to enforce code quality checks before commits. The hooks are stored in both the `.githooks` directory (version-controlled) and the `.git/hooks` directory (local Git hooks).

#### Installation

The installation scripts copy hooks from `.githooks` to `.git/hooks`:

**Linux/Mac:**
```bash
chmod +x scripts/install-githooks.sh
./scripts/install-githooks.sh
```

**Windows:**
```bash
.\scripts\install-githooks.bat
```

This method ensures hooks work reliably across all platforms including Windows Git Bash, Git CMD, and other Git clients.

The pre-commit hook runs before each commit.

### Purpose

Ensures code quality by running CI checks based on what files are being committed.

### Behavior

The hook:
1. Gets the list of staged files
2. Detects whether backend or frontend files changed
3. Runs relevant checks based on changes

### Backend Checks

When backend files are staged:
1. **Black formatter check** - Validates code formatting
   - Fix: `black app/ tests/`

2. **Ruff linter** - Checks for code issues
   - Fix: `ruff check app/ tests/ --fix`

3. **MyPy type checker** - Validates type hints
   - Fix: `mypy app/`

4. **pytest** - Only runs if test files or service files changed
   - Runs with coverage
   - Fix: `pytest tests/ --cov=app`

### Frontend Checks

When frontend files are staged:
1. **ESLint** - Validates JavaScript/TypeScript code
   - Fix: `npm run lint`

2. **TypeScript type check** - Validates types
   - Fix: `npx tsc --noEmit`

3. **Build test** - Only runs if source files changed
   - Tests that the build succeeds
   - Fix: `npm run build`

### Usage

The hook runs automatically on:
```bash
git commit
```

To skip the hook (not recommended):
```bash
git commit --no-verify
```

### Output Examples

#### All Checks Pass
```
============================================
Running Pre-commit Checks
============================================

📋 Changed files detected:
  ✅ Backend files changed
  ✅ Frontend files changed

============================================
Running Backend Checks
============================================

[1/4] Running Black formatter check...
✅ Black check passed

[2/4] Running Ruff linter...
✅ Ruff check passed

[3/4] Running MyPy type checker...
✅ MyPy check passed

[4/4] Running pytest...
✅ pytest passed

============================================
Running Frontend Checks
============================================

[1/3] Running ESLint...
✅ ESLint passed

[2/3] Running TypeScript type check...
✅ TypeScript check passed

[3/3] Testing frontend build...
✅ Frontend build succeeded

============================================
✅ All pre-commit checks passed!
You're ready to commit your changes.
============================================
```

#### Checks Fail
```
============================================
❌ Some pre-commit checks failed.
Please fix the issues above before committing.

💡 Tips:
  - Run 'bash FantasyF1_BE/scripts/run_ci_checks.sh' for backend checks
  - Run 'cd frontend && npm run lint && npm run build' for frontend checks
============================================
```

## Frontend Dockerfile

The frontend Dockerfile (`frontend/Dockerfile`) uses a multi-stage build:

### Build Stage
- Base: `node:20-alpine`
- Installs production dependencies
- Builds the application with `npm run build`

### Production Stage
- Base: `nginx:alpine`
- Copies built assets to nginx
- Exposes port 80
- Includes health check
- Runs nginx in daemon mode

### Build Commands

Local build:
```bash
docker build -t fantasyf1-fe:local frontend/
```

Build and push:
```bash
docker build -t famgala/fantasyf1-fe:latest frontend/
docker push famgala/fantasyf1-fe:latest
```

## Running CI Checks Locally

### Backend

Run all backend CI checks:
```bash
cd FantasyF1_BE
bash scripts/run_ci_checks.sh
```

Or run individual checks:
```bash
# Format check
black --check app/ tests/

# Lint
ruff check app/ tests/

# Type check
mypy app/

# Tests
pytest tests/ --cov=app
```

### Frontend

Run all frontend checks:
```bash
cd frontend
npm run lint      # ESLint
npm run build     # Build
```

Or run individual checks:
```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Troubleshooting

### Pre-commit Hook Issues

#### Hook not executable (Windows)
On Windows, Git hooks may have permission issues. Ensure Git has execute permissions:
```bash
git config core.hooksPath .git/hooks
```

#### Hook too slow
To speed up commits, you can:
- Skip specific checks by modifying the hook
- Use `git commit --no-verify` to bypass entirely (not recommended)

#### Hook fails but tests pass locally
Ensure you have all dependencies installed:
```bash
# Backend
cd FantasyF1_BE
pip install -r requirements-dev.txt

# Frontend
cd frontend
npm install
```

### CI Workflow Issues

#### Jobs not running when expected
Check the `detect-changes` job logs to see which files were detected as changed.

#### Docker build fails
Check:
1. Dockerfile is present and valid
2. All files are committed to the repository
3. Docker Hub credentials are configured in GitHub Secrets

#### Tests fail in CI but pass locally
Common causes:
1. Environment differences (use the same Node.js/Python versions)
2. Missing dependencies (ensure `npm ci` and `pip install` are used)
3. Database connection issues (CI uses docker-compose.test.yml)

### Secrets Configuration

Ensure these GitHub Secrets are configured:
- `DOCKER_HUB_USERNAME`: Docker Hub username
- `DOCKER_HUB_ACCESS_TOKEN`: Docker Hub access token

## Best Practices

1. **Always run pre-commit hook**: Don't use `--no-verify` unless absolutely necessary
2. **Keep dependencies updated**: Regular update `package.json` and `requirements.txt`
3. **Test before pushing**: Use local CI check scripts before pushing
4. **Monitor CI results**: Check GitHub Actions results after each push
5. **Fix failing tests immediately**: Don't build on top of failing tests
6. **Use semantic versioning**: Follow the versioning scheme in the workflow

## Versioning Scheme

The CI pipeline uses CalVer (Calendar Versioning) format:

```
YYYY.MM.DD-{branch}-{git-sha}
```

Example:
- `2025.02.03-prod-d387b57` (production)
- `2025.02.03-dev-d387b57` (development)
- `2025.02.03-staging-d387b57` (staging)

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Documentation](https://docs.docker.com/build/)
- [pytest Documentation](https://docs.pytest.org/)
- [Vite Documentation](https://vitejs.dev/)