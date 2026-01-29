# CI/CD Setup Guide

## Overview

This document describes the CI/CD pipeline setup for the FantasyF1 project. The pipeline is designed to automatically test, build, and push Docker images to Docker Hub when code is pushed to specific branches.

## Architecture

The project uses a containerized architecture with the following services:

1. **PostgreSQL** - Primary database
2. **Redis** - Caching and message broker
3. **Mosquitto** - MQTT broker for real-time messaging
4. **Backend** - FastAPI application
5. **Celery Worker** - Background task processing
6. **Celery Beat** - Scheduled task management
7. **Flower** - Celery task monitoring

## Docker Compose Files

### `docker-compose.test.yml`

Used for CI/CD testing and automated testing. Includes:
- PostgreSQL with test credentials
- Redis with test credentials
- Mosquitto with dynamically generated config
- Backend service with test environment variables

**Usage:**
```bash
docker compose -f docker-compose.test.yml up --build
docker compose -f docker-compose.test.yml down -v
```

### `docker-compose.yml`

Used for production deployment. Includes all services:
- PostgreSQL with persistent storage
- Redis with persistent storage
- Mosquitto with persistent storage
- Backend service
- Celery Worker, Beat, and Flower

**Usage:**
```bash
# Copy .env.example to .env and configure
cp .env.example .env

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down

# Stop and remove volumes (data loss)
docker compose down -v
```

## GitHub Actions CI Pipeline

### Workflow Trigger

The CI pipeline runs on:
- **Push** to: `main`, `develop`, or `dev_sprint_phase*` branches
- **Pull Request** to: `main` branch
- Only when paths in backend code, Docker Compose files, workflows, or requirements change

### Pipeline Jobs

#### 1. Detect Changes

Detects which files have changed to optimize pipeline execution:
- Backend code changes
- Dockerfile changes
- Docker Compose changes
- Test changes
- Workflow changes

#### 2. Test

Runs comprehensive tests:
- Builds Docker image locally
- Starts all services (postgres, redis, mosquitto, backend)
- Waits for services to be healthy
- Runs linting (Black, Ruff, MyPy)
- Runs pytest with coverage
- Uploads coverage reports to Codecov
- Cleans up containers

**Environment Variables:**
- `SECRET_KEY`, `JWT_SECRET_KEY` - Test keys
- `POSTGRES_*` - Test database credentials
- `REDIS_PASSWORD` - Test Redis password
- `MQTT_*` - Test MQTT credentials

#### 3. Build

Builds and pushes Docker image to Docker Hub:
- Runs only on push (not PRs)
- Only if backend, Dockerfile, or compose files changed
- Generates CalVer version (YYYY.MM.DD-BUILD_TYPE)
- Pushes multiple tags (branch, version, latest)
- Uses GitHub Actions cache for faster builds

**Version Format:**
- Main branch: `2026.01.19-abc1234`
- Dev branches: `2026.01.19-dev-abc1234`
- Develop branch: `2026.01.19-staging-abc1234`

#### 4. Security Scan

Scans the built image for vulnerabilities:
- Pulls the built image
- Runs Trivy scanner for CRITICAL and HIGH vulnerabilities
- Uploads SARIF results as artifacts
- Retains artifacts for 30 days

## Setup Instructions

### 1. Repository Secrets

Configure the following secrets in your GitHub repository settings:

- **DOCKER_HUB_USERNAME**: Your Docker Hub username
- **DOCKER_HUB_ACCESS_TOKEN**: Your Docker Hub access token

**To create Docker Hub access token:**
1. Go to Docker Hub > Account Settings > Security > New Access Token
2. Grant read/write access
3. Copy the token
4. Add it as a secret in GitHub repository settings

### 2. Environment Variables

For local development:

```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
# Set secret keys, passwords, and other configuration
```

Required environment variables:

