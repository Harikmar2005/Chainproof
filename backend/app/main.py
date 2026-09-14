from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.health import router as health_router
from app.api.reports import router as reports_router
from app.api.scan import router as scan_router

app = FastAPI(title="ChainProof")

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api/v1")
app.include_router(scan_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
