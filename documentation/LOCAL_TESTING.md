# Local Testing Guide for GitHub Actions Workflows

## Testing GitHub Actions Locally with `act`

The `act` tool allows you to run GitHub Actions workflows on your local machine using Docker.

### Installation

#### macOS (via Homebrew)
```bash
brew install act
```

#### Linux
```bash
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

#### Windows (via Scoop)
```powershell
scoop install act
```

### Usage

#### List all jobs in the workflow
```bash
act -l
```

#### Run all jobs
```bash
act
```

#### Run specific job
```bash
act -j job-name
```

Examples:
```bash
# Run only the test job
act -j test

# Run only the build job
act -j build

# Run only the security-scan job
act -j security-scan
```

#### Run with secrets
```bash
act --secret DOCKER_HUB_USERNAME=your_username --secret DOCKER_HUB_ACCESS_TOKEN=your_token
```

#### Run with specific event
```bash
act push          # Simulate a push event
act pull_request  # Simulate a pull request event
```

### Docker Hub Credentials Required

The workflow requires Docker Hub credentials to push images. You'll need to provide these when running `act`:

```bash
act -j build --secret DOCKER_HUB_USERNAME=your_username --secret DOCKER_HUB_ACCESS_TOKEN=your_token
```

### Limitations

1. **GitHub Context**: Some GitHub-specific context may be missing or simulated
2. **Actions**: Not all GitHub Actions are fully supported locally
3. **Caching**: GitHub Actions cache functionality may not work exactly the same
4. **Artifacts**: Artifact uploading/downloading may not work identically

### Troubleshooting

#### Build errors
```bash
act -j build --verbose
```

#### Check Docker daemon
```bash
docker ps
```

#### Clean up containers
```bash
docker-compose down
```

### Alternative: Manual Testing

If `act` has issues, you can manually test individual steps:

#### Test Docker build
```bash
docker build -t famgala/fantasyf1-be:test FantasyF1_BE/
```

#### Test Docker pull
```bash
docker pull docker.io/famgala/fantasyf1-be@<digest>
```

#### Run security scan locally
```bash
# Install Trivy
brew install trivy  # macOS
# or
apt-get install trivy  # Debian/Ubuntu

# Scan image
trivy image docker.io/famgala/fantasyf1-be:latest
```

### Recommended Workflow

1. **Test Individual Commands**: Run docker build/pull commands manually
2. **Use `act` for CI Logic**: Test the workflow logic with `act`
3. **Push to Branch**: Final validation with actual GitHub Actions
4. **Monitor Logs**: Check GitHub Actions logs after push

### Quick Reference

```bash
# Full workflow
act --push

# Test job only
act -j test --secret DOCKER_HUB_USERNAME=your_username --secret DOCKER_HUB_ACCESS_TOKEN=your_token

# Build job only
act -j build --secret DOCKER_HUB_USERNAME=your_username --secret DOCKER_HUB_ACCESS_TOKEN=your_token

# Verbose output
act -v

# Dry run (don't execute)
act -n
