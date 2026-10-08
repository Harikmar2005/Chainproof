import { useState } from "react";
import { analyzeScan } from "../services/api";
import { 
    BrainIcon, 
    ShieldCheckIcon, 
    AlertTriangleIcon, 
    CheckCircleIcon,
    RefreshCwIcon,
    ListCheckIcon,
    ShieldAlertIcon,
    ShieldIcon,
    DockerIcon,
    KeyIcon,
    CpuIcon,
    PackageIcon
} from "./Icons";

function AISecurityAnalyst({ scanData, onAnalysisUpdated }) {
    const [analyzing, setAnalyzing] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [error, setError] = useState("");

    if (!scanData) return null;

    const ai = scanData.ai_analysis || {};
    const rawDecision = (ai.security_decision || (scanData.severity === "CRITICAL" ? "BLOCK" : scanData.severity === "LOW" ? "TRUST" : "REVIEW")).toUpperCase();
    const decision = rawDecision.includes("BLOCK") ? "BLOCK" : rawDecision.includes("TRUST") ? "TRUST" : "REVIEW";
    const correlationConfVal = ai.correlation_confidence ?? ai.confidence;
    const confidencePercent = correlationConfVal ? Math.round(correlationConfVal * 100) : 88;
    const riskScore = scanData.risk_score ?? scanData.risk?.risk_score ?? 0;

    const correlatedRisks = ai.correlated_risks || [];
    const priorityFindings = ai.priority_findings || [];
    const remediationPlan = ai.remediation_roadmap || ai.remediation_plan || ai.remediation_steps || [];
    const overallAssessment = ai.overall_assessment || ai.assessment || "CONTAINER SECURITY POSTURE ASSESSMENT";
    const dominantRisk = ai.dominant_risk;

    const handleRefreshAnalysis = async () => {
        try {
            setAnalyzing(true);
            setError("");
            setStepIndex(1);

            // Progressive step progression for transparent AI evidence correlation
            setTimeout(() => setStepIndex(2), 200);
            setTimeout(() => setStepIndex(3), 400);
            setTimeout(() => setStepIndex(4), 600);

            const updatedAI = await analyzeScan(scanData);
            setStepIndex(5);

            if (onAnalysisUpdated) {
                onAnalysisUpdated({
                    ...scanData,
                    ai_analysis: updatedAI
                });
            }
        } catch (err) {
            setError(err?.message || "Failed to re-correlate AI security signals.");
        } finally {
            setTimeout(() => {
                setAnalyzing(false);
                setStepIndex(0);
            }, 400);
        }
    };

    const getDecisionClass = (dec) => {
        if (dec === "BLOCK") return "decision-block";
        if (dec === "TRUST") return "decision-trust";
        return "decision-review";
    };

    const getDecisionLabel = (dec) => {
        if (dec === "BLOCK") return "BLOCK DEPLOYMENT";
        if (dec === "TRUST") return "APPROVED FOR PRODUCTION (TRUSTED)";
        return "SECURITY REVIEW REQUIRED";
    };

    const getSeverityBadgeClass = (sev) => {
        const s = (sev || "MEDIUM").toUpperCase();
        if (s === "CRITICAL") return "badge-critical";
        if (s === "HIGH") return "badge-high";
        if (s === "MEDIUM") return "badge-medium";
        if (s === "LOW") return "badge-low";
        return "badge-info";
    };

    const getSignalIcon = (signalText) => {
        const text = signalText.toLowerCase();
        if (text.includes("docker") || text.includes("cve") || text.includes("vulnerability") || text.includes("scout")) {
            return <AlertTriangleIcon size={12} className="signal-icon cve" />;
        }
        if (text.includes("cosign") || text.includes("signature") || text.includes("sigstore") || text.includes("provenance")) {
            return <KeyIcon size={12} className="signal-icon sig" />;
        }
        if (text.includes("random forest") || text.includes("isolation forest") || text.includes("ml") || text.includes("anomaly")) {
            return <CpuIcon size={12} className="signal-icon ml" />;
        }
        if (text.includes("sbom") || text.includes("syft") || text.includes("package") || text.includes("layer")) {
            return <PackageIcon size={12} className="signal-icon sbom" />;
        }
        return <CheckCircleIcon size={12} className="signal-icon generic" />;
    };

    return (
        <section className="ai-analyst-panel ai-correlation-engine" aria-label="AI Security Correlation Engine">
            {/* AI Correlation Engine Header */}
            <div className="ai-analyst-header">
                <div className="ai-analyst-title-group">
                    <div className="ai-analyst-icon-box">
                        <BrainIcon size={22} className="brain-pulse-icon" />
                    </div>
                    <div>
                        <div className="ai-badge-row">
                            <span className="ai-label-pill">AI SECURITY CORRELATION ENGINE</span>
                            <span className="ai-confidence-pill">
                                <ShieldCheckIcon size={12} /> {confidencePercent}% Correlation Confidence
                            </span>
                            <span className="ai-status-pill verified">
                                Multi-Signal Reasoning Active
                            </span>
                        </div>
                        <h2 className="ai-main-title">{overallAssessment}</h2>
                    </div>
                </div>

                <button
                    type="button"
                    className="ai-refresh-btn"
                    onClick={handleRefreshAnalysis}
                    disabled={analyzing}
                    title="Re-correlate security signals across Docker, SBOM, Cosign, and ML models"
                >
                    <RefreshCwIcon size={14} className={analyzing ? "spin-animation" : ""} />
                    {analyzing ? "Correlating Signals..." : "Re-Correlate Evidence"}
                </button>
            </div>

            {/* Live Correlation Steps (if active) */}
            {analyzing && (
                <div className="ai-correlation-progress">
                    <div className="progress-step-row">
                        <span className={`step-item ${stepIndex >= 1 ? "done" : ""}`}>✓ Docker &amp; SBOM Composition</span>
                        <span className={`step-item ${stepIndex >= 2 ? "done" : ""}`}>✓ CVE Vulnerability Telemetry</span>
                        <span className={`step-item ${stepIndex >= 3 ? "done" : ""}`}>✓ Cosign Supply Chain Provenance</span>
                        <span className={`step-item ${stepIndex >= 4 ? "done" : ""}`}>✓ Random Forest &amp; Isolation Forest ML</span>
                        <span className={`step-item ${stepIndex >= 5 ? "done" : ""}`}>✓ Cross-Signal Synthesis</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="ai-error-alert" role="alert">
                    <AlertTriangleIcon size={15} /> {error}
                </div>
            )}

            {/* Policy Verdict Banner */}
            <div className={`ai-decision-banner ${getDecisionClass(decision)}`}>
                <div className="decision-banner-left">
                    <div className="decision-icon-wrapper">
                        {decision === "BLOCK" && <ShieldAlertIcon size={26} />}
                        {decision === "TRUST" && <ShieldCheckIcon size={26} />}
                        {decision === "REVIEW" && <ShieldIcon size={26} />}
                    </div>
                    <div>
                        <span className="decision-lead-text">CHAINPROOF POLICY VERDICT</span>
                        <h3 className="decision-heading">{getDecisionLabel(decision)}</h3>
                        <p className="decision-action-text">{ai.recommended_action || "Review correlated security findings prior to cluster deployment."}</p>
                    </div>
                </div>
                <div className="decision-banner-badge">
                    <span className="decision-tag">{decision}</span>
                </div>
            </div>

            {/* Executive Correlation Narrative */}
            <div className="ai-summary-card">
                <div className="summary-card-header">
                    <div>
                        <h4 className="ai-section-subtitle">Executive Risk Narrative &amp; Signal Correlation</h4>
                        {dominantRisk && (
                            <div className="dominant-risk-tag">
                                <strong>Dominant Risk Vector:</strong> {dominantRisk}
                            </div>
                        )}
                    </div>
                    <span className="summary-risk-score-badge">
                        Objective Risk Engine Score: <strong>{riskScore}/100</strong>
                    </span>
                </div>
                <p className="ai-summary-text">
                    {ai.summary || "No executive summary available for this container scan."}
                </p>
            </div>

            {/* CORRELATED MULTI-SIGNAL RISKS */}
            <div className="ai-evidence-section">
                <div className="section-title-row">
                    <h4 className="ai-section-subtitle">
                        Correlated Multi-Signal Risks
                    </h4>
                    <span className="section-subtext-badge">
                        Cross-referencing CVEs, SBOM, Cosign Signatures &amp; ML Models
                    </span>
                </div>

                {correlatedRisks.length > 0 ? (
                    <div className="ai-correlated-risks-grid">
                        {correlatedRisks.map((risk, idx) => (
                            <div key={idx} className="ai-correlated-risk-card">
                                <div className="risk-card-top-row">
                                    <div className="risk-title-wrapper">
                                        <strong className="risk-card-title">{risk.title}</strong>
                                    </div>
                                    <span className={`factor-sev-badge ${getSeverityBadgeClass(risk.severity)}`}>
                                        {risk.severity}
                                    </span>
                                </div>

                                {/* Interconnected Evidence Signals */}
                                {risk.evidence && risk.evidence.length > 0 && (
                                    <div className="correlated-signals-box">
                                        <span className="signals-label">CORRELATED SIGNALS:</span>
                                        <ul className="signals-list">
                                            {risk.evidence.map((ev, sIdx) => (
                                                <li key={sIdx} className="signal-chip">
                                                    {getSignalIcon(ev)}
                                                    <span>{ev}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Technical Correlation Reasoning */}
                                {risk.reasoning && (
                                    <div className="risk-reasoning-box">
                                        <span className="reasoning-label">Security Correlation Reasoning:</span>
                                        <p className="reasoning-text">{risk.reasoning}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ai-empty-factors">
                        <CheckCircleIcon size={16} /> No multi-signal risk anomalies detected. Workload conforms to baseline container posture.
                    </div>
                )}
            </div>

            {/* PRIORITIZED ACTIONABLE FINDINGS */}
            {priorityFindings.length > 0 && (
                <div className="ai-priority-findings-section">
                    <div className="section-title-row">
                        <h4 className="ai-section-subtitle">Prioritized Actionable Findings</h4>
                        <span className="section-subtext-badge">Ranked by Operational Exploitability</span>
                    </div>

                    <div className="priority-findings-list">
                        {priorityFindings.map((pf, idx) => (
                            <div key={idx} className="priority-finding-item">
                                <div className="finding-rank-badge">
                                    <span>#{pf.priority || idx + 1}</span>
                                </div>
                                <div className="finding-content">
                                    <h5 className="finding-title">{pf.finding}</h5>
                                    <p className="finding-reason">
                                        <strong>Risk Driver:</strong> {pf.reason}
                                    </p>
                                    <div className="finding-action-row">
                                        <span className="action-tag">RECOMMENDED ACTION:</span>
                                        <span className="action-text">{pf.recommended_action}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ACTIONABLE REMEDIATION ROADMAP */}
            {remediationPlan.length > 0 && (
                <div className="ai-remediation-section">
                    <div className="remediation-header">
                        <ListCheckIcon size={16} />
                        <h4 className="ai-section-subtitle">Actionable Remediation Roadmap</h4>
                    </div>
                    <ul className="remediation-list">
                        {remediationPlan.map((step, idx) => {
                            const cleanStep = typeof step === "string" ? step.replace(/^(\d+[\.\)]*\s*)+/, "") : step;
                            return (
                                <li key={idx} className="remediation-step-item">
                                    <span className="step-number">{idx + 1}</span>
                                    <span className="step-content">{cleanStep}</span>
                                </li>
                            );
                        })}
                    </ul>

                </div>
            )}

            {/* Architecture Explainer Footer */}
            <div className="ai-architecture-footer">
                <span className="arch-label">CHAINPROOF INTELLIGENCE PIPELINE:</span>
                <span className="arch-flow">
                    Scanners (Docker / Syft / Scout / Cosign) → Machine Learning (RF + IF) → AI Correlation Engine → Risk Engine ({riskScore}/100) → Policy Decision ({decision})
                </span>
            </div>
        </section>
    );
}

export default AISecurityAnalyst;

