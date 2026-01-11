#!/bin/bash

# Post-create script for devcontainer
# This script runs after the container is created

set -e

echo "============================================"
echo "Setting up development environment..."
echo "============================================"

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -U fantasyf1_test -d fantasyf1_test; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
until redis-cli -h redis ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "Redis is ready!"

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

echo "============================================"
echo "Development environment ready!"
echo "============================================"
echo ""
echo "You can now:"
echo "  - Run tests: pytest tests/ --cov=app"
echo "  - Start the app: uvicorn app.main:app --reload"
echo "  - Run CI checks: ./run_ci_checks.sh"
echo ""
