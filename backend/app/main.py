import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.reports import router as reports_router
from app.api.scan import router as scan_router
from app.api.automations import router as automations_router
from app.api.jobs import router as jobs_router
from app.api.notifications import router as notifications_router
from app.api.webhooks import router as webhooks_router
from app.api.monitored_images import router as monitored_images_router
from app.api.agent import router as agent_router
from app.api.auth import router as auth_router
from app.automation.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("chainproof.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to handle startup and shutdown events."""
    logger.info("Starting ChainProof Cloud Security Engine & Automation Scheduler...")
    await start_scheduler()
    yield
    logger.info("Shutting down ChainProof Cloud Security Engine...")
    await stop_scheduler()


from app.middleware.security import SecurityHeadersMiddleware, RateLimiterMiddleware

is_prod = os.getenv("ENVIRONMENT", "").lower() == "production"
enable_docs = os.getenv("ENABLE_DOCS", "").lower() == "true" or not is_prod

app = FastAPI(
    title="ChainProof Enterprise Supply-Chain Security Platform",
    version="2.0.0",
    description="Cross-platform automated container vulnerability, SBOM, Cosign, and AI risk analysis engine.",
    debug=not is_prod,
    docs_url="/docs" if enable_docs else None,
    redoc_url="/redoc" if enable_docs else None,
    openapi_url="/openapi.json" if enable_docs else None,
    lifespan=lifespan
)

# Parse CORS Origins from environment or use explicit secure defaults
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:1420",  # Tauri dev
    "https://chainproof-theta.vercel.app",
    "https://chainproof.vercel.app",
    "tauri://localhost",
]

env_origins = os.getenv("CORS_ORIGINS", "")
if env_origins.strip():
    custom_origins = [orig.strip() for orig in env_origins.split(",") if orig.strip()]
    allowed_origins = list(dict.fromkeys(DEFAULT_ORIGINS + custom_origins))
else:
    allowed_origins = DEFAULT_ORIGINS

cors_regex = os.getenv("CORS_ORIGIN_REGEX", None if is_prod else r"https://.*\.vercel\.app")

# 1. Enforce Enterprise Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. Enforce Sliding-Window Rate Limiting Middleware
app.add_middleware(RateLimiterMiddleware)

# 3. Configure Strict CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=cors_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(health_router, prefix="/api/v1")
app.include_router(scan_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(automations_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(webhooks_router, prefix="/api/v1")
app.include_router(monitored_images_router, prefix="/api/v1")
app.include_router(agent_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")

