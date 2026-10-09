"""
Enterprise Security Middleware for ChainProof Cloud API
Provides:
1. Rate Limiting with sliding-window token bucket per IP and endpoint
2. Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, etc.)
3. Server information masking
"""

import time
import threading
from typing import Dict, List, Tuple
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

# Thread-safe in-memory rate limiter tracking
_rate_lock = threading.Lock()
# IP -> list of timestamp floats
_ip_request_history: Dict[str, List[float]] = {}
# (IP, path_prefix) -> list of timestamp floats
_endpoint_history: Dict[Tuple[str, str], List[float]] = {}

# Rate limit rules: (path_prefix, max_requests, window_seconds)
RATE_LIMIT_RULES = [
    ("/api/v1/auth/login", 10, 60),      # Max 10 login attempts per minute
    ("/api/v1/auth/register", 5, 60),    # Max 5 registrations per minute
    ("/api/v1/scan", 20, 60),            # Max 20 container scans per minute
    ("/api/v1", 180, 60),                # General API limit: 180 req / min
]


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Injects industry-standard HTTP security headers and prevents fingerprinting."""

    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)

        # 1. Protect against MIME type confusion attacks
        response.headers["X-Content-Type-Options"] = "nosniff"

        # 2. Clickjacking protection
        response.headers["X-Frame-Options"] = "DENY"

        # 3. Reflected XSS auditor
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # 4. Enforce strict HTTPS in modern browsers
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"

        # 5. Referrer leak protection
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # 6. Restrict browser device features
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"

        # 7. Content Security Policy for API
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"

        # 8. Mask server fingerprint
        if "server" in response.headers:
            del response.headers["server"]
        if "x-powered-by" in response.headers:
            del response.headers["x-powered-by"]

        return response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """Enforces sliding-window rate limiting per client IP."""

    async def dispatch(self, request: Request, call_next) -> Response:
        # Bypass CORS preflight OPTIONS requests
        if request.method == "OPTIONS":
            return await call_next(request)

        # Determine client IP (support X-Forwarded-For if behind trusted reverse proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "127.0.0.1"

        now = time.time()
        path = request.url.path

        with _rate_lock:
            # Check route-specific limits
            for prefix, limit, window in RATE_LIMIT_RULES:
                if path.startswith(prefix):
                    key = (client_ip, prefix)
                    history = _endpoint_history.get(key, [])
                    # Prune entries older than window
                    history = [t for t in history if now - t < window]

                    if len(history) >= limit:
                        retry_after = int(window - (now - history[0])) if history else window
                        return JSONResponse(
                            status_code=429,
                            content={
                                "status": "error",
                                "code": 429,
                                "message": f"Rate limit exceeded for '{prefix}'. Maximum {limit} requests per {window}s.",
                                "retry_after_seconds": max(1, retry_after)
                            },
                            headers={"Retry-After": str(max(1, retry_after))}
                        )

                    history.append(now)
                    _endpoint_history[key] = history
                    break

        return await call_next(request)
