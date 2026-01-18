# Authentication & Authorization

This document describes the authentication and authorization implementation for the Fantasy F1 Backend system, including JWT token handling, security measures, and user management.

---

## Authentication Overview

The system uses JWT (JSON Web Tokens) for authentication, providing a stateless and scalable authentication mechanism.

### Authentication Flow

```
1. User Registers
   ↓
2. Credentials Stored (hashed)
   ↓
3. User Logs In
   ↓
4. JWT Tokens Generated (access + refresh)
   ↓
5. Access Token Sent to Client
   ↓
6. Client Includes Token in Requests
   ↓
7. Server Validates Token
   ↓
8. User is Authenticated
   ↓
9. Access Token Expires
   ↓
10. Refresh Token Used to Get New Access Token
```

---

## Authentication Implementation

### User Registration

```python
# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app import schemas
from app.services.user_service import UserService
from app.db.session import get_db
from app.core.security import get_password_hash

router = APIRouter()

@router.post("/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: schemas.UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user."""
    user_service = UserService(db)
    
    # Check if username exists
    if await user_service.get_by_username(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email exists
    if await user_service.get_by_email(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = await user_service.create(user_data)
    return user
```

### User Login

```python
# app/api/v1/endpoints/auth.py (continued)
from app.core.security import verify_password, create_access_token, create_refresh_token

@router.post("/login", response_model=schemas.Token)
async def login(
    credentials: schemas.UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return tokens."""
    user_service = UserService(db)
    
    # Try username first, then email
    user = await user_service.get_by_username(credentials.username)
    if not user:
        user = await user_service.get_by_email(credentials.username)
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    await db.commit()
    
    # Create tokens
    access_token = create_access_token(user_id=user.id)
    refresh_token = create_refresh_token(user_id=user.id)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user
    }
```

### Token Refresh

```python
# app/api/v1/endpoints/auth.py (continued)
from app.core.security import verify_refresh_token

@router.post("/refresh", response_model=schemas.TokenRefresh)
async def refresh_token(
    token_data: schemas.RefreshToken,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token."""
    # Verify refresh token
    payload = verify_refresh_token(token_data.refresh_token)
    user_id = payload.get("sub")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_service = UserService(db)
    user = await user_service.get(user_id)
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new access token
    access_token = create_access_token(user_id=user.id)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }
```

---

## JWT Token Implementation

### Security Configuration

```python
# app/core/security.py
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Secret key (loaded from environment)
SECRET_KEY = settings.SECRET_KEY
REFRESH_SECRET_KEY = settings.REFRESH_SECRET_KEY or settings.SECRET_KEY
```

### Password Hashing

```python
# app/core/security.py (continued)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def validate_password_strength(password: str) -> bool:
    """Validate password strength requirements."""
    if len(password) < 8:
        return False
    if not any(c.isupper() for c in password):
        return False
    if not any(c.islower() for c in password):
        return False
    if not any(c.isdigit() for c in password):
        return False
    return True
```

### Access Token

```python
# app/core/security.py (continued)

def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str) -> Optional[dict]:
    """Verify and decode JWT access token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "access":
            return None
            
        return payload
    except JWTError:
        return None
```

### Refresh Token

```python
# app/core/security.py (continued)

def create_refresh_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT refresh token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify and decode JWT refresh token."""
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "refresh":
            return None
            
        return payload
    except JWTError:
        return None
```

---

## Dependency Injection

### Get Current User

```python
# app/api/deps/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from jose import JWTError
from app.core.security import verify_access_token
from app.db.session import get_db
from app.services.user_service import UserService

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token
    payload = verify_access_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = int(user_id_str)
    except ValueError:
        raise credentials_exception
    
    # Get user from database
    user_service = UserService(db)
    user = await user_service.get(user_id)
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return user
```

### Get Current Active User

```python
# app/api/deps/auth.py (continued)

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
```

### Get Current Admin

```python
# app/api/deps/auth.py (continued)
from app.models.user import UserRole

async def get_current_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Get current admin user."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user
```

---

## Authorization

### Resource Ownership

```python
# app/api/deps/authorization.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.user import User
from app.models.team import Team

async def require_team_ownership(
    team_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> Team:
    """Verify user owns the team."""
    team = await db.execute(select(Team).where(Team.id == team_id))
    team = team.scalar_one_or_none()
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    if team.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this team"
        )
    
    return team
```

### League Ownership

```python
# app/api/deps/authorization.py (continued)

async def require_league_ownership(
    league_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
) -> League:
    """Verify user created the league."""
    league = await db.execute(select(League).where(League.id == league_id))
    league = league.scalar_one_or_none()
    
    if not league:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="League not found"
        )
    
    if league.creator_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this league"
        )
    
    return league
```

---

## Rate Limiting

### Rate Limit Implementation

```python
# app/core/rate_limiting.py
from fastapi import Request, HTTPException, status
from redis import asyncio as aioredis
from app.core.config import settings

class RateLimiter:
    """Rate limiting using Redis."""
    
    def __init__(self):
        self.redis_client = None
    
    async def init(self):
        """Initialize Redis client."""
        self.redis_client = await aioredis.from_url(
            f"redis://{settings.REDIS_HOST}:{settings.REDIS_PORT}",
            encoding="utf-8",
            decode_responses=True
        )
    
    async def check_rate_limit(
        self,
        identifier: str,
        limit: int,
        window: int
    ) -> bool:
        """Check if request is within rate limit."""
        if not self.redis_client:
            return True  # Disable rate limiting if Redis is unavailable
        
        key = f"rate_limit:{identifier}"
        current_time = int(datetime.utcnow().timestamp())
        
        # Add current request
        await self.redis_client.zadd(key, {str(current_time): current_time})
        
        # Remove old requests outside time window
        await self.redis_client.zremrangebyscore(
            key,
            0,
            current_time - window
        )
        
        # Count requests in window
        count = await self.redis_client.zcard(key)
        
        if count > limit:
            return False
        
        # Set expiry
        await self.redis_client.expire(key, window)
        return True

# Global rate limiter instance
rate_limiter = RateLimiter()
```

