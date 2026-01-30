"""FastAPI Application Entry Point"""

import subprocess
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from app.core.exceptions import (
    BadRequestError,
    ConflictError,
    FantasyF1Error,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
)
from app.core.logging import setup_logging

# Setup logging
setup_logging()


def run_migrations() -> None:
    """Run Alembic migrations on startup"""
    try:
        subprocess.run(
            ["alembic", "upgrade", "head"],
            check=True,
            capture_output=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"Migration failed: {e}")
        print(f"stdout: {e.stdout.decode()}")
        print(f"stderr: {e.stderr.decode()}")
        raise


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager"""
    # Startup
    run_migrations()
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


# Exception handlers
@app.exception_handler(FantasyF1Error)
async def fantasy_f1_exception_handler(_: Request, exc: FantasyF1Error) -> JSONResponse:
    """Handle custom Fantasy F1 exceptions"""
    status_code = 500
    if isinstance(exc, NotFoundError):
        status_code = 404
    elif isinstance(exc, BadRequestError):
        status_code = 400
    elif isinstance(exc, UnauthorizedError):
        status_code = 401
    elif isinstance(exc, ForbiddenError):
        status_code = 403
    elif isinstance(exc, ConflictError):
        status_code = 409
    elif isinstance(exc, ValidationError):
        status_code = 422
    return JSONResponse(
        status_code=status_code,
        content={"detail": exc.message, "details": exc.details},
    )


# Create API v1 router
api_v1_router = APIRouter(prefix=settings.API_V1_PREFIX)
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
api_v1_router.include_router(admin.router, prefix="/admin", tags=["Admin"])

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
