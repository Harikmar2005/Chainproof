"""
API Router for ChainProof Automations
Secured with Role-Based Access Control:
- ADMIN: Create, Update, Delete, Run automations
- ANALYST / ADMIN: View automations
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app.api.auth import require_admin, require_analyst_or_admin
from app.services.sanitizer import sanitize_raw_string, sanitize_text
from app.storage.db import (
    get_all_automations,
    save_automation,
    delete_automation,
    get_automation_by_id
)
from app.automation.engine import execute_automation

router = APIRouter(prefix="/automations", tags=["Automations"])


class AutomationCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=120, example="Nightly Production Scan")
    trigger: str = Field("SCHEDULE", max_length=30, example="SCHEDULE")  # SCHEDULE, NEW_IMAGE_VERSION, MANUAL, WEBHOOK, CICD
    schedule: Optional[str] = Field("02:00", max_length=30, example="02:00")
    target: Optional[str] = Field(None, max_length=255, example="alpine:latest")
    targets: Optional[List[str]] = Field(default_factory=list, example=["alpine:latest", "nginx:alpine"])
    action: str = Field("SCAN_IMAGE", max_length=40, example="SCAN_IMAGE")
    enabled: bool = Field(True, example=True)
    tags: Optional[List[str]] = Field(default_factory=list, example=["production", "nightly"])


class AutomationUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, max_length=120)
    trigger: Optional[str] = Field(None, max_length=30)
    schedule: Optional[str] = Field(None, max_length=30)
    target: Optional[str] = Field(None, max_length=255)
    targets: Optional[List[str]] = None
    action: Optional[str] = Field(None, max_length=40)
    enabled: Optional[bool] = None
    tags: Optional[List[str]] = None


@router.get("")
def list_automations(user: Dict[str, Any] = Depends(require_analyst_or_admin)):
    """Retrieve all configured automation rules (Analyst & Admin)."""
    return get_all_automations()


@router.post("")
def create_new_automation(req: AutomationCreateRequest, admin: Dict[str, Any] = Depends(require_admin)):
    """Create a new security automation rule (Admin only)."""
    clean_name = sanitize_raw_string(req.name.strip(), max_length=120)
    clean_trigger = sanitize_raw_string(req.trigger.strip().upper(), max_length=30)
    clean_action = sanitize_raw_string(req.action.strip().upper(), max_length=40)
    clean_schedule = sanitize_raw_string(req.schedule.strip(), max_length=30) if req.schedule else "02:00"

    raw_targets = req.targets if req.targets else ([req.target] if req.target else [])
    clean_targets = [sanitize_raw_string(t.strip(), max_length=255) for t in raw_targets if t.strip()]

    clean_tags = [sanitize_raw_string(t.strip(), max_length=50) for t in req.tags if t.strip()] if req.tags else []

    payload = {
        "name": clean_name,
        "trigger": clean_trigger,
        "schedule": clean_schedule,
        "targets": clean_targets,
        "target": clean_targets[0] if clean_targets else None,
        "action": clean_action,
        "enabled": req.enabled,
        "tags": clean_tags
    }
    created = save_automation(payload)
    return created


@router.get("/{automation_id}")
def get_automation(automation_id: str, user: Dict[str, Any] = Depends(require_analyst_or_admin)):
    """Retrieve a specific automation rule (Analyst & Admin)."""
    clean_id = sanitize_raw_string(automation_id, max_length=50)
    item = get_automation_by_id(clean_id)
    if not item:
        raise HTTPException(status_code=404, detail="Automation not found")
    return item


@router.put("/{automation_id}")
def update_existing_automation(automation_id: str, req: AutomationUpdateRequest, admin: Dict[str, Any] = Depends(require_admin)):
    """Update an existing automation rule (Admin only)."""
    clean_id = sanitize_raw_string(automation_id, max_length=50)
    item = get_automation_by_id(clean_id)
    if not item:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    updates: Dict[str, Any] = {"id": clean_id}
    if req.name is not None:
        updates["name"] = sanitize_raw_string(req.name.strip(), max_length=120)
    if req.trigger is not None:
        updates["trigger"] = sanitize_raw_string(req.trigger.strip().upper(), max_length=30)
    if req.schedule is not None:
        updates["schedule"] = sanitize_raw_string(req.schedule.strip(), max_length=30)
    if req.action is not None:
        updates["action"] = sanitize_raw_string(req.action.strip().upper(), max_length=40)
    if req.enabled is not None:
        updates["enabled"] = bool(req.enabled)
    if req.targets is not None:
        updates["targets"] = [sanitize_raw_string(t.strip(), max_length=255) for t in req.targets if t.strip()]
    if req.tags is not None:
        updates["tags"] = [sanitize_raw_string(t.strip(), max_length=50) for t in req.tags if t.strip()]

    updated = save_automation(updates)
    return updated


@router.delete("/{automation_id}")
def remove_automation(automation_id: str, admin: Dict[str, Any] = Depends(require_admin)):
    """Delete an automation rule (Admin only)."""
    clean_id = sanitize_raw_string(automation_id, max_length=50)
    success = delete_automation(clean_id)
    if not success:
        raise HTTPException(status_code=404, detail="Automation not found")
    return {"status": "success", "message": f"Automation {clean_id} deleted."}


@router.post("/{automation_id}/run")
def trigger_automation_run(automation_id: str, admin: Dict[str, Any] = Depends(require_admin)):
    """Trigger an on-demand execution of an automation rule (Admin only)."""
    clean_id = sanitize_raw_string(automation_id, max_length=50)
    item = get_automation_by_id(clean_id)
    if not item:
        raise HTTPException(status_code=404, detail="Automation not found")
    
    results = execute_automation(clean_id, trigger_type="MANUAL")
    return {
        "status": "success",
        "automation_id": clean_id,
        "jobs_triggered": len(results),
        "jobs": results
    }
