# Dev Container Setup

This devcontainer configuration provides a complete development environment with:
- Python 3.11
- PostgreSQL 15 (matching CI/CD)
- Redis 7 (matching CI/CD)
- All development dependencies pre-installed

## Getting Started

1. **Open in VS Code**: 
   - Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
   - Open the command palette (Ctrl+Shift+P / Cmd+Shift+P)
   - Select "Dev Containers: Reopen in Container"

2. **Wait for setup**: 
   - The container will build and start PostgreSQL and Redis
   - Dependencies will be installed automatically
   - Database migrations will run automatically

3. **Run tests**:
   ```bash
   pytest tests/ --cov=app --cov-report=html
   ```

4. **Run the application**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Services

- **PostgreSQL**: Available at `localhost:5432`
  - User: `fantasyf1_test`
  - Password: `test_password`
  - Database: `fantasyf1_test`

- **Redis**: Available at `localhost:6379`

- **FastAPI**: Available at `localhost:8000` (when running)

## Environment Variables

The following environment variables are automatically set:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `CELERY_BROKER_URL`: Celery broker URL
- `CELERY_RESULT_BACKEND`: Celery result backend URL

## Running CI Checks

All CI checks can be run locally:
```bash
# Format check
black --check app/ tests/

# Lint check
ruff check app/ tests/

# Type check
mypy app/

# Run all checks
./run_ci_checks.sh  # Linux/Mac
run_ci_checks.bat   # Windows
```

## Database Migrations

Migrations run automatically on container creation. To run manually:
```bash
alembic upgrade head
```

To create a new migration:
```bash
alembic revision --autogenerate -m "description"
```