### Rate Limit Middleware

```python
# app/core/rate_limiting.py (continued)
from fastapi import Depends
from app.api.deps.auth import get_current_user

async def rate_limit_by_ip(request: Request):
    """Rate limit by IP address."""
    identifier = request.client.host
    limit = 100  # requests per hour
    window = 3600  # 1 hour in seconds
    
    if not await rate_limiter.check_rate_limit(identifier, limit, window):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Window": str(window)
            }
        )

async def rate_limit_by_user(user: User = Depends(get_current_active_user)):
    """Rate limit by authenticated user."""
    identifier = f"user:{user.id}"
    
    # Different limits for different user tiers
    if user.premium:
        limit = 5000  # Premium users
    else:
        limit = 1000  # Regular users
    
    window = 3600  # 1 hour in seconds
    
    if not await rate_limiter.check_rate_limit(identifier, limit, window):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Window": str(window)
            }
        )
```

---

## Security Best Practices

### Password Security

1. **Strong Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one lowercase letter
   - At least one number

2. **Secure Hashing**
   - Using bcrypt with salt
   - Cost factor of 12 (appropriate for current hardware)
   - Never store plain text passwords

3. **Password Reset**
   - Token-based password reset
   - Tokens expire after 1 hour
   - One-time use tokens

### Token Security

1. **Access Token**
   - Short-lived (30 minutes)
   - Stored in memory/httpOnly cookie
   - Revoked on logout

2. **Refresh Token**
   - Longer-lived (30 days)
   - Stored securely (httpOnly cookie)
   - Can be revoked by user

3. **Token Storage**
   - Don't store in localStorage (vulnerable to XSS)
   - Use httpOnly cookies for production
   - Use secure attribute (HTTPS only)

### Transmission Security

1. **HTTPS Only**
   - All API endpoints require HTTPS in production
   - HTTP security headers
   - SSL/TLS certificates

2. **CORS Configuration**
   ```python
   # app/core/config.py
   CORS_ORIGINS = [
       "https://yourfrontend.com",
       "http://localhost:3000",  # Development only
   ]
   ```

3. **Security Headers**
   ```python
   # app/main.py
   app.add_middleware(
       CORSMiddleware,
       allow_origins=settings.CORS_ORIGINS,
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

---

## User Roles

### Role Hierarchy

```
Admin (highest)
  ├── Can access all resources
  ├── Can delete any resource
  └── Can manage users

User (standard)
  ├── Can access own resources
  ├── Can create teams and leagues
  └── Can participate in leagues

Guest (unauthenticated)
  └── Can access public endpoints only
```

### Permission Matrix

| Resource | Guest | User | Admin |
|----------|-------|------|-------|
| View public endpoints | ✅ | ✅ | ✅ |
| Register/Login | ✅ | ❌ | ❌ |
| View own profile | ❌ | ✅ | ✅ |
| Create team | ❌ | ✅ | ✅ |
| Update own team | ❌ | ✅ | ✅ |
| Update other's team | ❌ | ❌ | ✅ |
| Create league | ❌ | ✅ | ✅ |
| Delete league | ❌ | Owner | ✅ |
| Manage users | ❌ | ❌ | ✅ |
| View system logs | ❌ | ❌ | ✅ |

---

## Session Management

### Refresh Token Storage

```python
# app/services/session_service.py
from redis import asyncio as aioredis
from datetime import datetime, timedelta
import secrets

class SessionService:
    """Session management for refresh tokens."""
    
    def __init__(self, redis_client):
        self.redis = redis_client
    
    async def create_session(self, user_id: int) -> str:
        """Create a new session with refresh token."""
        # Generate unique session ID
        session_id = secrets.token_urlsafe(32)
        
        # Store session
        session_data = {
            "user_id": user_id,
            "created_at": datetime.utcnow().isoformat(),
            "last_used": datetime.utcnow().isoformat()
        }
        
        key = f"session:{session_id}"
        await self.redis.hset(key, mapping=session_data)
        await self.redis.expire(key, 30 * 24 * 60 * 60)  # 30 days
        
        return session_id
    
    async def get_session(self, session_id: str) -> Optional[dict]:
        """Get session data."""
        key = f"session:{session_id}"
        return await self.redis.hgetall(key)
    
    async def update_last_used(self, session_id: str):
        """Update last used timestamp."""
        key = f"session:{session_id}"
        await self.redis.hset(key, "last_used", datetime.utcnow().isoformat())
    
    async def revoke_session(self, session_id: str):
        """Revoke session."""
        key = f"session:{session_id}"
        await self.redis.delete(key)
    
    async def revoke_all_user_sessions(self, user_id: int):
        """Revoke all sessions for a user."""
        pattern = f"session:*"
        async for key in self.redis.scan_iter(match=pattern):
            session = await self.redis.hgetall(key)
            if int(session.get("user_id", -1)) == user_id:
                await self.redis.delete(key)
```

---

## Related Documentation

- [Security](security.md) - Comprehensive security measures
- [API Endpoints](api_endpoints.md) - Authentication endpoints
- [Business Logic](business_logic.md) - UserService implementation
- [Error Handling](error_handling.md) - Authentication error handling