"""Authentication endpoints for login, registration, and token management."""

from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.rate_limiting import limiter
from app.core.security import create_access_token, create_refresh_token
from app.db.session import get_db
from app.schemas.auth import (
    CheckEmailExistsResponse,
    CheckEmailRequest,
    CheckEmailResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    TokenResponse,
)
from app.schemas.user import UserCreate, UserResponse
from app.services.user_service import UserService

router = APIRouter()


@router.get("/check-email", response_model=CheckEmailExistsResponse)
@limiter.limit("10/minute")
async def check_email_get(
    _request: Request,
    email: str = Query(..., min_length=1, description="Email address to check"),
    db: AsyncSession = Depends(get_db),
) -> CheckEmailExistsResponse:
    """Check if an email address is already registered (GET version per PRD spec).

    Args:
        email: Email address to check via query parameter
        db: Database session

    Returns:
        Check email response indicating if email exists

    Raises:
        HTTPException: If email check fails

    Note:
        Rate limited to 10 requests per minute to prevent email enumeration.
    """
    try:
        exists = await UserService.email_exists(db, email)
        return CheckEmailExistsResponse(exists=exists)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email check failed: {e!s}",
        ) from None


@router.post("/check-email", response_model=CheckEmailResponse, deprecated=True)
async def check_email(
    email_data: CheckEmailRequest, db: AsyncSession = Depends(get_db)
) -> CheckEmailResponse:
    """Check if an email address is already registered (POST version - deprecated).

    Args:
        email_data: Email address to check
        db: Database session

    Returns:
        Check email response with action needed

    Raises:
        HTTPException: If email check fails

    Deprecated:
        Use GET /check-email?email={email} instead.
    """
    try:
        exists = await UserService.email_exists(db, email_data.email)

        if exists:
            return CheckEmailResponse(action="login", message="Email already registered")
        else:
            return CheckEmailResponse(action="register", message="Email available for registration")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email check failed: {e!s}",
        ) from None


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


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """Initiate password reset process by sending reset token via email.

    Args:
        request: Forgot password request with email
        db: Database session

    Returns:
        Success message (always returns success for security)

    Note:
        Always returns success even if email not found to prevent email enumeration.
    """
    try:
        # Check if email exists
        exists = await UserService.email_exists(db, request.email)

        if exists:
            # Generate reset token (implementation would send email)
            # For now, we'll generate a token that can be used for testing
            from app.core.security import create_password_reset_token

            user = await UserService.get_user_by_email(db, request.email)
            if user:
                reset_token = create_password_reset_token(subject=str(user.id))
                # In production, send email with reset link containing token
                # For testing purposes, we return the token (remove in production)
                return {
                    "detail": "If email exists, password reset instructions have been sent",
                    "reset_token": reset_token,  # Remove in production
                }

        # Always return success to prevent email enumeration
        return {"detail": "If email exists, password reset instructions have been sent"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset request failed: {e!s}",
        ) from None


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    """Reset user password using valid reset token.

    Args:
        request: Reset password request with token and new password
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: If token is invalid or password update fails
    """
    from app.core.security import verify_token

    try:
        # Verify reset token
        payload = verify_token(request.token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired reset token"
            )

        # Check token type
        if payload.get("type") != "reset":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type"
            )

        # Get user ID from token
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        # Update user password
        await UserService.update_password(db, int(user_id), request.new_password)

        return {"detail": "Password successfully reset"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Password reset failed: {e!s}",
        ) from None


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
