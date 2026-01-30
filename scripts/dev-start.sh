#!/bin/bash
# Script to start the FantasyF1 development environment

set -e

# Load environment variables
if [ -f ".env.dev" ]; then
    export $(cat .env.dev | grep -v '^#' | xargs)
else
    echo "Error: .env.dev file not found!"
    exit 1
fi

echo "==================================="
echo "Starting FantasyF1 Dev Environment"
echo "==================================="
echo ""
echo "Services starting:"
echo "  - PostgreSQL (internal, port ${POSTGRES_PORT:-5432})"
echo "  - Redis (internal, port ${REDIS_PORT:-6379})"
echo "  - MQTT (internal, port ${MQTT_PORT:-1883})"
echo "  - FastAPI Backend (http://localhost:${BACKEND_PORT:-8000})"
echo "  - Celery Worker"
echo "  - Celery Beat"
echo "  - Flower (http://localhost:${FLOWER_PORT:-5555})"
echo ""
echo "Note: Only Backend and Flower ports are exposed to host."
echo "      Other services are accessible only within the dev network."
echo ""

# Start the dev environment
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "==================================="
echo "Dev Environment Started!"
echo "==================================="
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose -f docker-compose.dev.yml logs -f"
echo "  - Stop environment: ./scripts/dev-stop.sh"
echo "  - Restart backend: docker-compose -f docker-compose.dev.yml restart backend"
echo "  - View backend logs: docker-compose -f docker-compose.dev.yml logs -f backend"
echo "  - Access PostgreSQL: docker exec -it fantasyf1_dev_postgres psql -U fantasyf1_dev"
echo "  - Access Redis: docker exec -it fantasyf1_dev_redis redis-cli -a dev_redis_123"
echo ""
echo "API Documentation: http://localhost:${BACKEND_PORT:-8000}/docs"
echo "Celery Flower: http://localhost:${FLOWER_PORT:-5555}"
echo ""
