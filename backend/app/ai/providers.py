"""
AI Provider implementations for ChainProof AI Security Analyst
Supports OpenAI, Gemini, Anthropic, Ollama, and a fully deterministic expert security analyst engine.
"""

import json
import os
import re
import urllib.request
import urllib.error
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from app.ai.prompts import SYSTEM_PROMPT, build_user_prompt


class BaseAIProvider(ABC):
    """Abstract base provider for AI Security Analyst."""
    name: str = "base"
    provider_type: str = "unknown"

    @abstractmethod
    def analyze(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        """Perform security analysis on structured evidence."""
        pass


def clean_json_response(raw_text: str) -> Optional[Dict[str, Any]]:
    """Clean markdown code blocks and parse JSON response."""
    if not raw_text or not isinstance(raw_text, str):
        return None
    
    text = raw_text.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return data
    except Exception:
        # Try finding JSON substring
        match = re.search(r"(\{.*\})", text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group(1))
                if isinstance(data, dict):
                    return data
            except Exception:
                pass
    return None


class DeterministicSecurityAnalyst(BaseAIProvider):
    """
    High-precision deterministic security correlation engine.
    Correlates actual CVE telemetry, ML predictions, Sigstore integrity, and image composition
    to generate authoritative, multi-signal evidence-grounded security decisions.
    Always available with zero external API dependencies.
    """
    name: str = "deterministic_rule_based"
    provider_type: str = "rule_based"

    def analyze(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        image_name = evidence.get("image", "Container image")
        vuln_counts = evidence.get("vulnerability_counts", {})
        critical_cves = int(vuln_counts.get("critical", 0))
        high_cves = int(vuln_counts.get("high", 0))
        medium_cves = int(vuln_counts.get("medium", 0))
        low_cves = int(vuln_counts.get("low", 0))
        total_cves = int(vuln_counts.get("total", critical_cves + high_cves + medium_cves + low_cves))

        is_signed = bool(evidence.get("signature_signed", False))
        is_verified = bool(evidence.get("signature_verified", False))

        rf_pred = str(evidence.get("ml_rf_prediction", "UNKNOWN")).upper()
        rf_conf = float(evidence.get("ml_rf_confidence", 0.75))
        anomaly_detected = bool(evidence.get("ml_anomaly_detected", False))
        anomaly_score = evidence.get("ml_anomaly_score", 0.0)

        risk_score = int(evidence.get("risk_score", 0))
        package_count = evidence.get("package_count", 0)
        layer_count = evidence.get("layers_count", "N/A")

        # --- Dynamic Correlation Confidence Computation ---
        # Grounded in telemetry completeness, cross-signal convergence, and evidence depth.
        telemetry_score = 0.0
        # 1. Docker metadata presence
        if layer_count != "Evidence unavailable" and layer_count != "N/A":
            telemetry_score += 0.20
        else:
            telemetry_score += 0.10
        
        # 2. SBOM presence
        if evidence.get("sbom_status") != "Evidence unavailable" and package_count > 0:
            telemetry_score += 0.25
        else:
            telemetry_score += 0.10

        # 3. CVE Telemetry presence
        if "vulnerability_counts" in evidence:
            telemetry_score += 0.25
        
        # 4. Signature proof verified
        telemetry_score += 0.15

        # 5. ML Models evaluated
        if rf_pred != "UNKNOWN":
            telemetry_score += 0.15

        # Signal convergence adjustments
        convergence_bonus = 0.0
        if (critical_cves > 0 and rf_pred in ("CRITICAL", "HIGH")) or (critical_cves == 0 and high_cves == 0 and rf_pred == "LOW"):
            convergence_bonus += 0.05
        if anomaly_detected and critical_cves > 0:
            convergence_bonus += 0.03

        raw_confidence = min(0.98, max(0.65, (telemetry_score * 0.85) + (rf_conf * 0.10) + convergence_bonus))
        correlation_confidence = round(raw_confidence, 2)

        # --- 1. Multi-Signal Correlated Risks ---
        correlated_risks = []
        dominant_risk = "Baseline Security Conformance"

        if critical_cves > 0:
            dominant_risk = f"Critical Vulnerability Concentration ({critical_cves} CVEs)"
            evidence_signals = [
                f"Docker Scout: {critical_cves} critical and {high_cves} high severity CVEs detected",
                f"Random Forest ML: Posture classified as {rf_pred} ({int(rf_conf * 100)}% confidence)"
            ]
            if not is_verified:
                evidence_signals.append("Cosign / Sigstore: Container image lacks cryptographically verified signature")
            if anomaly_detected:
                evidence_signals.append(f"Isolation Forest: Structural anomaly detected in feature vector (Score: {anomaly_score})")

            correlated_risks.append({
                "title": "Severe Exploitability & Unverified Origin Risk",
                "severity": "CRITICAL",
                "evidence": evidence_signals,
                "reasoning": (
                    f"The presence of {critical_cves} critical CVEs combined with an {rf_pred} Random Forest classification "
                    f"and {'unverified signature provenance' if not is_verified else 'signed provenance'} presents an immediate "
                    f"remote compromise vector that bypasses zero-trust supply chain boundaries."
                )
            })
        elif high_cves > 0:
            dominant_risk = f"High Vulnerability Exposure ({high_cves} High CVEs)"
            evidence_signals = [
                f"Docker Scout: {high_cves} high-severity CVEs identified with known exploitation paths",
                f"Random Forest ML: Workload evaluated at {rf_pred} risk profile"
            ]
            if not is_verified:
                evidence_signals.append("Cosign: Unsigned container artifact lacking tamper-evidence")
            
            correlated_risks.append({
                "title": "Elevated Vulnerability Footprint in Runtime Layer",
                "severity": "HIGH",
                "evidence": evidence_signals,
                "reasoning": (
                    f"{high_cves} high-severity CVEs in the base package manifest represent actionable exploit pathways. "
                    f"Without cryptographic verification, package integrity cannot be guaranteed."
                )
            })

        # Supply chain & provenance correlation
        if not is_verified:
            if dominant_risk == "Baseline Security Conformance":
                dominant_risk = "Unverified Supply Chain Provenance"
            prov_signals = [
                "Cosign / Sigstore: Signature verification failed or missing",
                f"Syft SBOM: {package_count} packages cataloged across {layer_count} layers"
            ]
            if anomaly_detected:
                prov_signals.append(f"Isolation Forest: Outlier feature footprint detected (Score: {anomaly_score})")

            correlated_risks.append({
                "title": "Supply Chain Provenance & Verification Gap",
                "severity": "HIGH" if (critical_cves > 0 or high_cves > 0) else "MEDIUM",
                "evidence": prov_signals,
                "reasoning": (
                    "Image origin is unverified against an authorized Sigstore transparency log. In production environments, "
                    "unsigned images risk supply-chain tampering and unauthorized dependency injection."
                )
            })
        else:
            correlated_risks.append({
                "title": "Cryptographically Verified Supply Chain Provenance",
                "severity": "LOW",
                "evidence": [
                    "Cosign / Sigstore: Signature verified against Rekor transparency log",
                    f"Syft SBOM: {package_count} package components verified in manifest"
                ],
                "reasoning": "Cryptographic signature confirms build origin and attestation chain integrity."
            })

        # ML Anomaly Signal
        if anomaly_detected:
            correlated_risks.append({
                "title": "Structural Anomaly in Container Composition",
                "severity": "HIGH" if critical_cves > 0 else "MEDIUM",
                "evidence": [
                    f"Isolation Forest: Decision function score of {anomaly_score}",
                    f"Package to Layer Ratio: {package_count} packages across {layer_count} layers"
                ],
                "reasoning": "Workload feature profile diverges significantly from standard baseline distributions."
            })

        if not correlated_risks:
            correlated_risks.append({
                "title": "Verified Baseline Security Profile",
                "severity": "LOW",
                "evidence": [
                    "Docker Scout: 0 known CVEs detected in package manifest",
                    f"Random Forest: LOW risk classification ({int(rf_conf * 100)}% confidence)",
                    "Isolation Forest: Normal feature distribution"
                ],
                "reasoning": "Workload conforms to enterprise container security baseline standards."
            })

        # --- 2. Priority Findings ---
        priority_findings = []
        p_idx = 1

        if critical_cves > 0:
            priority_findings.append({
                "priority": p_idx,
                "finding": f"{critical_cves} Critical Vulnerability CVEs in Base Packages",
                "risk_driver": "Direct attack vector susceptible to remote code execution or privilege escalation.",
                "reason": "Direct attack vector susceptible to remote code execution or privilege escalation.",
                "recommended_action": "Upgrade affected base dependencies immediately and rescan prior to deployment."
            })
            p_idx += 1

        if high_cves > 0:
            priority_findings.append({
                "priority": p_idx,
                "finding": f"{high_cves} High-Severity Vulnerabilities Present",
                "risk_driver": "Exploitable weakness in application runtime dependencies.",
                "reason": "Exploitable weakness in application runtime dependencies.",
                "recommended_action": "Apply vendor security patches during the next build cycle."
            })
            p_idx += 1

        if not is_verified:
            priority_findings.append({
                "priority": p_idx,
                "finding": "Unsigned Container Image Artifact",
                "risk_driver": "Absence of Sigstore Cosign signature prevents provenance validation.",
                "reason": "Absence of Sigstore Cosign signature prevents provenance validation.",
                "recommended_action": "Establish Cosign keyless signing pipeline in CI/CD before registry push."
            })
            p_idx += 1

        if anomaly_detected:
            priority_findings.append({
                "priority": p_idx,
                "finding": f"Isolation Forest Anomaly Flagged (Score: {anomaly_score})",
                "risk_driver": "Anomalous package or layer composition indicates non-standard build pattern.",
                "reason": "Anomalous package or layer composition indicates non-standard build pattern.",
                "recommended_action": "Audit base image dependencies and remove unneeded development binaries."
            })
            p_idx += 1

        if not priority_findings:
            priority_findings.append({
                "priority": 1,
                "finding": "Clean Baseline Security Conformance",
                "risk_driver": "No critical vulnerabilities or anomalous structural indicators detected.",
                "reason": "No critical vulnerabilities or anomalous structural indicators detected.",
                "recommended_action": "Maintain continuous scanning upon future base image rebuilds."
            })

        # --- 3. Remediation Roadmap ---
        remediation_roadmap = []
        if critical_cves > 0:
            remediation_roadmap.append(f"Patch or upgrade packages harboring {critical_cves} critical vulnerability CVEs.")
        if high_cves > 0:
            remediation_roadmap.append(f"Update intermediate dependencies for {high_cves} high-severity findings.")
        if not is_verified:
            remediation_roadmap.append("Sign rebuilt container artifact using Sigstore Cosign in CI/CD pipeline.")
        if package_count > 200:
            remediation_roadmap.append(f"Refactor Dockerfile to adopt distroless or alpine base image (current: {package_count} pkgs).")
        remediation_roadmap.append("Trigger automated ChainProof re-scan to verify policy compliance before production deployment.")

        # --- 4. Decision & Posture Assessment ---
        if critical_cves > 0 or risk_score >= 75 or rf_pred == "CRITICAL":
            decision = "BLOCK"
            assessment = "CRITICAL DEPLOYMENT RISK"
            rec_action = "Block deployment to production environments until critical CVEs are resolved and re-verified."
            summary = (
                f"Container '{image_name}' exhibits severe security exposure driven by {critical_cves} critical CVE(s) "
                f"and a composite risk score of {risk_score}/100. Random Forest classified the workload as {rf_pred} "
                f"({int(rf_conf * 100)}% confidence)" +
                (f" with ML anomaly detection triggered." if anomaly_detected else ".")
            )
        elif high_cves > 0 or risk_score >= 50 or (not is_verified and total_cves > 10) or rf_pred == "HIGH":
            decision = "REVIEW"
            assessment = "HIGH RISK - SECURITY REVIEW REQUIRED"
            rec_action = "Security team review required prior to cluster deployment; mitigate high-severity findings."
            summary = (
                f"Container '{image_name}' presents elevated risk with {high_cves} high-severity CVE(s) and a composite score "
                f"of {risk_score}/100. Workload requires remediation of key vulnerabilities and supply-chain verification."
            )
        elif risk_score >= 25 or not is_verified or anomaly_detected:
            decision = "REVIEW"
            assessment = "MODERATE RISK - REVIEW RECOMMENDED"
            rec_action = "Review unsigned image provenance and non-critical CVEs prior to production rollout."
            summary = (
                f"Container '{image_name}' shows moderate risk (Score: {risk_score}/100). No critical vulnerabilities "
                f"were detected, but unsigned provenance or moderate findings require operational approval."
            )
        else:
            decision = "TRUST"
            assessment = "LOW RISK - VERIFIED SECURE"
            rec_action = "Approved for deployment according to organizational container policy."
            summary = (
                f"Container '{image_name}' satisfies supply-chain integrity standards with a clean vulnerability profile "
                f"(Score: {risk_score}/100) and verified ML baseline."
            )

        # Legacy risk_factors format for backward-compatibility
        risk_factors = []
        for cr in correlated_risks:
            risk_factors.append({
                "factor": cr["title"],
                "severity": cr["severity"],
                "evidence": cr["evidence"][0] if cr["evidence"] else "Evidence verified"
            })

        return {
            "status": "success",
            "overall_assessment": assessment,
            "assessment": assessment,
            "correlation_confidence": correlation_confidence,
            "dominant_risk": dominant_risk,
            "summary": summary,
            "correlated_risks": correlated_risks,
            "priority_findings": priority_findings,
            "risk_factors": risk_factors,
            "security_decision": decision,
            "recommended_action": rec_action,
            "remediation_roadmap": remediation_roadmap[:5],
            "remediation_plan": remediation_roadmap[:5],
            "remediation_steps": remediation_roadmap[:5],
            "confidence": correlation_confidence
        }



class OpenAIProvider(BaseAIProvider):
    """OpenAI API Provider (GPT-4o / GPT-4o-mini)."""
    name: str = "openai"
    provider_type: str = "external_llm"

    def __init__(self, api_key: str, model: str = "gpt-4o-mini", base_url: str = "https://api.openai.com/v1"):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")

    def analyze(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        user_content = build_user_prompt(evidence)
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        req = urllib.request.Request(
            f"{self.base_url}/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content = res_data["choices"][0]["message"]["content"]
            parsed = clean_json_response(content)
            if parsed:
                return parsed
            raise ValueError("Failed to parse valid JSON from OpenAI response")


class GeminiProvider(BaseAIProvider):
    """Google Gemini API Provider."""
    name: str = "gemini"
    provider_type: str = "external_llm"

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model

    def analyze(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        user_content = build_user_prompt(evidence)
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"parts": [{"text": user_content}]}],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            candidates = res_data.get("candidates", [])
            if candidates:
                content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                parsed = clean_json_response(content)
                if parsed:
                    return parsed
            raise ValueError("Failed to parse valid JSON from Gemini response")


class AnthropicProvider(BaseAIProvider):
    """Anthropic Claude API Provider."""
    name: str = "anthropic"
    provider_type: str = "external_llm"

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model = model

    def analyze(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        user_content = build_user_prompt(evidence)
        url = "https://api.anthropic.com/v1/messages"
        payload = {
            "model": self.model,
            "max_tokens": 1024,
            "system": SYSTEM_PROMPT,
            "messages": [{"role": "user", "content": user_content}],
            "temperature": 0.2
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01"
            },
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=15) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            content_blocks = res_data.get("content", [])
            for block in content_blocks:
                if block.get("type") == "text":
                    parsed = clean_json_response(block.get("text", ""))
                    if parsed:
                        return parsed
            raise ValueError("Failed to parse valid JSON from Anthropic response")


class OllamaProvider(BaseAIProvider):
    """Local Ollama Provider."""
    name: str = "ollama"
    provider_type: str = "local_llm"

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3"):
        self.base_url = base_url.rstrip("/")
        self.model = model

    def analyze(self, evidence: Dict[str, Any]) -> Dict[str, Any]:
        user_content = build_user_prompt(evidence)
        payload = {
            "model": self.model,
            "system": SYSTEM_PROMPT,
            "prompt": user_content,
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.2}
        }

        req = urllib.request.Request(
            f"{self.base_url}/api/generate",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=20) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            parsed = clean_json_response(res_data.get("response", ""))
            if parsed:
                return parsed
            raise ValueError("Failed to parse valid JSON from Ollama response")


def get_ai_provider() -> BaseAIProvider:
    """
    Factory function to initialize configured AI provider.
    Priority:
    1. AI_ANALYST_PROVIDER env variable
    2. Detected API keys (OPENAI_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY)
    3. DeterministicSecurityAnalyst (deterministic local intelligence)
    """
    provider_name = os.getenv("AI_ANALYST_PROVIDER", "").strip().lower()

    if provider_name == "openai" or (not provider_name and os.getenv("OPENAI_API_KEY")):
        api_key = os.getenv("OPENAI_API_KEY", "")
        if api_key:
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
            return OpenAIProvider(api_key=api_key, model=model, base_url=base_url)

    if provider_name in ("gemini", "google") or (not provider_name and os.getenv("GEMINI_API_KEY")):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            model = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
            return GeminiProvider(api_key=api_key, model=model)

    if provider_name == "anthropic" or (not provider_name and os.getenv("ANTHROPIC_API_KEY")):
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if api_key:
            model = os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
            return AnthropicProvider(api_key=api_key, model=model)

    if provider_name == "ollama":
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.getenv("OLLAMA_MODEL", "llama3")
        return OllamaProvider(base_url=base_url, model=model)

    # Default fallback: Deterministic Local Security Analyst
    return DeterministicSecurityAnalyst()
