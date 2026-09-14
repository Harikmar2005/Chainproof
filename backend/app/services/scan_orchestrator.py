import uuid

from app.services.docker_service import ensure_image
from app.services.sbom_service import generate_sbom
from app.services.vulnerability_service import scan_vulnerabilities
from app.services.signature_service import verify_signature

from app.ml.feature_extractor import extract_features
from app.ml.risk_model import RiskModel
from app.ml.anomaly_model import AnomalyModel

from app.risk.risk_engine import calculate_risk


risk_model = RiskModel()
anomaly_model = AnomalyModel()


def perform_scan(image: str):

    scan_id = str(
        uuid.uuid4()
    )

    # ------------------------------------------------
    # 1. Docker metadata
    # ------------------------------------------------

    docker_data = ensure_image(
        image
    )

    # ------------------------------------------------
    # 2. SBOM
    # ------------------------------------------------

    sbom_data = generate_sbom(
        image
    )

    # ------------------------------------------------
    # 3. Vulnerabilities
    # ------------------------------------------------

    vulnerability_data = scan_vulnerabilities(
        image
    )

    # ------------------------------------------------
    # 4. Signature
    # ------------------------------------------------

    signature_data = verify_signature(
        image
    )

    # ------------------------------------------------
    # 5. ML feature extraction
    # ------------------------------------------------

    features = extract_features(

        docker_data,

        sbom_data,

        vulnerability_data,

        signature_data
    )

    # ------------------------------------------------
    # 6. Random Forest
    # ------------------------------------------------

    ml_result = risk_model.predict(
        features
    )

    # ------------------------------------------------
    # 7. Anomaly detection
    # ------------------------------------------------

    anomaly_result = anomaly_model.predict(
        features
    )

    # ------------------------------------------------
    # 8. Final risk
    # ------------------------------------------------

    risk_result = calculate_risk(

        vulnerability_data,

        signature_data,

        ml_result,

        anomaly_result
    )

    # ------------------------------------------------
    # 9. Findings
    # ------------------------------------------------

    findings = []

    critical = vulnerability_data.get(
        "critical",
        0
    )

    high = vulnerability_data.get(
        "high",
        0
    )

    medium = vulnerability_data.get(
        "medium",
        0
    )

    if critical > 0:

        findings.append({
            "type": "VULNERABILITY",
            "severity": "CRITICAL",
            "message": (
                f"{critical} critical "
                "vulnerabilities detected"
            )
        })

    if high > 0:

        findings.append({
            "type": "VULNERABILITY",
            "severity": "HIGH",
            "message": (
                f"{high} high "
                "vulnerabilities detected"
            )
        })

    if medium > 0:

        findings.append({
            "type": "VULNERABILITY",
            "severity": "MEDIUM",
            "message": (
                f"{medium} medium "
                "vulnerabilities detected"
            )
        })

    if not signature_data.get(
        "verified",
        False
    ):

        findings.append({
            "type": "INTEGRITY",
            "severity": "MEDIUM",
            "message": (
                "Container image signature "
                "could not be verified"
            )
        })

    if anomaly_result.get(
        "anomaly",
        False
    ):

        findings.append({
            "type": "ANOMALY",
            "severity": "MEDIUM",
            "message": (
                "ML anomaly detector found "
                "an unusual security profile"
            )
        })

    return {

        "scan_id": scan_id,

        "image": image,

        "risk_score": risk_result[
            "risk_score"
        ],

        "severity": risk_result[
            "severity"
        ],

        "verdict": risk_result[
            "verdict"
        ],

         "risk": risk_result,


        "docker": docker_data,

        "sbom": {
            "status": sbom_data.get(
                "status"
            ),
            "package_count": sbom_data.get(
                "package_count",
                0
            ),
            "packages": sbom_data.get(
                "packages",
                []
            )

        },

        "vulnerabilities": vulnerability_data,

        "signature": signature_data,

        "ml": {

            "features": features,

            "random_forest": ml_result,

            "anomaly_detection": anomaly_result,

            "final_ml_score": risk_result[
                "ml_score"
            ],

            "ml_confidence": risk_result[
                "ml_confidence"
            ]
        },

        "findings": findings
    }