"""
Monitored Images API Router for Registry and Local Container Monitoring.
Protected with Role-Based Access Control:
- ADMIN: Add, Remove, and Trigger Scans on Monitored Images
- ANALYST / ADMIN: View Monitored Images and Local Discovered Images
"""

import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.api.auth import require_admin, require_analyst_or_admin
from app.services.sanitizer import sanitize_raw_string
from app.storage.db import (
    get_all_monitored_images,
    add_monitored_image,
    delete_monitored_image
)
from app.services.docker_service import list_local_images, validate_image_name
from app.automation.engine import automation_engine

logger = logging.getLogger("chainproof.monitored")
router = APIRouter(prefix="/monitored-images", tags=["Monitored Images"])


class MonitoredImageCreate(BaseModel):
    image: str = Field(..., max_length=255, example="alpine:latest")
    tags: Optional[List[str]] = Field(default_factory=lambda: ["latest"])
    auto_scan: bool = Field(True, example=True)
    schedule: Optional[str] = Field("02:00", max_length=30, example="02:00")


@router.get("")
def list_monitored(user: Dict[str, Any] = Depends(require_analyst_or_admin)):
    """List all registered monitored container images (Analyst & Admin)."""
    return get_all_monitored_images()


@router.post("")
def monitor_image(req: MonitoredImageCreate, admin: Dict[str, Any] = Depends(require_admin)):
    """Add a new container image to the automated monitoring watch list (Admin only)."""
    try:
        clean_name = validate_image_name(req.image.strip())
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    clean_tags = [sanitize_raw_string(t.strip(), max_length=100) for t in req.tags if t.strip()] if req.tags else ["latest"]
    clean_schedule = sanitize_raw_string(req.schedule.strip(), max_length=30) if req.schedule else "02:00"

    created = add_monitored_image(
        image=clean_name,
        tags=clean_tags,
        auto_scan=req.auto_scan,
        schedule=clean_schedule
    )
    return created


@router.delete("/{image_id}")
def remove_monitored(image_id: str, admin: Dict[str, Any] = Depends(require_admin)):
    """Remove an image from the monitoring list (Admin only)."""
    clean_id = sanitize_raw_string(image_id, max_length=60)
    success = delete_monitored_image(clean_id)
    if not success:
        raise HTTPException(status_code=404, detail="Monitored image not found.")
    return {"status": "success", "message": f"Image {clean_id} removed from monitoring."}


@router.post("/{image_id}/scan")
def scan_monitored(image_id: str, admin: Dict[str, Any] = Depends(require_admin)):
    """Trigger an immediate scan for a monitored image (Admin only)."""
    clean_id = sanitize_raw_string(image_id, max_length=60)
    images = get_all_monitored_images()
    target = None
    for it in images:
        if it.get("id") == clean_id or it.get("image") == clean_id:
            target = it.get("image")
            break
    if not target:
        raise HTTPException(status_code=404, detail="Monitored image not found.")

    results = automation_engine.execute_rule(
        automation_id=None,
        trigger_type="MANUAL",
        target_override=target
    )
    return {
        "status": "success",
        "target": target,
        "job": results[0] if results else None
    }


@router.get("/local/discovered")
def discover_local_images(user: Dict[str, Any] = Depends(require_analyst_or_admin)):
    """
    Query the host Docker daemon for locally cached images (Analyst & Admin).
    Used by Desktop Application to populate available images for 1-click monitoring.
    """
    local = list_local_images()
    monitored = {m.get("image"): m for m in get_all_monitored_images()}
    
    enriched = []
    for img in local:
        tags = img.get("tags", [])
        for tag in tags:
            enriched.append({
                "id": img.get("id"),
                "image": tag,
                "size_bytes": img.get("size_bytes"),
                "is_monitored": tag in monitored,
                "monitored_id": monitored[tag].get("id") if tag in monitored else None,
                "auto_scan": monitored[tag].get("auto_scan", False) if tag in monitored else False
            })
    return enriched
