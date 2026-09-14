def label_to_score(label: str) -> float:
    """
    Convert Random Forest prediction
    into a base risk score.
    """

    mapping = {
        "LOW": 15,
        "MEDIUM": 45,
        "HIGH": 72,
        "CRITICAL": 92
    }

    if not isinstance(label, str):
        return 50

    return mapping.get(
        label.upper(),
        50
    )


def calculate_risk(
    vulnerability_data: dict,
    signature_data: dict,
    ml_result: dict,
    anomaly_result: dict
):
    """
    Calculate the final ChainProof risk score
    using ML prediction, vulnerabilities,
    signature integrity and anomaly detection.
    """

    # ----------------------------------------
    # Random Forest
    # ----------------------------------------

    prediction = str(
        ml_result.get(
            "prediction",
            "UNKNOWN"
        )
    ).upper()

    confidence = float(
        ml_result.get(
            "confidence",
            0.0
        )
    )

    model_loaded = bool(
        ml_result.get(
            "model_loaded",
            False
        )
    )

    ml_score = label_to_score(
        prediction
    )

    score = float(
        ml_score
    )

    # ----------------------------------------
    # Score breakdown
    # ----------------------------------------

    breakdown = {
        "ml_base_score": ml_score,
        "critical_cve_penalty": 0,
        "high_cve_penalty": 0,
        "medium_cve_penalty": 0,
        "low_cve_penalty": 0,
        "signature_penalty": 0,
        "anomaly_penalty": 0
    }

    # ----------------------------------------
    # Vulnerabilities
    # ----------------------------------------

    critical = int(
        vulnerability_data.get(
            "critical",
            0
        )
    )

    high = int(
        vulnerability_data.get(
            "high",
            0
        )
    )

    medium = int(
        vulnerability_data.get(
            "medium",
            0
        )
    )

    low = int(
        vulnerability_data.get(
            "low",
            0
        )
    )

    critical_penalty = min(
        critical * 3,
        12
    )

    high_penalty = min(
        high * 1.5,
        8
    )

    medium_penalty = min(
        medium * 0.5,
        4
    )

    low_penalty = min(
        low * 0.1,
        2
    )

    score += critical_penalty
    score += high_penalty
    score += medium_penalty
    score += low_penalty

    breakdown[
        "critical_cve_penalty"
    ] = critical_penalty

    breakdown[
        "high_cve_penalty"
    ] = high_penalty

    breakdown[
        "medium_cve_penalty"
    ] = medium_penalty

    breakdown[
        "low_cve_penalty"
    ] = low_penalty

    # ----------------------------------------
    # Signature integrity
    # ----------------------------------------

    signature_verified = bool(
        signature_data.get(
            "verified",
            False
        )
    )

    if not signature_verified:

        signature_penalty = 8

        score += signature_penalty

        breakdown[
            "signature_penalty"
        ] = signature_penalty

    # ----------------------------------------
    # Isolation Forest anomaly
    # ----------------------------------------

    anomaly = bool(
        anomaly_result.get(
            "anomaly",
            False
        )
    )

    anomaly_model_loaded = bool(
        anomaly_result.get(
            "model_loaded",
            False
        )
    )

    if anomaly:

        anomaly_penalty = 7

        score += anomaly_penalty

        breakdown[
            "anomaly_penalty"
        ] = anomaly_penalty

    # ----------------------------------------
    # Final score
    # ----------------------------------------

    score = round(
        max(
            0,
            min(
                score,
                100
            )
        )
    )

    # ----------------------------------------
    # Severity
    # ----------------------------------------

    if score >= 75:

        severity = "CRITICAL"
        verdict = "HIGH RISK"

    elif score >= 50:

        severity = "HIGH"
        verdict = "HIGH RISK"

    elif score >= 25:

        severity = "MEDIUM"
        verdict = "CAUTION"

    else:

        severity = "LOW"
        verdict = "TRUSTED"

    # ----------------------------------------
    # Final result
    # ----------------------------------------

    return {

        "risk_score": score,

        "severity": severity,

        "verdict": verdict,

        "ml_prediction": prediction,

        "ml_score": ml_score,

        "ml_confidence": round(
            confidence,
            4
        ),

        "ml_model_loaded": model_loaded,

        "anomaly_detected": anomaly,

        "anomaly_model_loaded": anomaly_model_loaded,

        "score_breakdown": breakdown
    }