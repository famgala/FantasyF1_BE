# Security Considerations

This document describes security measures and best practices for the Fantasy F1 Backend system.

---

## Security Overview

Security is paramount for protecting user data and system integrity. Key areas:
- Authentication and authorization
- Data protection
- API security
- Infrastructure security
- Secure coding practices

---

## Authentication Security

### Password Security

#### Hash Passwords

```python
# Use bcrypt for password hashing
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

#### Strong Password Requirements

```python
def validate_password_strength(password: str) -> bool:
    """Validate password meets security requirements."""
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

### Token Security

#### JWT Best Practices

```python
# Use strong secret keys
from app.core.config import settings

# Separate secrets for access and refresh tokens
SECRET_KEY = settings.SECRET_KEY  # Access token secret
REFRESH_SECRET_KEY = settings.REFRESH_SECRET_KEY  # Refresh token secret

# Short-lived access tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Longer-lived refresh tokens (stored in httpOnly cookies)
REFRESH_TOKEN_EXPIRE_DAYS = 30

# Include token type in JWT payload
payload = {
    "sub": str(user_id),
    "type": "access",  # or "refresh"
    "exp": expire,
    "iat": datetime.utcnow()
}
```

#### Token Storage

```bash
# Store in httpOnly cookies (not localStorage)
HTTPONLY_COOKIE
SECURE_COOKIE (HTTPS only)
SAMESITE_COOKIE
```

---

## API Security

### HTTPS Only

```python
# Force HTTPS in production
if settings.ENVIRONMENT == "production":
    from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
    app.add_middleware(HTTPSRedirectMiddleware)
```

### CORS Configuration

```python
# Whitelist allowed origins
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://yourfrontend.com",
        "http://localhost:3000",  # Development only
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Rate Limiting

```python
# Implement rate limiting per IP and user
from app.core.rate_limiting import RateLimiter, rate_limit_by_ip, rate_limit_by_user

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Rate limit by IP
    await rate_limit_by_ip(request)
    
    response = await call_next(request)
    return response

# Rate limit by authenticated user
@router.get("/api/teams")
async def get_teams(
    current_user: User = Depends(get_current_active_user)
):
    await rate_limit_by_user(current_user)
    # ... endpoint logic
```

### Input Validation

```python
# Use Pydantic for input validation
from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_]+$"
    )
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    # Custom validation
    @validator('username')
    def username_must_not_be_admin(cls, v):
        if v.lower() == 'admin':
            raise ValueError('Username cannot be "admin"')
        return v
```

---

## Data Protection

### SQL Injection Prevention

```python
# GOOD: Use parameterized queries (SQLAlchemy)
result = await db.execute(
    select(User).where(User.username == username)
)

# BAD: String concatenation (vulnerable)
query = f"SELECT * FROM users WHERE username = '{username}'"  # DON'T DO THIS
```

### XSS Prevention

```python
# Sanitize user input before storage
from html import escape

def sanitize_input(text: str) -> str:
    """Sanitize user input to prevent XSS."""
    return escape(text)

# Use in services
user.username = sanitize_input(username_data)
```

### Sensitive Data Handling

```python
# Never log sensitive data
import logging

logger.info(f"User created: {user.id}")  # GOOD
logger.info(f"User created: {user.username}, {user.email}")  # OK
logger.info(f"User created: {user.username}, {user.password}")  # BAD - logs password

# Use environment variables for secrets
# .env
DATABASE_URL=postgresql://user:password@localhost/db
SECRET_KEY=your-secret-key
```

### Encryption

```python
# Encrypt sensitive data at rest
from cryptography.fernet import Fernet

class EncryptionService:
    def __init__(self, key: str):
        self.cipher = Fernet(key.encode())
    
    def encrypt(self, data: str) -> str:
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        return self.cipher.decrypt(encrypted_data.encode()).decode()

# Usage
encryption_service = EncryptionService(settings.ENCRYPTION_KEY)
encrypted = encryption_service.encrypt("sensitive data")
decrypted = encryption_service.decrypt(encrypted)
```

---

## Authorization

### Role-Based Access Control

```python
# Define user roles
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

