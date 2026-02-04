# FantasyF1

A fantasy Formula 1 racing game built with FastAPI backend, featuring real-time F1 data integration, team management, draft system, and league competition.

## 🚀 Quick Start

### Using VS Code Dev Container (Recommended)

1. Clone the repository and open in VS Code
2. Install the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
3. When prompted, click "Reopen in Container"
4. The dev container will automatically set up everything for you

### Using Docker Compose

**Windows:**
```bash
# Copy environment file
copy .env.example .env.dev

# Start the dev environment
scripts\dev-start.bat
```

**Linux/Mac:**
```bash
# Copy environment file
cp .env.example .env.dev

# Make scripts executable
chmod +x scripts/dev-start.sh scripts/dev-stop.sh

# Start the dev environment
./scripts/dev-start.sh
```

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose installed
- (Optional) VS Code with Dev Containers extension

## 🏗️ Architecture

### Services

| Service | Host Port | Internal Port | Status |
|---------|-----------|---------------|--------|
| FastAPI Backend | 8000 | 8000 | ✅ Exposed |
| Flower (Celery Monitor) | 5555 | 5555 | ✅ Exposed |
| PostgreSQL | - | 5432 | 🔒 Internal only |
| Redis | - | 6379 | 🔒 Internal only |
| MQTT | - | 1883 | 🔒 Internal only |
| Celery Worker | - | - | 🔄 Internal |
| Celery Beat | - | - | 🔄 Internal |

**Note:** Only Backend and Flower ports are exposed to the host machine. This allows multiple development environments to co-exist without port conflicts.

### Tech Stack

- **Backend:** FastAPI, Python 3.11+
- **Database:** PostgreSQL 15
- **Cache:** Redis 7
- **Message Broker:** MQTT (Eclipse Mosquitto)
- **Queue:** Celery
- **Testing:** pytest, pytest-asyncio
- **Code Quality:** Black, Ruff, MyPy

## 📖 Documentation

- [Dev Container Setup Guide](documentation/DEV_CONTAINER_SETUP.md) - Detailed setup and usage instructions
- [Backend Architecture](documentation/backend/01-architecture.md) - Backend system design
- [API Documentation](documentation/backend/04-api_endpoints.md) - Available API endpoints
- [Development Phases](documentation/DEV_PHASES.md) - Roadmap and implementation phases
- [CI/CD Setup](documentation/CI_CD_SETUP.md) - Continuous integration and deployment

## 🔧 Development

### Running Tests

```bash
cd FantasyF1_BE
pytest tests/ --cov=app
```

### Code Quality Checks

```bash
cd FantasyF1_BE

# Format code
black app/ tests/

# Lint code
ruff check app/ tests/ --fix

# Type check
mypy app/
```

### Running the Backend

The backend starts automatically with the dev container. You can access it at:
- API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- API Docs (ReDoc): http://localhost:8000/redoc

### Database Migrations

```bash
cd FantasyF1_BE
alembic upgrade head
```

## 🛠️ Useful Commands

```bash
# Start dev environment
./scripts/dev-start.sh          # Linux/Mac
scripts\dev-start.bat           # Windows

# Stop dev environment
./scripts/dev-stop.sh           # Linux/Mac
scripts\dev-stop.bat            # Windows

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Access PostgreSQL
docker exec -it fantasyf1_dev_postgres psql -U fantasyf1_dev

# Access Redis
docker exec -it fantasyf1_dev_redis redis-cli -a dev_redis_123

# Restart backend
docker-compose -f docker-compose.dev.yml restart backend
```

## 🔧 Configuration

Edit `.env.dev` to customize your development environment:

```bash
#Ports (Only these are exposed to host)
BACKEND_PORT=8000      # Change if port 8000 is in use
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
```

## 🌐 Multiple Environments

To run multiple FantasyF1 development environments on the same machine:

1. Copy the project to a new directory
2. Edit `.env.dev` and change exposed ports:
   ```bash
   BACKEND_PORT=8001
   FLOWER_PORT=5556
   ```
3. Start the new environment

Each environment will have:
- Its own isolated PostgreSQL database
- Its own Redis instance
- Its own MQTT broker
- Unique exposed ports

