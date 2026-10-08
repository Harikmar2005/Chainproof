import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.reports import router as reports_router
from app.api.scan import router as scan_router

app = FastAPI(title="ChainProof")

# Parse CORS Origins from environment or use explicit secure defaults
DEFAULT_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://chainproof-theta.vercel.app",
    "https://chainproof.vercel.app",
]

env_origins = os.getenv("CORS_ORIGINS", "")
if env_origins.strip():
    custom_origins = [orig.strip() for orig in env_origins.split(",") if orig.strip()]
    allowed_origins = list(dict.fromkeys(DEFAULT_ORIGINS + custom_origins))
else:
    allowed_origins = DEFAULT_ORIGINS

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(scan_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")

