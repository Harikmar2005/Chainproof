"""
Notification API router for ChainProof.
Protected with Role-Based Access Control:
- ADMIN: Broadcast test alerts, view registered devices
- ANALYST / ADMIN: View notification history
- CLIENT: Register device token for alerts
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

from app.api.auth import require_admin, require_analyst_or_admin
from app.services.sanitizer import sanitize_raw_string, sanitize_text
from app.storage.db import get_all_notifications, register_device as db_register_device, get_all_devices
from app.notifications.dispatcher import dispatch_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


class DeviceRegisterRequest(BaseModel):
    device_name: str = Field("Unknown Device", max_length=100, description="Friendly device name")
    platform: str = Field(..., max_length=30, description="DESKTOP, ANDROID, IOS, or WEB")
    token: str = Field(..., max_length=255, description="Unique push token or device identifier")


class SendNotificationRequest(BaseModel):
    title: str = Field(..., max_length=150)
    message: str = Field(..., max_length=500)
    severity: str = Field("INFO", max_length=20)
    channels: Optional[List[str]] = None


@router.get("", response_model=List[dict])
def list_notifications(
    limit: int = Query(50, ge=1, le=200),
    user: Dict[str, Any] = Depends(require_analyst_or_admin)
):
    """List recent dispatched security notifications (Analyst & Admin)."""
    return get_all_notifications(limit=limit)


@router.post("/devices")
def register_device(device: DeviceRegisterRequest):
    """Register a mobile or desktop client device for push alerts."""
    clean_name = sanitize_raw_string(device.device_name, max_length=100)
    clean_platform = sanitize_raw_string(device.platform.upper(), max_length=30)
    clean_token = sanitize_raw_string(device.token.strip(), max_length=255)

    registered = db_register_device(
        device_name=clean_name,
        platform=clean_platform,
        token=clean_token
    )
    return {
        "status": "success",
        "message": f"Device registered successfully for platform '{clean_platform}'",
        "device": registered
    }


@router.get("/devices")
def list_devices(admin: Dict[str, Any] = Depends(require_admin)):
    """List registered devices for push notifications (Admin only)."""
    return get_all_devices()


@router.post("/test")
def send_test_notification(req: SendNotificationRequest, admin: Dict[str, Any] = Depends(require_admin)):
    """Send an immediate test security notification across configured channels (Admin only)."""
    clean_title = sanitize_raw_string(req.title, max_length=150)
    clean_msg = sanitize_text(req.message, max_length=500)
    clean_sev = sanitize_raw_string(req.severity.upper(), max_length=20)

    res = dispatch_notification(
        title=clean_title,
        message=clean_msg,
        severity=clean_sev,
        channels=req.channels,
        payload={"type": "test_broadcast"}
    )
    return {
        "status": "success",
        "message": f"Notification '{clean_title}' dispatched.",
        "result": res
    }
