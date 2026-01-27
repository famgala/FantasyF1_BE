# Docker Setup Guide

This guide explains how to set up and run FantasyF1 using Docker.

## Quick Start (Local Development)

This is the simplest way to get the app running locally without any CI/CD or registry setup.

### Prerequisites

- Docker and Docker Compose installed
- Git

### Steps

1. **Clone the repository**
   ```bash
   git clone git@github.com:famgala/FantasyF1.git
   cd FantasyF1
   ```

2. **Create docker-compose.yml from example**
   ```bash
   cp docker-compose.example.yml docker-compose.yml
   ```

3. **Create .env from example**
   ```bash
   cp .env.dev .env
   # OR if you have a backend .env.example:
   cp FantasyF1_BE/.env.example .env
   ```

4. **Start all services**
   ```bash
   docker-compose up -d
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### What This Does

When you run `docker-compose up`, it will:

1. **Build images locally** - No registry needed
   - Backend: Builds from `FantasyF1_BE/Dockerfile`
   - Frontend: Builds from `FantasyF1_FE/Dockerfile`
   - Infrastructure: Uses official images (postgres, redis, mosquitto)

2. **Start all services**
   - PostgreSQL database (port 5432)
   - Redis cache (port 6379)
   - MQTT broker (port 1883)
   - Backend API (port 8000)
   - Frontend web app (port 3000)

3. **Create required volumes**
   - postgres-data (database persistence)
   - redis-data (cache persistence)
   - mosquitto (MQTT data and logs)
   - backend_uploads (file uploads)
   - backend_logs (application logs)

### Stopping the Services

```bash
docker-compose down          # Stop all containers
docker-compose down -v       # Stop and remove all volumes
```

---

## CI/CD Workflow (GitHub Actions)

The `ci-cd.example.yml` file is for **automated building and deployment in GitHub Actions**, not for local development.

### When Does CI/CD Run?

The CI/CD workflow triggers on:

1. **Push to branches**: `main`, `develop`, `dev_*`, or any branch ending in `-dev`
2. **Pull requests to main**
3. **Only when files change** in:
   - `backend/**`
   - `FantasyF1_FE/**`
   - `docker-compose*.yml`
   - `.github/workflows/**`
   - Requirements files
   - Dockerfiles

### Image Tagging Strategy

Images are tagged based on branch name:

| Branch Name | Image Tags Created |
|-------------|-------------------|
| `main` | `latest`, branch name, SHA |
| `develop` | `nightly`, branch name, SHA |
| `dev_*` | `dev`, branch name, SHA |
| `*-dev` | `dev`, branch name, SHA |
| Other | branch name, SHA |

### Example Scenarios

**Scenario 1: Push to `frontend-dev` branch**
```bash
git checkout -b frontend-dev
# Make changes to FantasyF1_FE/src/App.tsx
git add .
git commit -m "Update frontend"
git push origin frontend-dev
```

**Result:**
- ✅ CI/CD triggers (because FantasyF1_FE files changed)
- ✅ Builds frontend image with tags: `dev`, `frontend-dev`, SHA
- ✅ Builds backend image only if backend files changed
- ✅ Pushes images to Docker Hub (if configured)
- ❌ Does NOT build local images or start services

**Scenario 2: Push to `frontend-dev` with no file changes**
```bash
git checkout -b frontend-dev
# No file changes needed
git commit --allow-empty -m "Empty commit"
git push origin frontend-dev
```

**Result:**
- ❌ CI/CD does NOT trigger (no watched files changed)
- ❌ No images built
- ❌ No images pushed

**Scenario 3: Local development**
```bash
# Just work locally, no GitHub push needed
docker-compose up -d
# Make changes, test locally
docker-compose down
```

**Result:**
- ✅ Images built locally
- ✅ Services started locally
- ❌ No CI/CD involved
- ❌ No Docker Hub upload

---

## Setting Up CI/CD (Optional)

If you want to use GitHub Actions to build and push images:

### 1. Docker Hub Setup

1. Create a Docker Hub account at https://hub.docker.com
2. Create an access token:
   - Go to Account Settings → Security → Access Tokens
   - Click "New Access Token"
   - Copy the token

### 2. GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets → New repository secret):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `DOCKER_HUB_USERNAME` | Docker Hub username | `famgala` |
| `DOCKER_HUB_ACCESS_TOKEN` | Docker Hub access token | `dckr_pat_xxxxx` |

### 3. Activate CI/CD

Rename the example file:
```bash
mv ci-cd.example.yml .github/workflows/ci-cd.yml
```

---

## Troubleshooting

### Port Already in Use

If you get port conflicts, change ports in `.env`:

```bash
# Edit .env file
FRONTEND_PORT=3001
BACKEND_PORT=8001
```

### Permission Issues on Linux

```bash
sudo usermod -aG docker $USER
# Log out and back in
```

### Containers Won't Start

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend
docker-compose logs frontend
```

### Rebuild from Scratch

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d
# Wait for services to start
# Backend will auto-initialize tables
```

---

## Development Workflow

### Recommended Workflow

1. **Local Development**
   ```bash
   docker-compose up -d
   # Make changes
   # Test at http://localhost:3000
   docker-compose logs -f frontend  # Watch frontend logs
   docker-compose logs -f backend   # Watch backend logs
   ```

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

3. **Push to Feature Branch**
   ```bash
   git checkout -b feature-xyz-dev
   git push origin feature-xyz-dev
   ```

4. **CI/CD Builds** (only if pushed to monitored branches)
   - If branch ends in `-dev`, images built with `dev` tag
   - Images pushed to Docker Hub (if configured)

5. **Pull Request** (optional)
   ```bash
   # Create PR on GitHub
   # CI build runs automatically
   ```

---

## Environment Variables

### Required .env Variables

```bash
# Database
POSTGRES_DB=fantasy_f1
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_PASSWORD=your_redis_password

# MQTT
MQTT_USERNAME=mqtt_user
MQTT_PASSWORD=your_mqtt_password

# Backend
SECRET_KEY=your_secret_key_min_32_chars
JWT_SECRET_KEY=your_jwt_secret_key
DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/fantasy_f1

# Frontend
REACT_APP_API_URL=http://localhost:8000
```

See `.env.dev` or `FantasyF1_BE/.env.example` for complete list.

---

## Project Structure

```
FantasyF1/
├── FantasyF1_BE/              # Backend (FastAPI)
│   ├── Dockerfile             # Backend Dockerfile
│   ├── app/                   # Application code
│   └── tests/                 # Backend tests
├── FantasyF1_FE/              # Frontend (React)
│   ├── Dockerfile             # Frontend Dockerfile
│   ├── nginx.conf             # Nginx configuration
│   ├── .dockerignore          # Docker build exclusions
│   ├── src/                   # React source code
│   └── public/                # Static assets
├── docker-compose.example.yml # Example compose file
├── ci-cd.example.yml          # Example CI/CD workflow
├── .env.dev                   # Example environment file
└── .github/workflows/         # GitHub Actions (when activated)
```

---

## FAQ

### Q: Do I need Docker Hub for local development?
**A:** No. `docker-compose up` builds everything locally without any registry.

### Q: Will pushing to GitHub automatically build images?
**A:** Only if:
1. You've renamed `ci-cd.example.yml` to `.github/workflows/ci-cd.yml`
2. You've configured GitHub secrets for Docker Hub
3. You've changed files in watched paths (backend, frontend, docker files, etc.)

### Q: What's the difference between docker-compose.yml and ci-cd.yml?
**A:**
- `docker-compose.yml`: Local development, builds images locally
- `ci-cd.yml`: GitHub Actions, builds and pushes to Docker Hub

### Q: Can I use this without GitHub?
**A:** Yes! Just use `docker-compose up` for local development.

### Q: Do images get built on every commit?
**A:** No, only when:
- Files change in watched paths
- AND you're using CI/CD (configured separately)
- AND you push to a monitored branch

### Q: What if I push to a branch not ending in -dev?
**A:** Images still build, but without the `dev` tag. They'll have branch-specific tags instead.

---

## Getting Help

- Check logs: `docker-compose logs`
- Restart services: `docker-compose restart`
- Rebuild: `docker-compose build <service>`
- Reset everything: `docker-compose down -v && docker-compose up -d`

---

## Security Notes

- Never commit `.env` files to Git
- Use strong passwords in production
- Keep Docker Hub secrets secure
- Enable HTTPS in production
- Review nginx security headers
