"""Authentication endpoints for login, registration, and token management."""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token
from app.db.session import get_db
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)) -> UserResponse:
    """Register a new user account.

    Args:
        user_data: User registration data
        db: Database session

    Returns:
        Created user

    Raises:
        HTTPException: If registration fails
    """
    try:
        user = await UserService.create_user(db, user_data)
        return UserResponse.model_validate(user)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from None


@router.post("/login", response_model=TokenResponse)
async def login(form_data: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    """Authenticate user and return JWT tokens.

    Args:
        form_data: Login credentials
        db: Database session

    Returns:
        Access and refresh tokens

    Raises:
        HTTPException: If authentication fails
    """
    user = await UserService.authenticate(
        db, username=form_data.username, password=form_data.password
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    # Create JWT tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(subject=str(user.id), expires_delta=access_token_expires)
    refresh_token = create_refresh_token(subject=str(user.id), expires_delta=refresh_token_expires)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: RefreshTokenRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """Refresh access token using refresh token.

    Args:
        token_data: Refresh token
        db: Database session

    Returns:
        New access and refresh tokens

    Raises:
        HTTPException: If refresh token is invalid
    """
    from app.core.security import verify_token

    # Verify refresh token
    payload = verify_token(token_data.refresh_token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Check token type
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    # Get user
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await UserService.get_user_by_id(db, int(user_id))
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")

    # Create new tokens
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(subject=str(user.id), expires_delta=access_token_expires)
    refresh_token = create_refresh_token(subject=str(user.id), expires_delta=refresh_token_expires)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
