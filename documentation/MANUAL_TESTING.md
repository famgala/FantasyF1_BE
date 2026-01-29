# Manual Testing Guide for GitHub Actions Workflows

This guide shows how to test the workflow locally without installing additional applications.

## Prerequisites

You only need:
- **Docker** (already required for the project)
- **Docker Compose** (already required for the project)

## Testing the Workflow Changes

Our workflow fix was about the Docker image reference format. Let's test that the image pull command works correctly.

### Step 1: Build the Docker Image

Build the backend image locally:

``` bash
docker build -t docker.io/famgala/fantasyf1-be:test FantasyF1_BE/
```

### Step 2: Get the Image Digest

Get the SHA256 digest of the built image:

```bash
docker inspect docker.io/famgala/fantasyf1-be:test --format='{{index .RepoDigests 0}}'
```

This will output something like:
```
docker.io/famgala/fantasyf1-be@sha256:abc123...
```

### Step 3: Test the Image Pull Command

This is the key test - verify that the image pull format works:

```bash
# This should work (this is what our workflow now does)
docker pull docker.io/famgala/fantasyf1-be@sha256:abc123...
```

If this command succeeds, it means our fix is correct!

### Step 4: Verify Image Exists

```bash
docker images | grep fantasyf1-be
```

### Step 5: Test Running the Container

```bash
docker run --rm docker.io/famgala/fantasyf1-be:latest --version
```

## Testing the Security Scan (Optional)

If you want to test the Trivy security scanning step manually:

### Install Trivy (Windows)

Download from: https://github.com/aquasecurity/trivy/releases

Or use Chocolatey:
```bash
choco install trivy
```

### Run Security Scan

```bash
trivy image docker.io/famgala/fantasyf1-be:latest
```

## Validating YAML Syntax

Verify the workflow file is syntactically correct:

### Using Python

```bash
python -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"
```

### Using Docker

```bash
docker run --rm -v ${PWD}:/workdir mikefarah/yq eval '.' .github/workflows/ci.yml
```

## Testing Docker Compose

The workflow uses `docker-compose.test.yml` for testing. Let's verify that works:

### Start Test Services

```bash
docker compose -f docker-compose.test.yml up -d
```

### Check Container Status

```bash
docker compose -f docker-compose.test.yml ps
```

### Run Tests

```bash
docker compose -f docker-compose.test.yml exec backend pytest tests/ -v
```

### Cleanup

```bash
docker compose -f docker-compose.test.yml down -v
```

## Summary of What We Fixed

The workflow now uses:
```yaml
# Build job outputs (only dynamic values)
outputs:
  digest: ${{ steps.build.outputs.digest }}
  version: ${{ steps.version.outputs.version }}

# Security-scan job (uses static image name)
docker pull docker.io/famgala/fantasyf1-be@${{ needs.build.outputs.digest }}
```

Instead of the broken approach:
```yaml
# This doesn't work - env vars not available in job outputs
outputs:
  image: ${{ env.IMAGE_NAME }}  # This was evaluating to empty string!
```

## Quick Test Commands

Run these commands to validate the fix:

```bash
# 1. Build image
docker build -t docker.io/famgala/fantasyf1-be:test FantasyF1_BE/

# 2. Get digest
DIGEST=$(docker inspect docker.io/famgala/fantasyf1-be:test --format='{{index .RepoDigests 0}}')
echo "Digest: $DIGEST"

# 3. Test pull with digest format (this is what the workflow does)
docker pull $DIGEST

# 4. Verify success
docker images docker.io/famgala/fantasyf1-be
```

## What to Look For

✅ **Success**: The `docker pull` command with the digest format works correctly
✅ **Image Tag Format**: Should be `docker.io/famgala/fantasyf1-be@sha256:abc123...`
❌ **Failure**: Command shows `docker pull @sha256:...` (missing image name)

If Step 3 succeeds with the format `docker.io/famgala/fantasyf1-be@sha256:abc123...`, then our workflow fix is correct!
