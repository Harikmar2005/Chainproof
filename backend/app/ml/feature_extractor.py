import pandas as pd

def extract_features(
    docker_data: dict,
    sbom_data: dict = None,
    vulnerability_data: dict = None,
    signature_data: dict = None
):
    if sbom_data is None:
        sbom_data = docker_data.get("sbom_data", {}) if isinstance(docker_data, dict) else {}
    if vulnerability_data is None:
        vulnerability_data = docker_data.get("vulnerability_data", {}) if isinstance(docker_data, dict) else {}
    if signature_data is None:
        signature_data = docker_data.get("signature_data", {}) if isinstance(docker_data, dict) else {}
    if isinstance(docker_data, dict) and "size_bytes" not in docker_data and "docker_data" in docker_data:
        docker_data = docker_data.get("docker_data", {})

    size_bytes = docker_data.get("size_bytes") or 0 if isinstance(docker_data, dict) else 0
    image_size_mb = size_bytes / (1024 * 1024)

    features = {
        "critical_cves": int(vulnerability_data.get("critical", 0)),
        "high_cves": int(vulnerability_data.get("high", 0)),
        "medium_cves": int(vulnerability_data.get("medium", 0)),
        "low_cves": int(vulnerability_data.get("low", 0)),
        "package_count": int(sbom_data.get("package_count", 0)),
        "image_size_mb": round(image_size_mb, 2),
        "is_signed": int(signature_data.get("signed", False)),
        "signature_verified": int(signature_data.get("verified", False)),
    }

    return features
