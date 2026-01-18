# Fantasy F1 Project Dev Startup MVP

## Document Overview

This document provides a comprehensive roadmap for getting the Fantasy F1 project off the ground, enabling developers to quickly onboard and begin building the application. It covers all architectural decisions, tooling, workflows, and step-by-step procedures necessary for project success.

---

## Project Vision

**Fantasy F1** will be a fantasy sports management platform for Formula 1 racing, allowing users to create teams, track drivers, compete in leagues, and manage their fantasy racing experience.

### Core Objectives

1. **Platform Architecture**: Docker-based microservices architecture with separate backend and frontend containers
2. **Technology Stack**: Python-based backend with modern frontend framework
3. **Development Experience**: VS Code Dev Containers for seamless local development on Windows
4. **CI/CD**: GitHub Actions pipelines for automated Docker image building and deployment
5. **Data Persistence**: PostgreSQL for long-term storage, Redis for caching and session management
6. **Task Management**: Celery for scheduled and asynchronous tasks
7. **Real-time Communication**: MQTT for live race updates and notifications

---

## Table of Contents

1. [Phase 1: Project Foundation Setup](#phase-1-project-foundation-setup)
2. [Phase 2: Repository Structure and Organization](#phase-2-repository-structure-and-organization)
3. [Phase 3: Development Environment Configuration](#phase-3-development-environment-configuration)
4. [Phase 4: CI/CD Pipeline Setup](#phase-4-cicd-pipeline-setup)
5. [Phase 5: Database and Infrastructure](#phase-5-database-and-infrastructure)
6. [Phase 6: Development Workflows](#phase-6-development-workflows)
7. [Phase 7: Testing and Quality Assurance](#phase-7-testing-and-quality-assurance)
8. [Phase 8: Deployment Strategy](#phase-8-deployment-strategy)

---

## Phase 1: Project Foundation Setup

### Objective
Establish the foundational structure, repositories, and configuration files necessary for a successful multi-repository project.

### Step 1: Repository Creation

#### 1.1 Create GitHub Repositories

Create four separate GitHub repositories under the organization:

```bash
# Repository Structure
f1_documentation/    # All project documentation
f1_backend/          # Backend API and services
f1_frontend/         # Frontend application (created after backend MVP)
f1_infrastructure/   # Docker Compose configs, deployment scripts (optional)
```

**Repository Initialization Commands:**

```bash
# Initialize documentation repository
cd f1_documentation
git init
echo "# Fantasy F1 Documentation" > README.md
git add README.md
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/orgname/f1_documentation.git
git push -u origin main

# Initialize backend repository
cd ../f1_backend
git init
echo "# Fantasy F1 Backend" > README.md
git add README.md
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/orgname/f1_backend.git
git push -u origin main

# Initialize frontend repository (only after backend MVP is complete)
# Commands will be provided when needed
```

#### 1.2 Repository Configuration Files

Create the following files in each repository root:

**`.gitignore` for Backend Repository:**

```gitignore
# Byte-compiled / optimized / DLL files
__pycache__/
*.py[cod]
*$py.class

# C extensions
*.so

# Distribution / packaging
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
ENV/
env/

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Environment variables
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite3

# Docker volumes (data)
postgres_data/
redis_data/

# Logs
logs/
*.log

# Celery
celerybeat-*
celerybeat.pid

# Testing
.coverage
htmlcov/
.pytest_cache/
.mypy_cache/

# OS
.DS_Store
Thumbs.db
```

**`.gitignore` for Frontend Repository:**

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production builds
dist/
build/
.next/
out/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDEs
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

**`.gitignore` for Documentation Repository:**

```gitignore
# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Build outputs
pdf/
*.pdf
```

**`LICENSE` File (choose one for each repository):**

- Recommended: MIT License for permissive use
- Alternative: Apache 2.0 or GPLv3 based on requirements

### Step 2: Project Communication Channels

#### 2.1 Establish Communication Platforms

1. **GitHub Issues**: For bug tracking, feature requests, and development tasks
2. **GitHub Discussions**: For general questions, architecture discussions
3. **Slack/Discord**: For real-time team communication (optional)
4. **GitHub Projects**: For sprint planning and task management

#### 2.2 Define Contribution Guidelines

Create `CONTRIBUTING.md` in each repository:

```markdown
# Contributing to Fantasy F1

Thank you for your interest in contributing to Fantasy F1!

## Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Development Workflow

### Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Production hotfixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

### Commit Message Format

Follow Conventional Commits:

- `feat: add user authentication`
- `fix: resolve race condition in driver selection`
- `docs: update API documentation`
- `refactor: simplify database models`

### Code Review Process

1. All PRs require at least one approval
2. CI checks must pass before merging
3. Update documentation as needed
4. Ensure tests are included for new features
```

### Step 3: Documentation Standards

#### 3.1 Documentation Organization

The `f1_documentation` repository should follow this structure:

```
f1_documentation/
├── 00_project_overview/
│   ├── vision.md
│   ├── architecture_decisions.md
│   └── success_metrics.md
├── 01_setup/
│   ├── project_dev_startup_mvp.md
│   ├── backend_mvp.md
│   └── frontend_mvp.md
├── 02_database/
│   ├── schema_design.md
│   ├── migrations.md
│   └── performance_tuning.md
├── 03_api/
│   ├── api_specifications.md
│   ├── authentication.md
│   └── rate_limiting.md
├── 04_deployment/
│   ├── docker_compose_guide.md
│   ├── ci_cd_pipelines.md
│   └── monitoring.md
├── 05_frontend/
│   ├── component_library.md
│   ├── ux_patterns.md
│   └── state_management.md
├── 06_development/
│   ├── coding_standards.md
│   ├── testing_guidelines.md
│   └── debugging_guide.md
└── README.md
```

#### 3.2 Documentation Templates

**Architecture Decision Record (ADR) Template:**

```markdown
# ADR-[Number]: [Title]

## Status
[Proposed | Accepted | Deprecated | Superseded]

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
What becomes easier or more difficult to do because of this change?
```

**API Documentation Template:**

```markdown
# [Endpoint Name]

## Description
Brief description of what this endpoint does.

## Endpoint
`HTTP_METHOD /api/v1/resource`

## Request

### Headers
```
Content-Type: application/json
Authorization: Bearer <token>
```

### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| param1 | string | Yes | Description |

### Request Body (if applicable)
```json
{
  "field1": "value1",
  "field2": 123
}
```

## Response

### Success Response (200 OK)
```json
{
  "data": {},
  "status": "success"
}
```

### Error Responses
| Code | Description |
|------|-------------|
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |

## Examples

### cURL
```bash
curl -X POST \
  https://api.fantasyf1.com/api/v1/resource \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{"field1": "value1"}'
```

### Python
```python
import requests

response = requests.post(
    'https://api.fantasyf1.com/api/v1/resource',
    headers={'Authorization': f'Bearer {token}'},
    json={'field1': 'value1'}
)
```
```

---

## Phase 2: Repository Structure and Organization

### Objective
Establish clear repository structures with proper separation of concerns for backend, frontend, and documentation.

### Backend Repository Structure

```
f1_backend/
├── .devcontainer/
│   ├── devcontainer.json
│   └── Dockerfile
├── .github/
│   └── workflows/
│       ├── build.yml
│       ├── test.yml
│       └── deploy.yml
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application entry point
│   ├── dependencies.py            # Dependency injection
│   ├── config.py                  # Configuration management
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── endpoints/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── teams.py
│   │   │   │   ├── drivers.py
│   │   │   │   ├── races.py
│   │   │   │   └── leagues.py
│   │   │   └── router.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── middleware.py
│   │   └── exceptions.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── driver.py
│   │   ├── race.py
│   │   ├── league.py
│   │   └── base.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── team.py
│   │   ├── driver.py
│   │   ├── race.py
│   │   └── league.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   ├── team_service.py
│   │   ├── scoring_service.py
│   │   └── race_service.py
│   ├── tasks/
│   │   ├── __init__.py
│   │   ├── celery_app.py
│   │   ├── race_scoring.py
│   │   ├── data_sync.py
│   │   └── notifications.py
│   ├── db/
│   │   ├── __init__.py
│   │   ├── session.py
│   │   ├── base.py
│   │   └── init_db.py
│   └── utils/
│       ├── __init__.py
│       ├── logger.py
│       └── helpers.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   │   ├── test_models.py
│   │   ├── test_services.py
│   │   └── test_utils.py
│   ├── integration/
│   │   ├── test_api.py
│   │   └── test_database.py
│   └── e2e/
│       └── test_scenarios.py
├── alembic/
│   ├── versions/
│   ├── env.py
│   ├── script.py.mako
│   └── README
├── scripts/
│   ├── setup_dev.py
│   ├── migrate_db.py
│   └── seed_data.py
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── requirements-dev.txt
├── pyproject.toml
├── .env.example
├── .pre-commit-config.yaml
├── pytest.ini
├── README.md
└── .gitignore
```

### Frontend Repository Structure (Future Reference)

```
f1_frontend/
├── .devcontainer/
│   ├── devcontainer.json
│   └── Dockerfile
├── .github/
│   └── workflows/
│       ├── build.yml
│       ├── test.yml
│       └── deploy.yml
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
├── src/
│   ├── main.tsx                   # Application entry point
│   ├── App.tsx                    # Root component
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── team/
│   │   │   ├── TeamCreate.tsx
│   │   │   ├── TeamView.tsx
│   │   │   └── DriverSelect.tsx
│   │   ├── race/
│   │   │   ├── RaceSchedule.tsx
│   │   │   ├── RaceResults.tsx
│   │   │   └── LiveUpdates.tsx
│   │   └── league/
│   │       ├── Leaderboard.tsx
│   │       └── LeagueSettings.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Teams.tsx
│   │   ├── Races.tsx
│   │   └── Leagues.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTeams.ts
│   │   └── useRaces.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── services/
│   │   ├── api.ts                  # API client configuration
│   │   ├── authService.ts
│   │   ├── teamService.ts
│   │   └── raceService.ts
│   ├── store/
│   │   ├── index.ts               # Redux store setup
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── teamSlice.ts
│   │   │   └── raceSlice.ts
│   │   └── middleware.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── team.ts
│   │   └── race.ts
│   ├── utils/
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── styles/
│       ├── globals.css
│       ├── variables.css
│       └── themes.css
├── tests/
│   ├── __tests__/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   ├── setup.ts
│   └── jest.config.js
├── Dockerfile
├── nginx.conf
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .env.example
├── .prettierrc
├── .eslintrc.json
├── README.md
└── .gitignore
```

---

## Phase 3: Development Environment Configuration

### Objective
Set up a complete development environment using VS Code Dev Containers with Docker, enabling developers to work seamlessly on Windows.

### Step 1: VS Code Dev Containers Setup

#### 1.1 Backend DevContainer Configuration

Create `.devcontainer/devcontainer.json` in backend repository:

```json
{
  "name": "Fantasy F1 Backend",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  
  // Configure tool-specific properties.
  "customizations": {
    // Configure properties specific to VS Code.
    "vscode": {
      // Add the IDs of extensions you want installed when the container is created.
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "ms-python.black-formatter",
        "ms-python.isort",
        "GitHub.copilot",
        "GitHub.copilot-chat",
        "ms-python.mypy-type-checker",
        "ms-python.pylint",
        "ms-azuretools.vscode-docker",
        "eamodio.gitlens",
        "streetsidesoftware.code-spell-checker"
      ],
      
      // Set default VS Code settings
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.formatting.provider": "black",
        "python.linting.enabled": true,
        "python.linting.pylintEnabled": true,
        "python.linting.mypyEnabled": true,
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
          "source.organizeImports": true
        },
        "files.exclude": {
          "**/__pycache__": true,
          "**/*.pyc": true
        }
      }
    }
  },
  
  // Use 'forwardPorts' to make a list of ports inside the container available locally.
  "forwardPorts": [8000, 5678, 9200],
  
  // Use 'postCreateCommand' to run commands after the container is created.
  "postCreateCommand": "pip install -r requirements-dev.txt && pre-commit install",
  
  // Comment out to connect as root instead.
  "remoteUser": "vscode",
  
  // Features to add to the dev container
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": true,
      "installOhMyZsh": true,
      "upgradePackages": true
    },
    "ghcr.io/devcontainers/features/git:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers/features/github-cli:1": {
      "version": "latest"
    }
  }
}
```

#### 1.2 Development Docker Compose

Create `docker-compose.yml` in backend repository root:

```yaml
version: '3.8'

services:
  # Main application
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: f1_backend_app
    ports:
      - "8000:8000"
      - "5678:5678"  # For debugger
    volumes:
      - .:/workspace
      - /workspace/.venv  # Exclude venv from mount
    environment:
      - DATABASE_URL=postgresql://f Fantasy:fantasyf1@db:5432/fantasyf1
      - REDIS_URL=redis://redis:6379/0
      - MQTT_BROKER=mqtt
      - MQTT_PORT=1883
      - ENVIRONMENT=development
    depends_on:
      - db
      - redis
      - mqtt
    networks:
      - fantasy_network
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Celery Worker
  celery-worker:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: f1_backend_worker
    volumes:
      - .:/workspace
      - /workspace/.venv
    environment:
      - DATABASE_URL=postgresql://f Fantasy:fantasyf1@db:5432/fantasyf1
      - REDIS_URL=redis://redis:6379/0
      - MQTT_BROKER=mqtt
      - MQTT_PORT=1883
      - ENVIRONMENT=development
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis
      - db
    networks:
      - fantasy_network
    command: celery -A app.tasks.celery_app worker --loglevel=info

  # Celery Beat (Scheduled Tasks)
  celery-beat:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: f1_backend_beat
    volumes:
      - .:/workspace
      - /workspace/.venv
    environment:
      - DATABASE_URL=postgresql://fantasy:fantasyf1@db:5432/fantasyf1
      - REDIS_URL=redis://redis:6379/0
      - ENVIRONMENT=development
    depends_on:
      - redis
      - db
    networks:
      - fantasy_network
    command: celery -A app.tasks.celery_app beat --loglevel=info

  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: f1_backend_db
    environment:
      - POSTGRES_USER=fantasy
      - POSTGRES_PASSWORD=fantasyf1
      - POSTGRES_DB=fantasyf1
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - fantasy_network

  # Redis
  redis:
    image: redis:7-alpine
    container_name: f1_backend_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - fantasy_network

  # MQTT Broker
  mqtt:
    image: eclipse-mosquitto:2.2
    container_name: f1_backend_mqtt
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
      - ./mosquitto/log:/mosquitto/log
    networks:
      - fantasy_network

  # pgAdmin (Database Management UI)
  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: f1_backend_pgadmin
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@fantasyf1.com
      - PGADMIN_DEFAULT_PASSWORD=admin
      - PGADMIN_CONFIG_SERVER_MODE=False
    ports:
      - "5050:80"
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    networks:
      - fantasy_network

  # Redis Commander (Redis Management UI)
  redis-commander:
    image: rediscommander/redis-commander:latest
    container_name: f1_backend_redis_commander
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    networks:
      - fantasy_network

volumes:
  postgres_data:
  redis_data:
  pgadmin_data:

networks:
  fantasy_network:
    driver: bridge
```

#### 1.3 Development Dockerfile

Create `Dockerfile.dev` in backend repository root:

```dockerfile
# Development Dockerfile with debugging support
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    git \
    curl \
    vim \
    && rm -rf /var/lib/apt/lists/*

# Install PostgreSQL client
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /workspace

# Install Python dependencies
COPY requirements.txt requirements-dev.txt ./
RUN pip install --upgrade pip && \
    pip install -r requirements.txt && \
    pip install -r requirements-dev.txt

# Install ptvsd for debugging
RUN pip install ptvsd

# Create a non-root user
RUN useradd -m -u 1000 vscode && \
    mkdir -p /home/vscode/.python && \
    chown -R vscode:vscode /home/vscode

# Switch to non-root user
USER vscode

# Install virtualenv to local directory
RUN python -m venv /workspace/.venv && \
    /workspace/.venv/bin/pip install --upgrade pip

# Make sure scripts in .venv are usable
ENV PATH="/workspace/.venv/bin:$PATH"

# Set the working directory back
WORKDIR /workspace

# Expose port
EXPOSE 8000

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

#### 1.4 MQTT Configuration

Create `mosquitto/config/mosquitto.conf`:

```
# Allow anonymous connections for development
allow_anonymous true

# Listen on default port
listener 1883

# Enable WebSocket support
listener 9001
protocol websockets

# Persistence
persistence true
persistence_location /mosquitto/data/

# Logging
log_dest file /mosquitto/log/mosquitto.log
log_dest stdout
```

### Step 2: Local Development Setup

#### 2.1 Prerequisites

Developers must have the following installed on their Windows machine:

1. **Docker Desktop for Windows** - Latest stable version
2. **Git** - Latest version
3. **Visual Studio Code** - Latest version with these extensions:
   - Remote - Containers (ms-vscode-remote.remote-containers)
   - Python (ms-python.python)
   - Docker (ms-azuretools.vscode-docker)
   - GitLens (eamodio.gitlens)

#### 2.2 Repository Cloning

```bash
# Clone the documentation repository
git clone https://github.com/orgname/f1_documentation.git

# Clone the backend repository
git clone https://github.com/orgname/f1_backend.git

# Navigate to backend repository
cd f1_backend
```

#### 2.3 Starting Development Environment

**Using VS Code Remote Containers:**

1. Open the backend repository in VS Code
2. Click the green "Remote - Containers" icon in the bottom left corner
3. Select "Reopen in Container"
4. Wait for the container to build and start (first time takes 5-10 minutes)
5. The environment will be ready when the VS Code status bar shows "Dev Container: Fantasy F1 Backend"

**Using Docker Compose:**

```bash
# Navigate to backend repository
cd f1_backend

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

#### 2.4 Database Initialization

```bash
# Inside the dev container
# Initialize database
alembic upgrade head

# Seed initial data (optional)
python scripts/seed_data.py
```

#### 2.5 Verify Setup

```bash
# Test API is running
curl http://localhost:8000/api/v1/health

# Check database connection
python -c "from app.db.session import engine; print(engine.connect())"

# Check Celery worker
celery -A app.tasks.celery_app inspect active
```

### Step 3: Environment Configuration

#### 3.1 Environment Variables Template

Create `.env.example` in backend repository:

```env
# Application
APP_NAME=Fantasy F1
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-secret-key-here-change-in-production

# Database
DATABASE_URL=postgresql://fantasy:fantasyf1@db:5432/fantasyf1
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://redis:6379/0
REDIS_CACHE_TTL=3600

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
CELERY_TASK_ALWAYS_EAGER=false

# MQTT
MQTT_BROKER=mqtt
MQTT_PORT=1883
MQTT_USERNAME=
MQTT_PASSWORD=

# API
API_HOST=0.0.0.0
API_PORT=8000
API_PREFIX=/api/v1

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# JWT
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=noreply@fantasyf1.com

# External APIs
F1_API_KEY=your-f1-api-key
F1_API_BASE_URL=https://api.formula1.com/v1

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=
PROMETHEUS_PORT=9090
```

#### 3.2 Environment-Specific Configurations

```python
# app/config.py
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Fantasy F1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str
    
    # Database
    DATABASE_URL: str
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = "redis://redis:6379/0"
    REDIS_CACHE_TTL: int = 3600
    
    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    CELERY_TASK_ALWAYS_EAGER: bool = False
    
    # MQTT
    MQTT_BROKER: str = "mqtt"
    MQTT_PORT: int = 1883
    MQTT_USERNAME: Optional[str] = None
    MQTT_PASSWORD: Optional[str] = None
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_PREFIX: str = "/api/v1"
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    
    # External APIs
    F1_API_KEY: Optional[str] = None
    F1_API_BASE_URL: str = "https://api.formula1.com/v1"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # Monitoring
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_PORT: int = 9090
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()
```

### Step 4: Development Tools Configuration

#### 4.1 Pre-commit Hooks

Create `.pre-commit-config.yaml` in backend repository:

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-json
      - id: check-toml
      - id: check-merge-conflict
      - id: debug-statements

  - repo: https://github.com/psf/black
    rev: 23.12.1
    hooks:
      - id: black
        language_version: python3.11

  - repo: https://github.com/PyCQA/isort
    rev: 5.13.2
    hooks:
      - id: isort
        args: ["--profile", "black"]

  - repo: https://github.com/PyCQA/flake8
    rev: 7.0.0
    hooks:
      - id: flake8
        args: ['--max-line-length=100', '--extend-ignore=E203']

  - repo: https://github.com/pre-commit/mirrors-mypy
    rev: v1.8.0
    hooks:
      - id: mypy
        additional_dependencies: [pydantic, types-redis]
        args: [--ignore-missing-imports]
```

Install pre-commit hooks:

```bash
pre-commit install
```

#### 4.2 Pytest Configuration

Create `pytest.ini` in backend repository:

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --verbose
    --strict-markers
    --disable-warnings
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --asyncio-mode=auto
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow running tests
```

#### 4.3 VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "python.defaultInterpreterPath": "/workspace/.venv/bin/python",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.linting.mypyEnabled": true,
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": [
    "tests"
  ],
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/.pytest_cache": true,
    "**/.mypy_cache": true
  },
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/tree/**": true,
    "**/node_modules/**": true,
    "**/.venv/**": true
  }
}
```

---

## Phase 4: CI/CD Pipeline Setup

### Objective
Establish GitHub Actions workflows for automated testing, building, and deployment of Docker images.

### Step 1: GitHub Actions Workflows

#### 1.1 Main CI/CD Workflow

Create `.github/workflows/main.yml` in backend repository:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Job 1: Run tests
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install -r requirements-dev.txt
      
      - name: Run linting
        run: |
          black --check app tests
          isort --check-only app tests
          flake8 app tests
          mypy app
      
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
        run: |
          alembic upgrade head
      
      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379/0
        run: |
          pytest --cov=app --cov-report=xml --cov-report=term-missing
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
          flags: unittests
          name: codecov-umbrella

  # Job 2: Build and push Docker image
  build:
    name: Build Docker Image
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max

  # Job 3: Security scanning
  security:
    name: Security Scanning
    needs: build
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # Job 4: Deploy (only on main branch)
  deploy:
    name: Deploy to Production
    needs: [build, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy to server
        run: |
          echo "Deployment steps would go here"
          # This would include:
          # - SSH to production server
          # - Pull latest Docker image
          # - Restart containers
          # - Run migrations
          # - Health checks
```

#### 1.2 Pull Request Workflow

Create `.github/workflows/pr.yml`:

```yaml
name: Pull Request Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-checks:
    name: PR Checks
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install black isort flake8 mypy
      
      - name: Check code formatting
        run: |
          black --check --diff .
          isort --check-only --diff .
      
      - name: Run linting
        run: |
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          flake8 . --count --exit-zero --max-complexity=10 --max-line-length=100 --statistics
      
      - name: Check for TODO comments
        run: |
          if git diff main...HEAD | grep -i "TODO"; then
            echo "Warning: TODO comments found in changes"
          fi
```

### Step 2: Production Docker Configuration

#### 2.1 Production Dockerfile

Create `Dockerfile` for production builds:

```dockerfile
# Production Dockerfile
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PATH="/root/.local/bin:$PATH"

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /root/.local /root/.local

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    mkdir -p /home/appuser/app && \
    chown -R appuser:appuser /home/appuser

# Set working directory
WORKDIR /home/appuser/app

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 2.2 Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/orgname/f1_backend:latest
    container_name: f1_backend_app
    restart: unless-stopped
    ports:
      - "8000:8000"
    env_file:
      - .env.production
    depends_on:
      - db
      - redis
    networks:
      - fantasy_network

  celery-worker:
    image: ghcr.io/orgname/f1_backend:latest
    container_name: f1_backend_worker
    restart: unless-stopped
    command: celery -A app.tasks.celery_app worker --loglevel=info
    env_file:
      - .env.production
    depends_on:
      - redis
      - db
    networks:
      - fantasy_network

  celery-beat:
    image: ghcr.io/orgname/f1_backend:latest
    container_name: f1_backend_beat
    restart: unless-stopped
    command: celery -A app.tasks.celery_app beat --loglevel=info
    env_file:
      - .env.production
    depends_on:
      - redis
      - db
    networks:
      - fantasy_network

  db:
    image: postgres:15-alpine
    container_name: f1_backend_db
    restart: unless-stopped
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file:
      - .env.production
    networks:
      - fantasy_network

  redis:
    image: redis:7-alpine
    container_name: f1_backend_redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    networks:
      - fantasy_network

  mqtt:
    image: eclipse-mosquitto:2.2
    container_name: f1_backend_mqtt
    restart: unless-stopped
    volumes:
      - ./mosquitto/config:/mosquitto/config
      - ./mosquitto/data:/mosquitto/data
    networks:
      - fantasy_network

  nginx:
    image: nginx:alpine
    container_name: f1_backend_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    networks:
      - fantasy_network

volumes:
  postgres_data:
  redis_data:

networks:
  fantasy_network:
    driver: bridge
```

### Step 3: GitHub Secrets Configuration

Configure the following secrets in GitHub repository settings:

```bash
# Required Secrets
GITHUB_TOKEN                    # Automatically provided

# Optional Secrets (for deployment)
SSH_PRIVATE_KEY                 # For SSH access to servers
DEPLOY_HOST                     # Server hostname/IP
DEPLOY_USER                     # SSH username
DOCKER_REGISTRY_USERNAME        # Container registry username
DOCKER_REGISTRY_PASSWORD        # Container registry password

# Application Secrets
PRODUCTION_SECRET_KEY           # Application secret key
PRODUCTION_JWT_SECRET_KEY       # JWT secret key
SMTP_USERNAME                   # Email service username
SMTP_PASSWORD                   # Email service password
F1_API_KEY                      # Formula 1 API key
SENTRY_DSN                      # Error tracking DSN
```

---

## Phase 5: Database and Infrastructure

### Objective
Set up PostgreSQL database with proper schema design, migrations, and infrastructure components.

### Step 1: Database Schema Design

#### 1.1 Core Database Relationships

```
User
  ├── id, username, email, password_hash
  ├── created_at, updated_at
  └── has many Teams (one per league)

Team
  ├── id, user_id, league_id, name
  ├── budget_remaining
  ├── has many TeamDrivers
  └── belongs to User and League

Driver
  ├── id, name, team_name, number
  ├── price, points_earned, current_position
  └── belongs to many Teams (via TeamDrivers)

Race
  ├── id, name, circuit_name, country
  ├── race_date, status
  └── has many RaceResults

RaceResult
  ├── id, race_id, driver_id
  ├── position, points_earned, fastest_lap
  └── belongs to Race and Driver

League
  ├── id, name, creator_id, code (invite code)
  ├── max_teams, scoring_system
  └── has many Teams

TeamDriver
  ├── id, team_id, driver_id
  ├── is_captain (one per team)
  └── belongs to Team and Driver

Notification
  ├── id, user_id, type, message
  ├── read_status, created_at
  └── belongs to User
```

### Step 2: Database Migration Setup

#### 2.1 Alembic Configuration

Create `alembic.ini`:

```ini
# A generic, single database configuration.

[alembic]
# path to migration scripts
script_location = alembic

# template used to generate migration file names; The default value is %%(rev)s_%%(slug)s
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(rev)s_%%(slug)s

# sys.path path, will be prepended to sys.path if present.
prepend_sys_path = .

# timezone to use when rendering the date within the migration file
# as well as the filename.
# If specified, requires the python-dateutil library that can be
# installed by adding `alembic[tz]` to the pip requirements
# string value is passed to dateutil.tz.gettz()
# leave blank for localtime
# timezone =

# max length of characters to apply to the
# "slug" field
# truncate_slug_length = 40

# set to 'true' to run the environment during
# the 'revision' command, regardless of autogenerate
# revision_environment = false

# set to 'true' to allow .pyc and .pyo files without
# a source .py file to be detected as revisions in the
# versions/ directory
# sourceless = false

# version location specification; This defaults
# to alembic/versions.  When using multiple version
# directories, initial revisions must be specified with --version-path.
# The path separator used here should be the separator specified by "version_path_separator" below.
# version_locations = %(here)s/bar:%(here)s/bat:alembic/versions

# version path separator; As mentioned above, this is the character used to split
# version_locations. The default within new alembic.ini files is "os", which uses os.pathsep.
# If this key is omitted entirely, it falls back to the legacy behavior of splitting on spaces and/or commas.
# Valid values for version_path_separator are:
#
# version_path_separator = :
# version_path_separator = ;
# version_path_separator = space
version_path_separator = os  # Use os.pathsep. Default configuration used for new projects.

# set to 'true' to search source files recursively
# in each "version_locations" directory
# new in Alembic version 1.10
# recursive_version_locations = false

# the output encoding used when revision files
# are written from script.py.mako
# output_encoding = utf-8

sqlalchemy.url = postgresql://fantasy:fantasyf1@localhost:5432/fantasyf1


[post_write_hooks]
# post_write_hooks defines scripts or Python functions that are run
# on newly generated revision scripts.  See the documentation for further
# detail and examples

# format using "black" - use the console_scripts runner, against the "black" entrypoint
# hooks = black
# black.type = console_scripts
# black.entrypoint = black
# black.options = -l 79 REVISION_SCRIPT_FILENAME

# lint with attempts to fix using "ruff" - use the exec runner, execute a binary
# hooks = ruff
# ruff.type = exec
# ruff.executable = %(here)s/.venv/bin/ruff
# ruff.options = --fix REVISION_SCRIPT_FILENAME

# Logging configuration
[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

Create `alembic/env.py`:

```python
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from app.db.base import Base
from app.config import settings

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_url():
    """Get database URL from settings."""
    return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = get_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = get_url()
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### Step 3: Redis Configuration

#### 3.1 Redis Service Setup

Redis will be used for:
- Session storage
- Caching
- Celery task broker
- Real-time data locks

Create `app/db/redis.py`:

```python
import redis
from redis import Redis
from app.config import settings
from typing import Optional
import json
import pickle


class RedisService:
    """Redis service for caching and session management."""
    
    def __init__(self):
        self._client: Optional[Redis] = None
    
    def connect(self) -> Redis:
        """Establish connection to Redis."""
        if self._client is None:
            self._client = redis.from_url(
                settings.REDIS_URL,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
        return self._client
    
    def get_client(self) -> Redis:
        """Get Redis client, connecting if needed."""
        if self._client is None:
            self._client = self.connect()
        return self._client
    
    async def get(self, key: str) -> Optional[str]:
        """Get value from Redis."""
        client = self.get_client()
        return client.get(key)
    
    async def set(
        self,
        key: str,
        value: str,
        ttl: Optional[int] = None
    ) -> bool:
        """Set value in Redis with optional TTL."""
        client = self.get_client()
        return client.set(key, value, ex=ttl or settings.REDIS_CACHE_TTL)
    
    async def delete(self, key: str) -> int:
        """Delete key from Redis."""
        client = self.get_client()
        return client.delete(key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis."""
        client = self.get_client()
        return bool(client.exists(key))
    
    async def get_json(self, key: str) -> Optional[dict]:
        """Get JSON value from Redis."""
        value = await self.get(key)
        if value:
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return None
        return None
    
    async def set_json(
        self,
        key: str,
        value: dict,
        ttl: Optional[int] = None
    ) -> bool:
        """Set JSON value in Redis."""
        return await self.set(key, json.dumps(value), ttl)
    
    async def get_object(self, key: str) -> Optional[object]:
        """Get pickled object from Redis."""
        client = self.get_client()
        value = client.get(key)
        if value:
            try:
                return pickle.loads(value)
            except pickle.PickleError:
                return None
        return None
    
    async def set_object(
        self,
        key: str,
        value: object,
        ttl: Optional[int] = None
    ) -> bool:
        """Set pickled object in Redis."""
        client = self.get_client()
        pickled = pickle.dumps(value)
        return client.set(key, pickled, ex=ttl or settings.REDIS_CACHE_TTL)
    
    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter in Redis."""
        client = self.get_client()
        return client.incr(key, amount)
    
    async def expire(self, key: str, ttl: int) -> bool:
        """Set expiration for key."""
        client = self.get_client()
        return client.expire(key, ttl)
    
    async def flush_db(self) -> bool:
        """Flush all data from current database (use with caution)."""
        client = self.get_client()
        return client.flushdb()
    
    def close(self):
        """Close Redis connection."""
        if self._client:
            self._client.close()
            self._client = None


# Global Redis service instance
redis_service = RedisService()
```

### Step 4: MQTT Configuration

#### 4.1 MQTT Service Setup

MQTT will be used for:
- Real-time race updates
- Live scoring notifications
- Push notifications to frontend

Create `app/db/mqtt.py`:

```python
import paho.mqtt.client as mqtt
from app.config import settings
import json
import logging
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class MQTTService:
    """MQTT service for real-time messaging."""
    
    def __init__(self):
        self.client = mqtt.Client()
        self.connected = False
        self.callbacks: dict[str, list[Callable]] = {}
        
        # Set up callbacks
        self.client.on_connect = self._on_connect
        self.client.on_disconnect = self._on_disconnect
        self.client.on_message = self._on_message
    
    def _on_connect(self, client, userdata, flags, rc):
        """Callback for when client connects to broker."""
        if rc == 0:
            logger.info("Connected to MQTT broker")
            self.connected = True
            # Subscribe to default topics
            client.subscribe("f1/race/#")
            client.subscribe("f1/scoring/#")
            client.subscribe("f1/notifications/#")
        else:
            logger.error(f"Failed to connect to MQTT broker: {rc}")
    
    def _on_disconnect(self, client, userdata, rc):
        """Callback for when client disconnects from broker."""
        logger.info(f"Disconnected from MQTT broker: {rc}")
        self.connected = False
    
    def _on_message(self, client, userdata, msg):
        """Callback for when message is received."""
        try:
            topic = msg.topic
            payload = json.loads(msg.payload.decode())
            
            # Call registered callbacks for this topic
            if topic in self.callbacks:
                for callback in self.callbacks[topic]:
                    callback(payload)
        except Exception as e:
            logger.error(f"Error processing MQTT message: {e}")
    
    def connect(self):
        """Connect to MQTT broker."""
        if settings.MQTT_USERNAME and settings.MQTT_PASSWORD:
            self.client.username_pw_set(
                settings.MQTT_USERNAME,
                settings.MQTT_PASSWORD
            )
        
        self.client.connect(
            settings.MQTT_BROKER,
            settings.MQTT_PORT,
            keepalive=60
        )
        
        # Start the loop in a separate thread
        self.client.loop_start()
    
    def disconnect(self):
        """Disconnect from MQTT broker."""
        self.client.loop_stop()
        self.client.disconnect()
        self.connected = False
    
    def publish(self, topic: str, payload: dict):
        """Publish message to topic."""
        if not self.connected:
            logger.warning("MQTT not connected, cannot publish")
            return
        
        try:
            self.client.publish(
                topic,
                json.dumps(payload),
                qos=1
            )
            logger.debug(f"Published to {topic}: {payload}")
        except Exception as e:
            logger.error(f"Error publishing to MQTT: {e}")
    
    def subscribe(self, topic: str, callback: Callable):
        """Subscribe to topic with callback."""
        if topic not in self.callbacks:
            self.callbacks[topic] = []
        
        self.callbacks[topic].append(callback)
        
        if self.connected:
            self.client.subscribe(topic)
    
    def unsubscribe(self, topic: str):
        """Unsubscribe from topic."""
        if topic in self.callbacks:
            del self.callbacks[topic]
        
        if self.connected:
            self.client.unsubscribe(topic)


# Global MQTT service instance
mqtt_service = MQTTService()
```

---

## Phase 6: Development Workflows

### Objective
Define clear development workflows, branching strategies, and best practices for the team.

### Step 1: Git Workflow Strategy

#### 1.1 Branching Model

```
main           (Production-ready code)
  │
  ├──────── develop     (Integration branch)
  │         │
  │         ├──────── feature/user-authentication
  │         ├──────── feature/scoring-system
  │         ├──────── bugfix/race-data-sync
  │         └──────── refactor/database-optimization
  │
  └──────── hotfix/critical-security-fix
```

**Branch Types:**

1. **main** - Production-ready code, always deployable
2. **develop** - Integration branch for completed features
3. **feature/** - New feature development
4. **bugfix/** - Bug fixes
5. **hotfix/** - Production hotfixes
6. **refactor/** - Code refactoring (no functional changes)
7. **release/** - Release preparation

#### 1.2 Feature Development Workflow

```bash
# 1. Start from develop branch
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
# Use conventional commits
git commit -m "feat: add user authentication"

# 4. Push to remote
git push origin feature/your-feature-name

# 5. Create Pull Request to develop
# - Add description
# - Link to issue
# - Request review

# 6. Address review feedback
git add .
git commit -m "fix: address review comments"
git push

# 7. After approval and CI passes, merge to develop

# 8. Delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

#### 1.3 Hotfix Workflow

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. Make changes and commit
git add .
git commit -m "fix: resolve critical security vulnerability"

# 3. Push and create PR to main
git push origin hotfix/critical-bug-fix

# 4. After approval and CI passes, merge to main

# 5. Merge hotfix back to develop as well
git checkout develop
git pull origin develop
git merge hotfix/critical-bug-fix
git push origin develop

# 6. Delete hotfix branch
git branch -d hotfix/critical-bug-fix
```

### Step 2: Code Review Process

#### 2.1 Pull Request Checklist

Before opening a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass locally
- [ ] New features include tests
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits
- [ ] No sensitive data is included
- [ ] No TODOs or FIXMEs left in critical paths

#### 2.2 Review Guidelines

For reviewers:

- Check code quality and maintainability
- Verify tests are comprehensive
- Ensure documentation is accurate
- Look for security vulnerabilities
- Check performance implications
- Verify edge cases are handled

#### 2.3 Approval Requirements

- **Feature branches**: At least 1 approval from team lead
- **Bugfix branches**: 1 approval required
- **Hotfix branches**: 2 approvals required (team lead + senior dev)
- **Refactor branches**: 1 approval required

### Step 3: Release Process

#### 3.1 Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Migration scripts tested
- [ ] Performance benchmarks run
- [ ] Security review completed
- [ ] Staging environment tested

#### 3.2 Release Steps

```bash
# 1. Create release branch from develop
git checkout develop
git pull origin develop
git checkout -b release/v1.0.0

# 2. Update version numbers
# Update in app/config.py and any version files

# 3. FINAL testing
# Run full test suite

# 4. Commit version changes
git add .
git commit -m "chore: bump version to v1.0.0"

# 5. Create PR to main
git push origin release/v1.0.0

# 6. After approval, merge to main

# 7. Create Git tag
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 8. Deploy to production

# 9. Merge release branch back to develop
git checkout develop
git merge release/v1.0.0
git push origin develop

# 10. Delete release branch
git branch -d release/v1.0.0
```

---

## Phase 7: Testing and Quality Assurance

### Objective
Establish comprehensive testing strategies and quality assurance processes.

### Step 1: Testing Strategy

#### 1.1 Test Pyramid

```
        E2E Tests (5% acceptance / UI tests)
         /\
        /  \
       /    \
      /      \
     /________\
    Integration Tests (15% API / Database tests)
   /          \
  /            \
 /______________\
Unit Tests (80% individual function/class tests)
```

### Step 2: Testing Tools Setup

#### 2.1 Test Dependencies

Add to `requirements-dev.txt`:

```
# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
pytest-mock==3.12.0
pytest-xdist==3.5.0
pytest-timeout==2.2.0

# HTTP testing
httpx==0.25.2
requests-mock==1.11.0

# Database testing
factory-boy==3.3.0
faker==20.1.0

# Quality tools
black==23.12.1
isort==5.13.2
flake8==7.0.0
mypy==1.8.0
pylint==3.0.3

# Coverage
coverage==7.3.4

# Linting pre-commit
pre-commit==3.6.0
```

#### 2.2 Conftest Configuration

Create `tests/conftest.py`:

```python
import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import NullPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.config import settings


# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    poolclass=NullPool,
    echo=False
)

TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False
)


@pytest.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Create a fresh database session for each test."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()
    
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database session override."""
    
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "username": "testuser",
        "email": "test@example.com",
        "password": "TestPassword123!"
    }


@pytest.fixture
def sample_team_data():
    """Sample team data for testing."""
    return {
        "name": "Test Team",
        "budget": 100000000
    }
```

### Step 3: Test Structure

#### 3.1 Unit Tests Example

Create `tests/unit/test_models.py`:

```python
import pytest
from app.models.user import User
from app.models.driver import Driver


def test_user_creation(sample_user_data):
    """Test creating a user."""
    user = User(
        username=sample_user_data["username"],
        email=sample_user_data["email"]
    )
    assert user.username == sample_user_data["username"]
    assert user.email == sample_user_data["email"]
    assert user.is_active is True


def test_user_password_hashing():
    """Test password hashing."""
    password = "TestPassword123!"
    user = User(
        username="testuser",
        email="test@example.com"
    )
    user.set_password(password)
    
    assert user.check_password(password) is True
    assert user.check_password("WrongPassword") is False


def test_driver_creation():
    """Test creating a driver."""
    driver = Driver(
        name="Lewis Hamilton",
        team_name="Mercedes",
        number=44,
        price=25000000
    )
    assert driver.name == "Lewis Hamilton"
    assert driver.team_name == "Mercedes"
    assert driver.number == 44
    assert driver.price == 25000000
```

#### 3.2 Integration Tests Example

Create `tests/integration/test_api.py`:

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_user(client: AsyncClient, sample_user_data):
    """Test user creation via API."""
    response = await client.post(
        "/api/v1/users/",
        json=sample_user_data
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == sample_user_data["username"]
    assert data["email"] == sample_user_data["email"]
    assert "password" not in data  # Password should not be returned


@pytest.mark.asyncio
async def test_get_user(client: AsyncClient, sample_user_data):
    """Test retrieving a user via API."""
    # Create user first
    create_response = await client.post(
        "/api/v1/users/",
        json=sample_user_data
    )
    user_id = create_response.json()["id"]
    
    # Get user
    response = await client.get(f"/api/v1/users/{user_id}")
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["username"] == sample_user_data["username"]


@pytest.mark.asyncio
async def test_user_not_found(client: AsyncClient):
    """Test retrieving non-existent user."""
    response = await client.get("/api/v1/users/99999")
    
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
```

### Step 4: Running Tests

#### 4.1 Test Commands

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run only unit tests
pytest -m unit

# Run only integration tests
pytest -m integration

# Run specific test file
pytest tests/unit/test_models.py

# Run specific test function
pytest tests/unit/test_models.py::test_user_creation

# Run with verbose output
pytest -v

# Run with parallel execution
pytest -n auto

# Stop on first failure
pytest -x

# Run tests matching pattern
pytest -k "test_create_user"

# Show print statements
pytest -s
```

#### 4.2 Coverage Requirements

- **Overall coverage**: Minimum 80%
- **Critical paths**: Minimum 90%
- **Edge cases**: Minimum 70%

Generate coverage report:

```bash
# Generate HTML coverage report
pytest --cov=app --cov-report=html

# View the report
open htmlcov/index.html  # Mac
start htmlcov/index.html  # Windows
```

---

## Phase 8: Deployment Strategy

### Objective
Define deployment procedures for different environments and disaster recovery plans.

### Step 1: Environment Configuration

#### 1.1 Environment Matrix

| Environment | Purpose | Database | API URL | Branch |
|-------------|---------|----------|---------|--------|
| Development | Local development | Local DB | http://localhost:8000 | feature/* |
| Staging | Pre-production testing | Staging DB | https://staging-api.fantasyf1.com | develop |
| Production | Live production | Production DB | https://api.fantasyf1.com | main |

### Step 2: Deployment Workflows

#### 2.1 Staging Deployment (Automated on Develop)

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy to Staging

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        run: |
          # SSH to staging server
          # Pull latest Docker image
          # Restart containers
          # Run migrations
          # Health checks
```

#### 2.2 Production Deployment (Manual Trigger)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to deploy'
        required: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        run: |
          # Verify version
          # Create backup
          # Deploy new version
          # Run migrations
          # Verify health
          # Rollback on failure
```

### Step 3: Monitoring and Logging

#### 3.1 Application Monitoring

Implement health checks:

```python
# app/api/endpoints/health.py
from fastapi import APIRouter
from app.db.session import engine
from app.db.redis import redis_service
import redis

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    health_status = {
        "status": "healthy",
        "database": "connected",
        "redis": "connected"
    }
    
    # Check database connection
    try:
        with engine.connect() as conn:
            conn.execute("SELECT 1")
    except Exception:
        health_status["status"] "degraded"
        health_status["database"] = "disconnected"
    
    # Check Redis connection
    try:
        await redis_service.get("health_check")
    except Exception:
        health_status["status"] = "degraded"
        health_status["redis"] = "disconnected"
    
    return health_status
```

#### 3.2 Logging Configuration

Create `app/utils/logger.py`:

```python
import logging
import sys
from app.config import settings


def setup_logger(name: str) -> logging.Logger:
    """Set up a logger with consistent configuration."""
    logger = logging.getLogger(name)
    
    # Set log level
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.DEBUG)
    
    # Create formatter
    if settings.LOG_FORMAT == "json":
        import json_log_formatter
        formatter = json_log_formatter.VerboseJSONFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    
    # Add handler to logger
    logger.addHandler(console_handler)
    
    return logger
```

### Step 4: Disaster Recovery

#### 4.1 Backup Strategy

**Database Backups:**

```bash
# Daily automated backup
PGPASSWORD=fantasyf1 pg_dump -U fantasy -h db -d fantasyf1 | gzip > /backups/db_$(date +%Y%m%d).sql.gz

# Keep 30 days of daily backups
find /backups -name "db_*.sql.gz" -mtime +30 -delete

# Hourly incremental backups
# Using PostgreSQL WAL archiving
```

**Redis Backup:**

```bash
# Enable Redis persistence
# In redis.conf:
save 900 1
save 300 10
save 60 10000

# Copy RDB file periodically
cp /var/lib/redis/dump.rdb /backups/redis_dump_$(date +%Y%m%d_%H%M).rdb
```

#### 4.2 Recovery Procedures

**Database Recovery:**

```bash
# Stop application
docker-compose down

# Restore from backup
gunzip < /backups/db_20240108.sql.gz | PGPASSWORD=fantasyf1 psql -U fantasy -h db -d fantasyf1

# Verify data
python scripts/verify_data.py

# Start application
docker-compose up -d
```

---

## Appendix

### A. Required Python Packages

Production `requirements.txt`:

```txt
# Web Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
gunicorn==21.2.0

# Database
sqlalchemy==2.0.25
alembic==1.13.1
asyncpg==0.29.0
psycopg2-binary==2.9.9

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# Validation
pydantic==2.5.3
pydantic-settings==2.1.0
email-validator==2.1.0.post1

# Redis
redis==5.0.1
hiredis==2.2.3

# Celery
celery==5.3.6
redis==5.0.1

# MQTT
paho-mqtt==1.6.1

# HTTP
httpx==0.25.2
requests==2.31.0

# Utilities
python-dotenv==1.0.0
python-dateutil==2.8.2
pytz==2023.3.post1

# Monitoring
prometheus-fastapi-instrumentator==7.0.0
sentry-sdk[fastapi]==1.40.0

# CORS
python-cors==1.0.0

# Environment
pydantic-settings==2.1.0
```

### B. Development Tools Installation

```bash
# Install Docker Desktop
# Download from https://www.docker.com/products/docker-desktop/

# Install Git
# Download from https://git-scm.com/download/win

# Install Visual Studio Code
# Download from https://code.visualstudio.com/

# Install VS Code extensions
code --install-extension ms-python.python
code --install-extension ms-azuretools.vscode-docker
code --install-extension ms-vscode-remote.remote-containers
code --install-extension GitHub.copilot
code --install-extension eamodio.gitlens
```

### C. Quick Start Commands

```bash
# Clone repositories
git clone https://github.com/orgname/f1_documentation.git
git clone https://github.com/orgname/f1_backend.git
cd f1_backend

# Start development environment
docker-compose up -d

# Run tests
pytest

# Run linting
black app tests
isort app tests
flake8 app tests
mypy app

# Create migration
alembic revision --autogenerate -m "migration message"

# Apply migration
alembic upgrade head

# Stop development environment
docker-compose down
```

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | Project Lead | Initial project dev startup MVP documentation |

---

## Next Steps

1. Review this document with the development team
2. Create GitHub repositories as outlined
3. Set up development environments for team members
4. Implement the Backend MVP as outlined in the Backend MVP document
5. Once Backend MVP is complete, begin Frontend MVP development