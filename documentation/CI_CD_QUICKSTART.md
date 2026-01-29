# CI/CD Quick Start Guide

## What's Been Setup

✅ **GitHub Actions CI/CD Pipeline** - Automated testing, building, and Docker image deployment
✅ **Docker Compose Files** - For testing and production environments
✅ **Mosquitto Initialization Script** - Dynamic MQTT broker configuration
✅ **Environment Configuration** - .env.example for easy setup
✅ **Documentation** - Comprehensive CI/CD setup guide

## Files Created

### Core Files
- `.github/workflows/ci.yml` - GitHub Actions workflow
- `docker-compose.test.yml` - Testing environment configuration
- `docker-compose.yml` - Production environment configuration
- `init-mosquitto-test.sh` - Mosquitto broker initialization script
- `.env.example` - Environment variables template

### Documentation
- `documentation/CI_CD_SETUP.md` - Complete setup and troubleshooting guide
- `CI_CD_QUICKSTART.md` - This quick start guide

## Next Steps

### 1. Configure GitHub Repository Secrets

You need to add these secrets to your GitHub repository:
- **DOCKER_HUB_USERNAME** - Your Docker Hub username
- **DOCKER_HUB_ACCESS_TOKEN** - Your Docker Hub access token

**To add secrets:**
1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the correct values

### 2. Create Docker Hub Access Token (if needed)

1. Log in to Docker Hub
2. Go to **Account Settings** → **Security** → **New Access Token**
3. Enter a description (e.g., "GitHub Actions CI/CD")
4. Grant **Read & Write** access
5. Copy the generated token
6. Add it as a secret in GitHub (see step 1)

### 3. Test Locally

**Copy environment file:**
```bash
cp .env.example .env
```

**Edit .env** with your actual values for secrets, passwords, etc.

**Start services:**
```bash
# For testing
docker compose -f docker-compose.test.yml up -d

# For production
docker compose up -d
```

**Run tests:**
```bash
cd FantasyF1_BE
pytest tests/ -v --cov=app
```

### 4. Push to GitHub

The CI pipeline will automatically run when you push to:
- `main` branch
- `develop` branch
- `dev_sprint_phase*` branches

**Example push:**
```bash
git add .
git commit -m "Add CI/CD pipeline setup"
git push origin dev_sprint_phase2
```

## How the CI Pipeline Works

### Smart Change Detection
The pipeline only runs when relevant files change:
- Backend code
- Docker Compose files
- Dockerfiles
- Requirements files
- Workflow files

### Pipeline Stages
1. **Detect Changes** - Identify what changed
2. **Run Tests** - Build, test, and lint code
3. **Build Image** - Create and push Docker image (push only)
4. **Security Scan** - Check for vulnerabilities (push only)

### Docker Image Tags
Images are tagged with:
- Branch name (e.g., `dev_sprint_phase2`)
- Version (e.g., `2026.01.19-dev-abc1234`)
- `latest` (for main branch only)

## Common Commands

### Local Development
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f backend

# Stop services
docker compose down

# Stop and remove volumes (data loss!)
docker compose down -v
```

### CI Testing
```bash
# Run CI checks locally
cd FantasyF1_BE
.\scripts\run_ci_checks.bat    # Windows
./scripts/run_ci_checks.sh     # Linux/Mac
```

### Debugging
```bash
# Check container status
docker compose ps

# View specific service logs
docker compose logs postgres
docker compose logs redis
docker compose logs mosquitto

# Run commands in containers
docker compose exec backend python -c "print('test')"
docker compose exec postgres psql -U fantasyf1_user -d fantasyf1_db
```

## Troubleshooting

### Pipeline Not Running
- Check that you pushed to the correct branch
- Verify relevant files changed
- Check GitHub Actions tab for errors

### Docker Hub Authentication Failed
- Verify DOCKER_HUB_USERNAME secret
- Verify DOCKER_HUB_ACCESS_TOKEN secret
- Check token has read/write permissions

### Services Won't Start
- Check `.env` file exists with required variables
- Verify Docker is running
- Check port conflicts

### Tests Failing in CI
- Review logs in the "Show service logs" step
- Check that services are healthy before tests run
- Verify test isolation and cleanup

## Important Notes

⚠️ **Never commit `.env` files** - They should remain in .gitignore

⚠️ **Keep secrets secure** - Use GitHub repository secrets for credentials

⚠️ **Test locally first** - Run CI checks before pushing to avoid pipeline failures

⚠️ **Monitor pipeline health** - Check the Actions tab regularly for issues

## Future Enhancements

When ready, you can:
1. Add frontend container to docker-compose.yml
2. Implement automated deployment to staging/production
3. Add performance tests to CI pipeline
4. Set up automated dependency scanning
5. Create rollback mechanisms for failed deployments

## Documentation

For detailed information, see:
- **documentation/CI_CD_SETUP.md** - Complete setup guide
- **Documentation/DEV_PHASES.md** - Development phases overview
- **Documentation/DEV_SPRINTS.md** - Current sprint status

## Support

If you encounter issues:
1. Check the troubleshooting section in CI_CD_SETUP.md
2. Review GitHub Actions logs
3. Check Docker container logs
4. Verify environment variables
5. Ensure all secrets are configured correctly

---

**Happy coding! 🚀**
