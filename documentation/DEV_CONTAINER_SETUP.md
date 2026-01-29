# FantasyF1 Development Container Setup Guide

This guide explains how to set up and use the FantasyF1 development container, which provides a complete isolated development environment with all necessary services.

## Overview

The dev container provides:
- **Isolated Services**: PostgreSQL, Redis, and MQTT run inside containers without exposing ports to the host
- **Co-existence**: Multiple development environments can run on the same machine without port conflicts
- **Consistency**: All developers use the same environment with the same tools and versions
- **Port Safety**: Only backend and flower ports are exposed to the host machine

## Architecture

### Services

| Service | Host Port | Internal Port | Notes |
|---------|-----------|---------------|-------|
| FastAPI Backend | 8002 | 8000 | Exposed for API access |
| Flower | 5555 | 5555 | Exposed for Celery monitoring |
| PostgreSQL | - | 5432 | Internal only |
| Redis | - | 6379 | Internal only |
| MQTT | - | 1883 | Internal only |
| Celery Worker | - | - | Internal only |
| Celery Beat | - | - | Internal only |

### Network Isolation

All services communicate internally through the `fantasyf1_dev_network`. Only the backend and flower services expose ports to the host machine, ensuring no conflicts with other development environments.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- VS Code (recommended) with Dev Containers extension
- Git

## Quick Start

### Option 1: VS Code Dev Container (Recommended)

1. Open the project in VS Code
2. When prompted, click "Reopen in Container"
3. Wait for the container to build and start
4. The dev container will automatically:
   - Install Python dependencies
   - Setup database migrations
   - Configure development tools

### Option 2: Manual Docker Compose

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Start the dev environment:
   ```bash
   chmod +x scripts/dev-start.sh
   ./scripts/dev-start.sh
   ```

3. To stop the environment:
   ```bash
   chmod +x scripts/dev-stop.sh
   ./scripts/dev-stop.sh
   ```

## Configuration

### Environment Variables

Edit `.env.dev` to customize your development environment:

```bash
# Ports (Only backend and flower are exposed)
BACKEND_PORT=8002      # Change if port 8002 is in use
FLOWER_PORT=5555       # Change if port 5555 is in use

# Database
POSTGRES_USER=fantasyf1_dev
POSTGRES_PASSWORD=dev_password_123
POSTGRES_DB=fantasyf1_dev

# Redis
REDIS_PASSWORD=dev_redis_123

# MQTT
MQTT_USERNAME=fantasyf1_dev
MQTT_PASSWORD=dev_mqtt_123

# Security (Change these for production)
SECRET_KEY=dev_secret_key_change_in_production
JWT_SECRET_KEY=dev_jwt_secret_key_change_in_production
```

### Resolving Port Conflicts

If you need to change ports to avoid conflicts:

1. Edit `.env.dev` and change `BACKEND_PORT` or `FLOWER_PORT`
2. Restart the dev environment:
   ```bash
   ./scripts/dev-stop.sh
   ./scripts/dev-start.sh
   ```

## Usage

### Running the Backend

The backend starts automatically when you open the dev container. You can manually start it with:

```bash
cd FantasyF1_BE
source venv/bin/activate  # In dev container, use source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests

```bash
cd FantasyF1_BE
pytest tests/
```

### Code Quality Checks

```bash
# Format code
black app/ tests/

# Lint code
ruff check app/ tests/ --fix

# Type check
mypy app/
```

### Database Access

Access PostgreSQL from inside the dev container:

```bash
# Connect to PostgreSQL
docker exec -it fantasyf1_dev_postgres psql -U fantasyf1_dev

# Run migrations
cd FantasyF1_BE
alembic upgrade head
```

### Redis Access

```bash
# Connect to Redis
docker exec -it fantasyf1_dev_redis redis-cli -a dev_redis_123
```

### Viewing Logs

```bash
# View all logs
docker-compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f celery_worker
```

### Monitoring Celery

Access Flower at: http://localhost:5555

## Troubleshooting

### Container Won't Start

1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check for port conflicts:
   ```bash
   netstat -an | grep 8002
   ```

3. View container logs:
   ```bash
   docker-compose -f docker-compose.dev.yml logs
   ```

### Database Connection Errors

1. Check PostgreSQL is healthy:
   ```bash
   docker exec fantasyf1_dev_postgres pg_isready -U fantasyf1_dev
   ```

2. Restart the environment:
   ```bash
   ./scripts/dev-stop.sh
   ./scripts/dev-start.sh
   ```

### Permission Issues

1. Ensure scripts are executable:
   ```bash
   chmod +x scripts/dev-start.sh
   chmod +x scripts/dev-stop.sh
   ```

2. Fix volume permissions:
   ```bash
   docker-compose -f docker-compose.dev.yml down -v
   docker-compose -f docker-compose.dev.yml up -d
   ```

### Clean Reset

To completely reset the development environment (this deletes all data):

```bash
./scripts/dev-stop.sh
docker-compose -f docker-compose.dev.yml down -v
rm -rf fantasyf1_dev_*
./scripts/dev-start.sh
```

## Development Workflow

### 1. Make Code Changes

Edit files in the `FantasyF1_BE` directory. Changes are reflected immediately thanks to volume mounts.

### 2. Run Tests

```bash
cd FantasyF1_BE
pytest tests/ --cov=app
```

### 3. Run Quality Checks

```bash
cd FantasyF1_BE
# Format
black app/ tests/
# Lint
ruff check app/ tests/ --fix
# Type check
mypy app/
```

### 4. Commit Changes

```bash
git add .
git commit -m "Your commit message"
```

### 5. Push Changes

```bash
git push origin <your-branch>
```

## Multiple Environments

To run multiple FantasyF1 development environments on the same machine:

1. Copy the project to a new directory
2. Edit `.env.dev` and change exposed ports:
   ```bash
   BACKEND_PORT=8001
   FLOWER_PORT=5556
   ```
3. Start the new environment:
   ```bash
   ./scripts/dev-start.sh
   ```

Each environment will have:
- Its own isolated PostgreSQL database
- Its own Redis instance
- Its own MQTT broker
- Unique exposed ports

## Performance Tips

1. **Use Bind Mounts**: The dev setup uses bind mounts for code, so changes are instant
2. **Disable Unneeded Services**: Comment out services you don't need in `docker-compose.dev.yml`
3. **Increase Resources**: In Docker Desktop, increase memory allocation for better performance

## Security Notes

- This is a development environment
- Default passwords are weak and should not be used in production
- Never commit `.env` or `.env.dev` files
- All services run in an isolated Docker network
- Only necessary ports are exposed to the host

## Useful Commands Reference

```bash
# Start environment
./scripts/dev-start.sh

# Stop environment
./scripts/dev-stop.sh

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Access database
docker exec -it fantasyf1_dev_postgres psql -U fantasyf1_dev

# Run migrations
cd FantasyF1_BE && alembic upgrade head

# Run tests
cd FantasyF1_BE && pytest tests/

# Format code
cd FantasyF1_BE && black app/ tests/

# Lint code
cd FantasyF1_BE && ruff check app/ tests/

# Type check
cd FantasyF1_BE && mypy app/
```

## API Documentation

Once the backend is running, access the API documentation at:
- Swagger UI: http://localhost:8002/docs
- ReDoc: http://localhost:8002/redoc
- OpenAPI JSON: http://localhost:8002/openapi.json

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review container logs
3. Check the main README.md
4. Open an issue on GitHub

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [VS Code Dev Containers](https://code.visualstudio.com/docs/devcontainers/containers)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Celery Documentation](https://docs.celeryq.dev/)
