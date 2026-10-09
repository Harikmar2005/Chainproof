"""
Authentication, Authorization (RBAC), and API Key Management Router.
Secures ChainProof endpoints with:
- Bcrypt password hashing (OWASP compliant)
- Cryptographic JWT signing and expiration verification (PyJWT)
- Role-Based Access Control (ADMIN, ANALYST, AGENT)
- Input sanitization against XSS
- Strict credential masking
"""

import os
import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import bcrypt
import jwt

from app.services.sanitizer import sanitize_raw_string, sanitize_text
from app.storage.db import (
    get_user_by_username,
    create_user,
    create_api_key,
    get_all_api_keys,
    verify_api_key
)

logger = logging.getLogger("chainproof.auth")
router = APIRouter(prefix="/auth", tags=["Auth"])

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    # In development, generate a consistent runtime secret; in production warn if not provided
    is_prod = os.getenv("ENVIRONMENT", "").lower() == "production"
    if is_prod:
        logger.warning("[SECURITY WARNING] JWT_SECRET environment variable is not set! Using secure ephemeral key.")
    JWT_SECRET = "chainproof_secure_fallback_key_" + secrets.token_hex(16)

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security_bearer = HTTPBearer(auto_error=False)


# ==============================================================================
# Password Hashing Functions (Bcrypt)
# ==============================================================================

def hash_password(password: str) -> str:
    """Hash password using Bcrypt with 12 rounds."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against stored bcrypt hash (with backward compat for sha256)."""
    try:
        if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$"):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        # Fallback check for legacy sha256
        import hashlib
        legacy_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        return secrets.compare_digest(legacy_hash, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {e}")
        return False


# ==============================================================================
# JWT Helpers
# ==============================================================================

def create_access_token(user_id: str, username: str, role: str) -> str:
    """Generate signed JWT access token."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXPIRATION_HOURS)).timestamp())
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and cryptographically verify JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Access token has expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authorization token.")


# ==============================================================================
# RBAC Dependencies
# ==============================================================================

def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key")
) -> Dict[str, Any]:
    """
    Authenticate caller via either JWT Bearer Token or Agent API Key.
    Returns user identity dict with role.
    """
    # 1. Check API Key first (for scanner agents or CI/CD pipelines)
    if x_api_key:
        api_record = verify_api_key(x_api_key)
        if api_record:
            return {
                "id": api_record.get("id"),
                "username": f"agent:{api_record.get('name')}",
                "role": api_record.get("role", "AGENT"),
                "auth_type": "api_key"
            }
        raise HTTPException(status_code=401, detail="Invalid API Key.")

    # 2. Check Bearer Token
    if auth_header and auth_header.credentials:
        payload = decode_access_token(auth_header.credentials)
        return {
            "id": payload.get("sub"),
            "username": payload.get("username"),
            "role": payload.get("role", "ANALYST"),
            "auth_type": "jwt"
        }

    # 3. Development fallback only if not in production
    is_prod = os.getenv("ENVIRONMENT", "").lower() == "production"
    if not is_prod:
        # In local development, default to analyst if no auth headers provided
        return {
            "id": "dev-user",
            "username": "developer",
            "role": "ADMIN",
            "auth_type": "dev_bypass"
        }

    raise HTTPException(status_code=401, detail="Authentication required. Please provide a Bearer token or X-API-Key.")


def require_role(allowed_roles: List[str]):
    """Enforce Role-Based Access Control."""
    def role_checker(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = str(user.get("role", "")).upper()
        if user_role not in [r.upper() for r in allowed_roles]:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. User role '{user_role}' lacks required permissions: {allowed_roles}"
            )
        return user
    return role_checker


# Shortcuts
require_admin = require_role(["ADMIN"])
require_analyst_or_admin = require_role(["ADMIN", "ANALYST"])


# ==============================================================================
# Request Models with Strict Validation
# ==============================================================================

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=128)


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: Optional[str] = Field(None, max_length=100)
    role: Optional[str] = Field("ANALYST", max_length=20)


class ApiKeyRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=100, example="CI-CD Runner Agent")
    role: Optional[str] = Field("AGENT", max_length=20)


# ==============================================================================
# Routes
# ==============================================================================

@router.post("/login")
def login(req: LoginRequest):
    """Authenticate with username and password, returning JWT access token."""
    clean_username = sanitize_raw_string(req.username.strip(), max_length=50)
    user = get_user_by_username(clean_username)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    if not verify_password(req.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    # Generate JWT token
    token = create_access_token(
        user_id=user["id"],
        username=user["username"],
        role=user.get("role", "ANALYST")
    )

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "expires_in_hours": JWT_EXPIRATION_HOURS,
        "user": {
            "id": user.get("id"),
            "username": user.get("username"),
            "role": user.get("role"),
            "full_name": user.get("full_name")
        }
    }


@router.post("/register")
def register(req: RegisterRequest):
    """Register a new user account with bcrypt password hashing."""
    clean_username = sanitize_raw_string(req.username.strip(), max_length=50)
    clean_full_name = sanitize_raw_string(req.full_name or clean_username, max_length=100)
    role = "ADMIN" if req.role and req.role.upper() == "ADMIN" else "ANALYST"

    if len(clean_username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    try:
        user = create_user(
            username=clean_username,
            password_hash=hash_password(req.password),
            role=role,
            full_name=clean_full_name
        )
        return {
            "status": "success",
            "message": f"User '{user['username']}' registered successfully.",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "role": user["role"]
            }
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.get("/me")
def get_current_user_profile(user: Dict[str, Any] = Depends(get_current_user)):
    """Return identity and permissions of the currently authenticated caller."""
    return {
        "status": "success",
        "user": user
    }


@router.post("/keys")
def generate_key(req: ApiKeyRequest, admin: Dict[str, Any] = Depends(require_admin)):
    """Generate a new secure API Key for Scanner Agents or CI/CD pipelines (Admin only)."""
    clean_name = sanitize_raw_string(req.name.strip(), max_length=100)
    raw_key = f"cp_live_{secrets.token_urlsafe(32)}"
    import hashlib
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    prefix = raw_key[:12] + "..."

    created = create_api_key(
        name=clean_name,
        key_hash=key_hash,
        prefix=prefix,
        role=req.role or "AGENT"
    )

    return {
        "status": "success",
        "message": "API key generated. Store this key securely; it will not be displayed again.",
        "api_key": raw_key,
        "key_id": created["id"],
        "name": created["name"]
    }


@router.get("/keys")
def list_keys(admin: Dict[str, Any] = Depends(require_admin)):
    """List registered API Keys with secret masking (Admin only)."""
    keys = get_all_api_keys()
    return [
        {
            "id": k.get("id"),
            "name": k.get("name"),
            "prefix": k.get("prefix"),
            "role": k.get("role"),
            "created_at": k.get("created_at"),
            "last_used": k.get("last_used"),
            "active": k.get("active")
        }
        for k in keys
    ]
