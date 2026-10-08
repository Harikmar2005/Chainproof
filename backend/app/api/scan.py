from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from app.services.scan_orchestrator import perform_scan
from app.api.reports import save_report, make_json_safe
from app.ai.analyst import analyze_scan


router = APIRouter(tags=["Scan"])


class ScanRequest(BaseModel):
    image: str


@router.post("/scan")
def run_scan(request: ScanRequest):

    image = request.image.strip()

    if not image:

        raise HTTPException(
            status_code=400,
            detail="Container image name is required"
        )

    try:

        # Run complete ChainProof scan
        result = perform_scan(image)

        # Convert Docker / ML / NumPy values
        # to standard Python JSON values.
        result = make_json_safe(result)

        # Save scan history
        save_report(result)

        return result

    except Exception as e:

        print(
            f"SCAN ERROR: {type(e).__name__}: {e}"
        )

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
