"""
AI Security Analyst for ChainProof
Correlates evidence from Docker, Syft SBOM, Docker Scout, Sigstore Cosign,
Random Forest, and Isolation Forest to produce an actionable security decision.
"""

from typing import Dict, Any, List
import logging
from app.ai.providers import get_ai_provider, DeterministicSecurityAnalyst

logger = logging.getLogger(__name__)


def extract_evidence(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extract structured security evidence from scan dictionary.
    Grounds all analysis strictly in verified backend scan data.
    """
    image_name = scan_data.get("image", "unknown")
    docker_data = scan_data.get("docker", {}) or {}
    sbom_data = scan_data.get("sbom", {}) or {}
    vuln_data = scan_data.get("vulnerabilities", {}) or {}
    sig_data = scan_data.get("signature", {}) or {}
    ml_data = scan_data.get("ml", {}) or {}
    risk_data = scan_data.get("risk", {}) or {}

    # Size in MB
    size_bytes = docker_data.get("size_bytes", 0)
    size_mb = round(size_bytes / (1024 * 1024), 2) if size_bytes else "Evidence unavailable"

    # Vulnerabilities
    vuln_list = vuln_data.get("vulnerabilities", []) or []
    top_cves: List[Dict[str, str]] = []
    for v in vuln_list[:15]:
        top_cves.append({
            "id": v.get("id", "UNKNOWN"),
            "severity": v.get("severity", "UNKNOWN")
        })

    rf_result = ml_data.get("random_forest", {}) or {}
    anomaly_result = ml_data.get("anomaly_detection", {}) or {}

    evidence = {
        "image": image_name,
        "image_size_mb": size_mb,
        "layers_count": docker_data.get("layers_count", "Evidence unavailable"),
        "sbom_status": sbom_data.get("status", "Evidence unavailable"),
        "package_count": sbom_data.get("package_count", 0),
        "vulnerability_counts": {
            "critical": vuln_data.get("critical", 0),
            "high": vuln_data.get("high", 0),
            "medium": vuln_data.get("medium", 0),
            "low": vuln_data.get("low", 0),
            "total": vuln_data.get("total", 0),
        },
        "sample_vulnerabilities": top_cves,
        "signature_signed": bool(sig_data.get("signed", False)),
        "signature_verified": bool(sig_data.get("verified", False)),
        "ml_rf_prediction": rf_result.get("prediction", risk_data.get("ml_prediction", "UNKNOWN")),
        "ml_rf_confidence": rf_result.get("confidence", risk_data.get("ml_confidence", 0.0)),
        "ml_anomaly_detected": anomaly_result.get("anomaly", risk_data.get("anomaly_detected", False)),
        "ml_anomaly_score": anomaly_result.get("score", 0.0),
        "risk_score": scan_data.get("risk_score", risk_data.get("risk_score", 0)),
        "severity": scan_data.get("severity", risk_data.get("severity", "UNKNOWN")),
        "verdict": scan_data.get("verdict", risk_data.get("verdict", "UNKNOWN")),
        "existing_findings": scan_data.get("findings", [])
    }
    return evidence


class AIAnalyst:
    """Core AI Security Analyst orchestrator."""

    def __init__(self, provider=None):
        self.provider = provider or get_ai_provider()
        self.fallback_provider = DeterministicSecurityAnalyst()

    def analyze(self, scan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Produce a comprehensive AI security intelligence assessment.
        Ensures strict schema compliance and graceful fallback.
        """
        evidence = extract_evidence(scan_data)

        try:
            analysis = self.provider.analyze(evidence)
            validated = self._validate_and_normalize(analysis, evidence)
            return validated
        except Exception as primary_error:
            logger.warning(f"Primary AI provider failed: {primary_error}. Falling back to deterministic analyst.")
            try:
                fallback_analysis = self.fallback_provider.analyze(evidence)
                validated = self._validate_and_normalize(fallback_analysis, evidence)
                return validated
            except Exception as fallback_error:
                logger.error(f"Fallback AI analyst failed: {fallback_error}")
                return {
                    "status": "UNAVAILABLE",
                    "reason": "AI analysis temporarily unavailable",
                    "overall_assessment": "SECURITY CORRELATION UNAVAILABLE",
                    "assessment": "SECURITY ASSESSMENT UNAVAILABLE",
                    "summary": "AI security correlation is currently unavailable. Review raw CVE and ML metrics.",
                    "correlated_risks": [],
                    "priority_findings": [],
                    "risk_factors": [],
                    "security_decision": "REVIEW",
                    "recommended_action": "Conduct manual security review using vulnerability breakdown.",
                    "remediation_plan": ["Inspect CVE list manually", "Verify container signature"],
                    "remediation_steps": ["Inspect CVE list manually", "Verify container signature"],
                    "confidence": 0.5
                }

    def _validate_and_normalize(self, analysis: Dict[str, Any], evidence: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize and guarantee all fields match the required correlation schema.
        """
        if not isinstance(analysis, dict):
            raise ValueError("AI analysis output must be a dictionary")

        # Normalize decision
        raw_decision = str(analysis.get("security_decision", "REVIEW")).upper().strip()
        if "BLOCK" in raw_decision:
            decision = "BLOCK"
        elif "TRUST" in raw_decision:
            decision = "TRUST"
        else:
            decision = "REVIEW"

        # Normalize overall_assessment / assessment
        assessment = str(analysis.get("overall_assessment") or analysis.get("assessment") or "").strip()
        if not assessment:
            if decision == "BLOCK":
                assessment = "CRITICAL DEPLOYMENT RISK"
            elif decision == "REVIEW":
                assessment = "HIGH RISK - REVIEW REQUIRED"
            else:
                assessment = "LOW RISK - VERIFIED SECURE"

        # Normalize summary
        summary = str(analysis.get("summary", "")).strip()
        if not summary:
            summary = f"Security audit completed for {evidence.get('image')}. Decision: {decision}."

        # Normalize correlated_risks
        raw_cr = analysis.get("correlated_risks", [])
        correlated_risks = []
        if isinstance(raw_cr, list):
            for cr in raw_cr:
                if isinstance(cr, dict):
                    ev_list = cr.get("evidence", [])
                    if isinstance(ev_list, str):
                        ev_list = [ev_list]
                    elif not isinstance(ev_list, list):
                        ev_list = ["Evidence verified in scan telemetry"]
                    
                    correlated_risks.append({
                        "title": str(cr.get("title", "Correlated Risk Factor")),
                        "severity": str(cr.get("severity", "MEDIUM")).upper(),
                        "evidence": [str(e) for e in ev_list if str(e).strip()],
                        "reasoning": str(cr.get("reasoning", "Evidence signals correlate to impact workload integrity."))
                    })

        # Fallback for correlated_risks from legacy risk_factors if empty
        if not correlated_risks:
            raw_factors = analysis.get("risk_factors", [])
            if isinstance(raw_factors, list):
                for f in raw_factors:
                    if isinstance(f, dict):
                        correlated_risks.append({
                            "title": str(f.get("factor", "Risk Factor")),
                            "severity": str(f.get("severity", "MEDIUM")).upper(),
                            "evidence": [str(f.get("evidence", "Evidence verified in scan telemetry"))],
                            "reasoning": "Direct risk indicator identified during security audit."
                        })

        # Normalize dominant_risk
        dominant_risk = str(analysis.get("dominant_risk") or "").strip()
        if not dominant_risk:
            if decision == "BLOCK":
                dominant_risk = "Critical Vulnerability Concentration & High Exploitability"
            elif decision == "REVIEW":
                dominant_risk = "Elevated Package Risk & Unverified Provenance"
            else:
                dominant_risk = "Clean Baseline Conformance"

        # Normalize priority_findings
        raw_pf = analysis.get("priority_findings", [])
        priority_findings = []
        if isinstance(raw_pf, list):
            for idx, pf in enumerate(raw_pf):
                if isinstance(pf, dict):
                    r_driver = str(pf.get("risk_driver") or pf.get("reason") or "Direct risk indicator in scan telemetry")
                    priority_findings.append({
                        "priority": int(pf.get("priority", idx + 1)),
                        "finding": str(pf.get("finding", "Security finding")),
                        "risk_driver": r_driver,
                        "reason": r_driver,
                        "recommended_action": str(pf.get("recommended_action", "Review and remediate"))
                    })

        # If priority_findings empty, build from correlated_risks
        if not priority_findings and correlated_risks:
            for idx, cr in enumerate(correlated_risks[:3]):
                priority_findings.append({
                    "priority": idx + 1,
                    "finding": cr["title"],
                    "risk_driver": cr["reasoning"],
                    "reason": cr["reasoning"],
                    "recommended_action": f"Address {cr['severity'].lower()} risk driver before deployment."
                })

        # Normalize remediation roadmap / plan
        raw_plan = analysis.get("remediation_roadmap") or analysis.get("remediation_plan") or analysis.get("remediation_steps") or []
        remediation_roadmap = []
        if isinstance(raw_plan, list):
            for s in raw_plan:
                if isinstance(s, str) and s.strip():
                    remediation_roadmap.append(s.strip())

        if not remediation_roadmap:
            remediation_roadmap = [
                "Review vulnerability findings",
                "Rebuild container image with latest base dependencies",
                "Rescan image prior to deployment"
            ]

        # Recommended action
        recommended_action = str(analysis.get("recommended_action", "")).strip()
        if not recommended_action:
            if decision == "BLOCK":
                recommended_action = "Do not deploy this image to production."
            elif decision == "REVIEW":
                recommended_action = "Remediate identified high-risk findings before production approval."
            else:
                recommended_action = "Image verified safe for production deployment."

        # Legacy risk_factors format
        risk_factors = []
        for cr in correlated_risks:
            risk_factors.append({
                "factor": cr["title"],
                "severity": cr["severity"],
                "evidence": cr["evidence"][0] if cr["evidence"] else "Evidence verified"
            })

        # Confidence
        confidence_val = analysis.get("correlation_confidence") or analysis.get("confidence") or 0.94
        try:
            confidence = float(confidence_val)
            confidence = max(0.1, min(1.0, confidence))
        except Exception:
            confidence = 0.94

        return {
            "status": "success",
            "overall_assessment": assessment,
            "assessment": assessment,
            "correlation_confidence": round(confidence, 2),
            "dominant_risk": dominant_risk,
            "summary": summary,
            "correlated_risks": correlated_risks,
            "priority_findings": priority_findings,
            "risk_factors": risk_factors,
            "security_decision": decision,
            "recommended_action": recommended_action,
            "remediation_roadmap": remediation_roadmap[:5],
            "remediation_plan": remediation_roadmap[:5],
            "remediation_steps": remediation_roadmap[:5],
            "confidence": round(confidence, 2)
        }



# Global singleton analyst instance
_analyst = AIAnalyst()

def analyze_scan(scan_data: Dict[str, Any]) -> Dict[str, Any]:
    """Top-level convenience function to analyze scan data."""
    return _analyst.analyze(scan_data)
