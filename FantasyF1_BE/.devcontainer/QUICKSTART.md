# Quick Start Guide

## First Time Setup

1. **Install Prerequisites**:
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - [Docker Desktop](https://www.docker.com/products/docker-desktop) (or Docker Engine)

2. **Open in Container**:
   - Open this folder in VS Code
   - Press `F1` or `Ctrl+Shift+P` (Windows/Linux) / `Cmd+Shift+P` (Mac)
   - Select: **"Dev Containers: Reopen in Container"**
   - Wait for the container to build (first time takes a few minutes)

3. **Verify Setup**:
   ```bash
   # Check services are running
   pg_isready -h postgres -U fantasyf1_test
   redis-cli -h redis ping
   
   # Run tests
   pytest tests/ --cov=app -v
   ```

## Common Commands

```bash
# Run all tests
pytest tests/ --cov=app --cov-report=html

# Run specific test file
pytest tests/test_user_service.py -v

# Run CI checks
./run_ci_checks.sh

# Start development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "description"

# Format code
black app/ tests/

# Lint code
ruff check app/ tests/

# Type check
mypy app/
```

## Troubleshooting

### Services not starting
- Check Docker Desktop is running
- Restart the devcontainer: `F1` → "Dev Containers: Rebuild Container"

### Database connection errors
- Wait a few seconds for PostgreSQL to fully start
- Check logs: `docker logs fantasyf1_postgres_devcontainer`

### Port conflicts
- If ports 5432, 6379, or 8000 are in use, stop the conflicting services
- Or modify port mappings in `.devcontainer/docker-compose.yml`

### Migration errors
- Reset database: `alembic downgrade base && alembic upgrade head`
- Or drop and recreate: The postgres volume will be recreated on container rebuild

## Accessing Services

- **FastAPI**: http://localhost:8000
- **PostgreSQL**: localhost:5432
  - User: `fantasyf1_test`
  - Password: `test_password`
  - Database: `fantasyf1_test`
- **Redis**: localhost:6379

## Environment Variables

All environment variables are set automatically. They match the CI/CD configuration:
- `DATABASE_URL`: PostgreSQL connection
- `REDIS_URL`: Redis connection
- `CELERY_BROKER_URL`: Celery broker
- `CELERY_RESULT_BACKEND`: Celery results
