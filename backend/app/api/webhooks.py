"""
Webhooks API router for Container Registries and CI/CD Pipeline Gates.
Secured with Webhook Secret verification, API Key validation, and image input sanitization.
"""

import os
import secrets
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Request, Depends, Header

from app.automation.engine import automation_engine
from app.services.docker_service import validate_image_name
from app.services.sanitizer import sanitize_raw_string
from app.storage.db import verify_api_key

logger = logging.getLogger("chainproof.webhooks")
router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def verify_webhook_auth(
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    token: Optional[str] = None
):
    """
    Authenticate webhook caller:
    - Verifies WEBHOOK_SECRET via constant-time comparison if configured
    - Or validates X-API-Key against registered API keys
    - In production, rejects unauthenticated webhook requests
    """
    expected_secret = os.getenv("WEBHOOK_SECRET", "").strip()
    if expected_secret:
        received = x_webhook_secret or token or x_api_key
        if not received or not secrets.compare_digest(received.strip(), expected_secret):
            raise HTTPException(status_code=401, detail="Invalid webhook authentication secret.")
        return {"auth": "webhook_secret"}

    if x_api_key:
        api_record = verify_api_key(x_api_key)
        if not api_record:
            raise HTTPException(status_code=401, detail="Invalid API Key.")
        return {"auth": "api_key", "name": api_record.get("name")}

    is_prod = os.getenv("ENVIRONMENT", "").lower() == "production"
    if is_prod:
        raise HTTPException(
            status_code=401,
            detail="Webhook authentication required in production environment. Provide X-Webhook-Secret or X-API-Key."
        )

    return {"auth": "dev_bypass"}


@router.post("/registry")
async def registry_webhook(
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    request: Request,
    auth: dict = Depends(verify_webhook_auth)
):
    """
    Handle container registry push events (Docker Hub, GHCR, Harbor, Quay, AWS ECR).
    Extracts image name and tag, validates format, then executes matching NEW_IMAGE_VERSION automation rules.
    """
    image_target = None
    
    # Docker Hub webhook format: { "repository": { "repo_name": "user/repo" }, "push_data": { "tag": "latest" } }
    if "repository" in payload and "push_data" in payload:
        repo = payload["repository"].get("repo_name", "")
        tag = payload["push_data"].get("tag", "latest")
        image_target = f"{repo}:{tag}"
    # GHCR / GitHub Packages / Generic format: { "image": "ghcr.io/org/repo:tag" } or { "target": "..." }
    elif "image" in payload:
        image_target = str(payload["image"])
    elif "target" in payload:
        image_target = str(payload["target"])
    elif "event_data" in payload and "repository" in payload.get("event_data", {}): # Harbor format
        repo = payload["event_data"]["repository"].get("repo_full_name", "")
        tag = payload["event_data"].get("resources", [{}])[0].get("tag", "latest")
        image_target = f"{repo}:{tag}"

    if not image_target:
        logger.warning("Unrecognized registry webhook payload structure: %s", payload)
        raise HTTPException(
            status_code=400, 
            detail="Could not resolve image target from webhook payload. Provide 'image' or standard DockerHub/Harbor payload."
        )

    # Validate image name strictly against shell injection
    try:
        clean_target = validate_image_name(image_target.strip())
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid container image target in webhook: {str(ve)}")

    logger.info("Received authenticated registry push webhook for image: %s", clean_target)
    
    # Trigger automation rules asynchronously
    background_tasks.add_task(
        automation_engine.trigger_automations,
        trigger_type="NEW_IMAGE_VERSION",
        target_override=clean_target,
        context={"source": "registry_webhook"}
    )

    return {
        "status": "accepted",
        "message": f"Registry push event queued for audit on target '{clean_target}'",
        "target": clean_target
    }


@router.post("/cicd")
async def cicd_webhook(
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks,
    auth: dict = Depends(verify_webhook_auth)
):
    """
    Handle CI/CD pipeline triggers (GitHub Actions, GitLab CI, Jenkins).
    Executes CI/CD automation rules and evaluates gate criteria.
    """
    raw_target = payload.get("target") or payload.get("image")
    if not raw_target:
        raise HTTPException(status_code=400, detail="Missing 'target' or 'image' field in CI/CD webhook payload.")

    try:
        clean_target = validate_image_name(str(raw_target).strip())
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Invalid container image target: {str(ve)}")

    clean_pipeline_id = sanitize_raw_string(str(payload.get("pipeline_id", "")), max_length=100)
    sync_mode = bool(payload.get("sync", False))
    
    if sync_mode:
        # Run synchronously for CI/CD pipeline blocking gates
        job_results = await automation_engine.trigger_automations(
            trigger_type="CI/CD",
            target_override=clean_target,
            context={"source": "cicd_webhook", "pipeline_id": clean_pipeline_id}
        )
        
        # Check if any job resulted in a BLOCK action
        blocked = False
        reasons = []
        for j in job_results:
            decision = j.get("results", {}).get("risk_decision", {})
            if decision.get("risk_level") == "CRITICAL" or decision.get("action") == "BLOCK / ALERT":
                blocked = True
                reasons.append(f"CRITICAL risk detected in {j.get('target')}")

        return {
            "status": "completed",
            "blocked": blocked,
            "reasons": reasons,
            "jobs": job_results
        }
    else:
        # Async mode
        background_tasks.add_task(
            automation_engine.trigger_automations,
            trigger_type="CI/CD",
            target_override=clean_target,
            context={"source": "cicd_webhook", "pipeline_id": clean_pipeline_id}
        )
        return {
            "status": "accepted",
            "message": f"CI/CD security scan queued for '{clean_target}'",
            "target": clean_target
        }
