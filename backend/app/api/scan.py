from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.scan_orchestrator import perform_scan
from app.api.reports import save_report, make_json_safe


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