## 🔒 Security

- This is a development environment
- Default passwords are weak and should never be used in production
- Never commit `.env` or `.env.dev` files
- All services run in an isolated Docker network
- Only necessary ports are exposed to the host

## 📝 Project Structure

```
FantasyF1/
├── .devcontainer/              # Dev container configuration
│   ├── devcontainer.json       # VS Code dev container config
│   └── post-create.sh          # Setup script for container
├── FantasyF1_BE/               # Backend application
│   ├── app/                    # Source code
│   ├── tests/                  # Test suite
│   ├── alembic/                # Database migrations
│   ├── Dockerfile              # Backend Docker image
│   └── docker-compose.yml      # Backend services
├── documentation/              # Project documentation
├── scripts/                    # Utility scripts
│   ├── dev-start.sh            # Start dev env (Linux/Mac)
│   ├── dev-stop.sh             # Stop dev env (Linux/Mac)
│   ├── dev-start.bat           # Start dev env (Windows)
│   └── dev-stop.bat            # Stop dev env (Windows)
├── docker-compose.dev.yml      # Dev environment services
├── Dockerfile.dev              # Dev container image
└── .env.dev                    # Dev environment variables
```

## 🧪 Testing

The project uses pytest with pytest-asyncio for testing. Test coverage is tracked and should exceed 80%.

```bash
cd FantasyF1_BE
pytest tests/ --cov=app --cov-report=html
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Install git hooks (see below)
4. Make your changes
5. Run tests and quality checks
6. Commit your changes (pre-commit hooks will run automatically)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Installing Git Hooks

The project uses pre-commit hooks to ensure code quality before committing.

**Windows:**
```bash
scripts\install-githooks.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/install-githooks.sh
./scripts/install-githooks.sh
```

The pre-commit hook will automatically:
- Run Black formatter check
- Run Ruff linter
- Run MyPy type checker
- Run pytest (when test files change)
- Run ESLint and TypeScript checks (for frontend)
- Test frontend build (when source files change)

To skip the hook (not recommended):
```bash
git commit --no-verify
```

### Pre-commit Requirements

Before committing, ensure all checks pass:

```bash
cd FantasyF1_BE
# Format
black app/ tests/
# Lint
ruff check app/ tests/
# Type check
mypy app/
# Test
pytest tests/
```

For frontend changes:
```bash
cd frontend
# Lint
npm run lint
# Type check
npx tsc --noEmit
# Build
npm run build
```

## 📦 Features

- ✅ FastAPI backend with async support
- ✅ PostgreSQL database with Alembic migrations
- ✅ Redis caching and message queue
- ✅ MQTT for real-time updates
- ✅ Celery for background tasks
- ✅ Comprehensive test suite
- ✅ API documentation with Swagger/ReDoc
- ✅ Code quality tools (Black, Ruff, MyPy)
- ✅ Isolated dev environment with Docker
- ✅ Support for multiple concurrent dev environments

## 🚀 Deployment Strategy

This project uses a three-environment deployment strategy: Development, Test (Staging), and Production.

- **Development**: Local development on `dev/*` branches (e.g., `dev/fix-frontend-registration`) with no CI builds
- **Test**: Staging on `test/*` branches (e.g., `test/fix-frontend-registration`) with CI builds and test-tagged images
- **Production**: Live on `main` branch with CI builds and latest-tagged images

**Deployment Flow:**
```
dev/issue_or_feature_name → PR → test/issue_or_feature_name → PR → main
```

See [documentation/DEPLOYMENT_STRATEGY.md](documentation/DEPLOYMENT_STRATEGY.md) for complete details.
See [documentation/DEPLOYMENT_QUICK_START.md](documentation/DEPLOYMENT_QUICK_START.md) for quick reference.

## � License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
1. Check the [Dev Container Setup Guide](documentation/DEV_CONTAINER_SETUP.md)
2. Review [troubleshooting documentation](documentation/DEV_CONTAINER_SETUP.md#troubleshooting)
3. Check container logs
4. Open an issue on GitHub

## �🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Docker](https://www.docker.com/) - Container platform
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Cache and message broker
- [Jolpica F1 API](https://jolpica.f1jersey.com/docs) - F1 data source