# Create admin-only endpoints
@router.get("/admin/users")
async def get_all_users(
    current_user: User = Depends(get_current_admin)
):
    # Only admin can access this
    pass

# Check ownership
async def require_team_ownership(
    team_id: int,
    current_user: User = Depends(get_current_active_user)
) -> Team:
    """Verify user owns the team."""
    team = await db.query(Team).get(team_id)
    
    if not team or team.user_id != current_user.id:
        raise PermissionError("Not authorized")
    
    return team
```

### Resource-Level Authorization

```python
# Check user can access specific resource
@router.get("/teams/{team_id}")
async def get_team(
    team_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    team = await db.query(Team).get(team_id)
    
    # Check ownership or admin
    if team.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise PermissionError("Not authorized to access this team")
    
    return team
```

---

## Security Headers

```python
# Add security headers
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

---

## Environment Security

### Environment Variables

```bash
# .env (never commit to git)
DATABASE_URL=postgresql://user:password@localhost/db
SECRET_KEY=your-secret-key-here
REFRESH_SECRET_KEY=your-refresh-secret-here
ENCRYPTION_KEY=your-encryption-key-here
REDIS_HOST=localhost
REDIS_PASSWORD=redis-password

# .env.example (commit to git)
DATABASE_URL=postgresql://user:password@localhost/db
SECRET_KEY=your-secret-key-here
```

### Database Security

```python
# Use least privilege
DATABASE_USER=fantasyf1_user  # Not postgres
DATABASE_PASSWORD=strong_password
DATABASE_NAME=fantasyf1_production

# Connect via SSL
DATABASE_URL=postgresql://user:password@localhost/db?sslmode=require
```

---

## Logging and Monitoring

### Security Event Logging

```python
import logging

logger = logging.getLogger(__name__)

# Log security events
logger.warning(
    "Failed login attempt",
    extra={
        "username": username,
        "ip_address": request.client.host,
        "timestamp": datetime.utcnow()
    }
)

logger.info(
    "User role changed",
    extra={
        "user_id": user_id,
        "old_role": old_role,
        "new_role": new_role,
        "admin_id": current_user.id
    }
)

logger.critical(
    "Unauthorized access attempt",
    extra={
        "path": request.url.path,
        "method": request.method,
        "user_id": current_user.id
    }
)
```

### Security Monitoring

```python
# Monitor for suspicious activity
class SecurityMonitor:
    async def check_suspicious_activity(self, user_id: int):
        """Check for suspicious user activity."""
        # Too many failed logins
        failed_logins = await self.count_failed_logins(user_id, hours=1)
        if failed_logins > 5:
            await self.lock_account(user_id)
        
        # Unusual access patterns
        unusual_ips = await self.detect_unusual_ips(user_id)
        if unusual_ips:
            await self.notify_security_team(user_id)
```

---

## Best Practices

### 1. Authentication

- Always hash passwords with bcrypt
- Use strong password requirements
- Implement rate limiting on login
- Use JWT with short expiration
- Store tokens in httpOnly cookies

### 2. Authorization

- Implement role-based access control
- Check resource ownership
- Use principle of least privilege
- Validate permissions on each request
- Log authorization checks

### 3. Data Protection

- Never trust user input
- Use parameterized queries
- Sanitize all user input
- Encrypt sensitive data at rest
- Use HTTPS for all communications

### 4. Infrastructure

- Keep dependencies updated
- Use security headers
- Enable CORS only for trusted origins
- Monitor for security events
- Implement incident response plan

---

## Security Checklist

- [ ] Passwords are hashed with bcrypt
- [ ] JWT tokens have appropriate expiration
- [ ] HTTPS is enforced in production
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented
- [ ] Input validation is in place
- [ ] SQL injection prevention is active
- [ ] XSS prevention is implemented
- [ ] Security headers are set
- [ ] Environment variables are used for secrets
- [ ] Database uses least privilege
- [ ] Security events are logged
- [ ] Dependencies are regularly updated
- [ ] Security monitoring is in place

---

## Related Documentation

- [Authentication](authentication.md) - Authentication implementation
- [Error Handling](error_handling.md) - Error handling
- [API Endpoints](api_endpoints.md) - API security
- [Technology Stack](technology_stack.md) - Security features of tech stack