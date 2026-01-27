"""FastAPI Application Entry Point"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter

from app.api.v1.endpoints import (
    admin,
    auth,
    constructors,
    drafts,
    drivers,
    invitations,
    league_roles,
    leagues,
    notifications,
    races,
    teams,
    users,
)
from app.cache.client import close_redis, init_redis
from app.core.config import settings
from app.core.logging import setup_logging

# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager"""
    # Startup
    await init_redis()
    yield
    # Shutdown
    await close_redis()


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API for Fantasy F1 application",
    version=settings.APP_VERSION,
    debug=settings.DEBUG,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Create API v1 router
api_v1_router = APIRouter(prefix=settings.API_V1_PREFIX)
api_v1_router.include_router(admin.router, tags=["Admin"])
api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(users.router, prefix="/users", tags=["Users"])
api_v1_router.include_router(drivers.router, prefix="/drivers", tags=["Drivers"])
api_v1_router.include_router(races.router, prefix="/races", tags=["Races"])
api_v1_router.include_router(leagues.router, prefix="/leagues", tags=["Leagues"])
api_v1_router.include_router(league_roles.router, prefix="/leagues", tags=["League Roles"])
api_v1_router.include_router(teams.router, prefix="/leagues", tags=["Teams"])
api_v1_router.include_router(drafts.router, prefix="/leagues", tags=["Drafts"])
api_v1_router.include_router(invitations.router, prefix="/invitations", tags=["Invitations"])
api_v1_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_v1_router.include_router(constructors.router, prefix="/constructors", tags=["Constructors"])

# Include API v1 router
app.include_router(api_v1_router)


@app.get("/health")
async def health_check() -> dict[str, str | bool]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
    }


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint"""
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
