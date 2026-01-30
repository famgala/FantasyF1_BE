#!/bin/bash
set -e

echo "==================================="
echo "FantasyF1 Dev Container Setup"
echo "==================================="

# Navigate to backend directory
cd /workspace/FantasyF1_BE

# Create Python virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Pre-commit hooks setup (if using pre-commit)
if [ -f ".pre-commit-config.yaml" ]; then
    echo "Setting up pre-commit hooks..."
    pip install pre-commit
    pre-commit install
fi

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p logs
mkdir -p data

# Run database migrations
echo "Running database migrations..."
if [ -f "alembic.ini" ]; then
    alembic upgrade head || echo "Migration failed or already applied - continue"
fi

echo "==================================="
echo "Dev Container Setup Complete!"
echo "==================================="
echo ""
echo "Available commands:"
echo "  - Start backend: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo "  - Run tests: pytest tests/"
echo "  - Format code: black app/ tests/"
echo "  - Lint code: ruff check app/ tests/"
echo "  - Type check: mypy app/"
echo "  - Run Celery: celery -A app.tasks.celery_app worker --loglevel=info"
echo "  - View docs: http://localhost:8000/docs (when backend is running)"
echo ""
