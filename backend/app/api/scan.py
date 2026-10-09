from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Dict, Any

from app.services.scan_orchestrator import perform_scan
from app.services.docker_service import validate_image_name
from app.api.reports import save_report, make_json_safe
from app.api.auth import require_analyst_or_admin
from app.ai.analyst import analyze_scan


router = APIRouter(tags=["Scan"])


class ScanRequest(BaseModel):
    image: str = Field(..., max_length=255, example="alpine:latest")


@router.post("/scan")
def run_scan(request: ScanRequest, user: Dict[str, Any] = Depends(require_analyst_or_admin)):
    """Run container security scan (Analyst & Admin)."""
    raw_image = request.image.strip()

    if not raw_image:
        raise HTTPException(
            status_code=400,
            detail="Container image name is required"
        )

    try:
        # Strict OCI regex validation defense against shell injection
        image = validate_image_name(raw_image)
    except ValueError as ve:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid container image name: {str(ve)}"
        )

    try:
        # Run complete ChainProof scan
        result = perform_scan(image)

        # Convert Docker / ML / NumPy values to standard Python JSON values
        result = make_json_safe(result)

        # Save scan history
        save_report(result)

        return result

    except Exception as e:
        print(f"SCAN ERROR: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Scan failed: {str(e)}"
        )


@router.post("/analyze")
@router.post("/ai/analyze")
def run_ai_analysis(scan_data: Dict[str, Any]):
    """
    On-demand AI Security Analyst endpoint to re-correlate evidence
    and update actionable security decision for an existing scan result.
    """
    if not scan_data:
        raise HTTPException(
            status_code=400,
            detail="Scan payload is required for AI security analysis"
        )

    try:
        analysis = analyze_scan(scan_data)
        return make_json_safe(analysis)
    except Exception as e:
        print(f"AI ANALYSIS ERROR: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"AI security analysis failed: {str(e)}"
        )
