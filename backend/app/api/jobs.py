"""
Job tracking API router for ChainProof.
Protected with Role-Based Access Control: Analyst & Admin access.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional, Dict, Any

from app.api.auth import require_analyst_or_admin
from app.services.sanitizer import sanitize_raw_string
from app.storage.db import get_all_jobs, get_job_by_id

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[dict])
def list_jobs(
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = Query(None),
    trigger: Optional[str] = Query(None),
    user: Dict[str, Any] = Depends(require_analyst_or_admin)
):
    """List recent scan and automation job execution logs (Analyst & Admin)."""
    all_jobs = get_all_jobs(limit=limit)
    if status:
        clean_status = sanitize_raw_string(status.upper(), max_length=20)
        all_jobs = [j for j in all_jobs if j.get("status") == clean_status]
    if trigger:
        clean_trigger = sanitize_raw_string(trigger.upper(), max_length=30)
        all_jobs = [j for j in all_jobs if j.get("trigger") == clean_trigger]
    return all_jobs


@router.get("/{job_id}", response_model=dict)
def get_job(job_id: str, user: Dict[str, Any] = Depends(require_analyst_or_admin)):
    """Retrieve details and execution results of a specific job (Analyst & Admin)."""
    clean_id = sanitize_raw_string(job_id, max_length=50)
    job = get_job_by_id(clean_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