```bash
# Security
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here

# Database
POSTGRES_USER=fantasyf1_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=fantasyf1_db

# Redis
REDIS_PASSWORD=your_redis_password

# MQTT
MQTT_USERNAME=your_mqtt_username
MQTT_PASSWORD=your_mqtt_password

# Application
ENVIRONMENT=development
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

### 3. Local Development

**Start services:**
```bash
docker compose -f docker-compose.yml up -d
```

**View logs:**
```bash
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f redis
```

**Run tests locally:**
```bash
cd FantasyF1_BE
pytest tests/ -v --cov=app
```

**Run CI checks:**
```bash
cd FantasyF1_BE
.\scripts\run_ci_checks.bat   # Windows
./scripts/run_ci_checks.sh    # Linux/Mac
```

**Stop services:**
```bash
docker compose down
```

### 4. Mosquitto Initialization

The `init-mosquitto-test.sh` script dynamically generates Mosquitto configuration for testing. It:
- Creates `mosquitto.conf` with authentication settings
- Generates password file with credentials from environment variables
- Sets appropriate permissions
- Starts the MQTT broker

## CI Pipeline Behavior

### Smart Rebuilding

The pipeline only rebuilds when necessary:
- **Backend code changes**: Rebuild image, run tests
- **Dockerfile changes**: Rebuild image, run tests
- **Compose file changes**: Rebuild image, run tests
- **Test changes**: Run tests only
- **Other files**: Skip pipeline

### Push to Branches

- **main**: Runs all tests, builds image, tags as `latest` and version, pushes to Docker Hub
- **develop**: Runs all tests, builds image, tags with staging version, pushes to Docker Hub
- **dev_sprint_phase\***: Runs all tests, builds image, tags with dev version, pushes to Docker Hub

### Pull Requests

- Runs all tests but does not build or push images
- Provides feedback before merging

## Troubleshooting

### Pipeline Fails to Start Services

**Issue**: Services timeout waiting for health checks

**Solutions:**
- Check service logs in the "Show service logs if healthy" step
- Verify docker-compose.test.yml configuration
- Ensure all required environment variables are set

### Docker Build Fails

**Issue**: Build step fails during pipeline

**Solutions:**
- Check Dockerfile syntax and dependencies
- Verify all files are in the correct locations
- Check for missing or corrupted requirements.txt files

### Tests Fail in CI But Pass Locally

**Common causes:**
- Environment differences between CI and local
- Race conditions in tests
- Database connection issues

**Solutions:**
- Ensure services are fully ready before tests run
- Add appropriate sleep/wait timeouts in tests
- Check test isolation and cleanup

### Docker Hub Authentication Fails

**Issue**: Unable to push to Docker Hub

**Solutions:**
- Verify DOCKER_HUB_USERNAME and DOCKER_HUB_ACCESS_TOKEN secrets
- Check that access token has write permissions
- Ensure Docker Hub repository exists (create manually if needed)

### Mosquitto Connection Issues

**Issue**: Backend cannot connect to MQTT broker

**Solutions:**
- Verify init-mosquitto-test.sh is executable
- Check MQTT_USERNAME and MQTT_PASSWORD environment variables
- Review Mosquitto logs for authentication errors

## Best Practices

1. **Always run CI checks locally before pushing**
   ```bash
   cd FantasyF1_BE && ./scripts/run_ci_checks.sh
   ```

2. **Use feature branches for development**
   - Work on `dev_sprint_phaseX` branches
   - Create branches from appropriate parent
   - Test thoroughly before pushing

3. **Keep secrets secure**
   - Never commit .env files
   - Use GitHub repository secrets
   - Rotate Docker Hub tokens regularly

4. **Monitor pipeline health**
   - Check run history for patterns
   - Review security scan results
   - Track test coverage trends

5. **Optimize pipeline performance**
   - Use GitHub Actions cache effectively
   - Minimize unnecessary rebuilds
   - Parallelize independent jobs when possible

## Security Considerations

1. **Secrets Management**
   - Never hardcode credentials in code
   - Use GitHub repository secrets
   - Rotate credentials regularly

2. **Image Security**
   - Run automated security scans (Trivy)
   - Review and address vulnerabilities
   - Use minimal base images

3. **Container Hardening**
   - Run containers as non-root users
   - Use security_opt no-new-privileges
   - Limit container capabilities

4. **Network Security**
   - Use separate networks for services
   - Restrict inter-service communication
   - Configure proper firewalls in production

## Future Improvements

- Add frontend container to docker-compose.yml
- Implement automated deployment staging
- Add performance testing to CI pipeline
- Set up automated dependency scanning
- Create rollback mechanisms for failed deployments
- Add integration tests with external APIs

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
