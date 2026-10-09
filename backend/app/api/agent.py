"""Desktop Local Scanner Agent API Router."""
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, Field

from app.api.reports import save_report, make_json_safe
from app.storage.db import (
    record_findings,
    update_monitored_image,
    verify_api_key,
    get_all_monitored_images,
    get_all_automations
)
from app.notifications.dispatcher import dispatch_notification

logger = logging.getLogger("chainproof.agent")
router = APIRouter(prefix="/agent", tags=["Desktop Agent"])


class AgentSyncPayload(BaseModel):
    agent_id: str = Field(..., example="desktop-agent-win-01")
    agent_version: str = Field("2.0.0", example="2.0.0")
    scans: List[Dict[str, Any]] = Field(..., description="List of local offline scan results to sync")


def verify_agent_auth(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """Authenticate Desktop Agent via API Key. Strictly required in production."""
    if x_api_key:
        valid = verify_api_key(x_api_key)
        if not valid:
            raise HTTPException(status_code=401, detail="Invalid Agent API Key.")
        return valid

    import os
    is_prod = os.getenv("ENVIRONMENT", "").lower() == "production"
    if is_prod:
        raise HTTPException(status_code=401, detail="Agent API Key required in production environment.")
    return {"role": "AGENT_LOCAL"}


@router.post("/sync")
def sync_agent_scans(payload: AgentSyncPayload, auth: dict = Depends(verify_agent_auth)):
    """
    Receives scan results conducted by the Desktop Local Scanner Agent
    (e.g., when scanning local Docker images offline or locally) and synchronizes them into Cloud.
    """
    from app.services.sanitizer import sanitize_raw_string, sanitize_dict
    clean_agent_id = sanitize_raw_string(payload.agent_id, max_length=60)
    synced_count = 0
    errors = []

    for item in payload.scans:
        try:
            safe_item = make_json_safe(item)
            image = safe_item.get("image", "unknown")
            scan_id = safe_item.get("scan_id", "")

            # 1. Persist to cloud reports ledger
            save_report(safe_item)

            # 2. Record findings
            if safe_item.get("findings"):
                record_findings(scan_id, image, safe_item.get("findings"))

            # 3. Update monitored images table if applicable
            risk_score = safe_item.get("risk_score", 0)
            severity = (safe_item.get("severity") or "LOW").upper()
            decision = (safe_item.get("ai_analysis", {}).get("security_decision") or "REVIEW").upper()
            
            update_monitored_image(image, {
                "last_scanned": safe_item.get("timestamp"),
                "risk_score": risk_score,
                "severity": severity,
                "decision": decision,
                "total_cves": safe_item.get("vulnerabilities", {}).get("total", 0)
            })

            # 4. Notify if high risk
            if severity in ("CRITICAL", "HIGH"):
                dispatch_notification(
                    title=f"⚠️ Agent Synced Alert: {image}",
                    message=f"Desktop agent '{payload.agent_id}' uploaded scan with {severity} risk ({risk_score}/100).",
                    severity=severity,
                    payload={"image": image, "agent": payload.agent_id, "scan_id": scan_id}
                )

            synced_count += 1
        except Exception as e:
            logger.error(f"Failed to sync scan item: {e}")
            errors.append(str(e))

    return {
        "status": "success",
        "synced": synced_count,
        "failed": len(errors),
        "errors": errors
    }


@router.get("/config")
def get_agent_config(auth: dict = Depends(verify_agent_auth)):
    """Returns cloud configurations, monitored targets, and active schedules to local agent."""
    return {
        "monitored_images": get_all_monitored_images(),
        "automations": [a for a in get_all_automations() if a.get("enabled", True)],
        "sync_interval_seconds": 300,
        "policy": {
            "critical_threshold": 75,
            "block_on_critical": True
        }
    }
