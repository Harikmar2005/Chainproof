"""Health and Diagnostic API for ChainProof Enterprise Platform."""
import os
from fastapi import APIRouter
from app.services.docker_service import check_docker_health
from app.services.sbom_service import check_syft_health
from app.services.vulnerability_service import check_scout_health
from app.services.signature_service import check_cosign_health
from app.ml.risk_model import RiskModel
from app.ml.anomaly_model import AnomalyModel

router = APIRouter(tags=["Health"])

_rf = RiskModel()
_iso = AnomalyModel()


@router.get("/health")
def health_check():
    docker_status = check_docker_health()
    syft_status = check_syft_health()
    scout_status = check_scout_health()
    cosign_status = check_cosign_health()

    is_scanner_ready = (
        docker_status.get("connected", False)
        and syft_status.get("available", False)
    )

    # Mask absolute filesystem paths to prevent host environment information leakage
    clean_syft = {k: (os.path.basename(v) if k == "binary" and isinstance(v, str) else v) for k, v in syft_status.items()}
    clean_cosign = {k: (os.path.basename(v) if k == "binary" and isinstance(v, str) else v) for k, v in cosign_status.items()}

    return {
        "status": "healthy" if is_scanner_ready else "degraded",
        "service": "ChainProof Cloud Security API",
        "version": "2.0.0",
        "environment": os.getenv("ENVIRONMENT", "production"),
        "components": {
            "docker_engine": docker_status,
            "syft_sbom": clean_syft,
            "docker_scout": scout_status,
            "cosign_signature": clean_cosign,
            "ml_risk_model": {
                "loaded": _rf.model is not None,
                "type": "RandomForestClassifier"
            },
            "ml_anomaly_model": {
                "loaded": _iso.model is not None,
                "type": "IsolationForest"
            },
            "ai_analyst_provider": os.getenv("AI_ANALYST_PROVIDER", "deterministic")
        }
    }