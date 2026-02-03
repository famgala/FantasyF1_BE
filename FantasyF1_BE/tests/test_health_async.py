"""Async tests for health endpoints"""

import pytest


@pytest.mark.asyncio
async def test_health_check_async(client):
    """Test the health check endpoint with async client"""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "debug" in data


@pytest.mark.asyncio
async def test_root_endpoint_async(client):
    """Test the root endpoint with async client"""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert data["docs"] == "/docs"
