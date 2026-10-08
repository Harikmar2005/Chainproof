import { useState } from "react";
import AISecurityAnalyst from "./AISecurityAnalyst";
import VulnerabilityCards from "./VulnerabilityCards";
import VulnerabilityChart from "./VulnerabilityChart";
import VulnerabilityTable from "./VulnerabilityTable";
import RemediationSolutionCenter from "./RemediationSolutionCenter";
import { 
    DockerIcon, 
    ShieldCheckIcon, 
    PackageIcon, 
    KeyIcon, 
    CpuIcon, 
    DownloadIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldAlertIcon,
    ShieldIcon,
    ArrowLeftIcon
} from "./Icons";

function SecurityIntelligenceReport({ reportData, onUpdateReport, onClose, isModal = false }) {
    const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'vulnerabilities', 'supplychain', 'ml', 'remediation'

    if (!reportData) return null;

    const ai = reportData.ai_analysis || {};
    const rawDecision = (ai.security_decision || (reportData.severity === "CRITICAL" ? "BLOCK" : reportData.severity === "LOW" ? "TRUST" : "REVIEW")).toUpperCase();
    const decision = rawDecision.includes("BLOCK") ? "BLOCK" : rawDecision.includes("TRUST") ? "TRUST" : "REVIEW";
    
    const riskScore = reportData.risk_score ?? reportData.risk?.risk_score ?? 0;
    const severity = (reportData.severity || reportData.risk?.severity || "UNKNOWN").toUpperCase();
    const totalVulns = reportData.vulnerabilities?.total || 0;

    const handleExportJSON = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `chainproof-report-${(reportData.image || "image").replace(/[:/]/g, "_")}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    };

    const getScoreBadgeClass = (score, sev) => {
        if (sev === "CRITICAL" || score >= 75) return "score-critical";
        if (sev === "HIGH" || score >= 50) return "score-high";
        if (sev === "MEDIUM" || score >= 25) return "score-medium";
        return "score-low";
    };

    const getDecisionTagClass = (dec) => {
        if (dec === "BLOCK") return "decision-tag-block";
        if (dec === "TRUST") return "decision-tag-trust";
        return "decision-tag-review";
    };

    const getDecisionText = (dec) => {
        if (dec === "BLOCK") return "BLOCK DEPLOYMENT";
        if (dec === "TRUST") return "TRUSTED FOR PROD";
        return "REVIEW REQUIRED";
    };

    return (
        <div className={`security-intelligence-report ${isModal ? "report-modal-content" : ""}`}>
            {/* Top Navigation Back link */}
            {onClose && (
                <div className="report-back-row">
                    <button type="button" className="report-back-btn" onClick={onClose}>
                        <ArrowLeftIcon size={14} /> Back to Audit Records
                    </button>
                </div>
            )}

            {/* Header / Hero Banner */}
            <div className="report-hero-header">
                <div className="report-target-meta">
                    <div className="report-type-badge">
                        <ShieldCheckIcon size={13} /> CONTAINER SECURITY INTELLIGENCE REPORT
                    </div>
                    <h1 className="report-image-title">{reportData.image}</h1>
                    <div className="report-id-time-row">
                        <span className="report-timestamp">{reportData.timestamp || "Real-Time Audit"}</span>
                        <span className="dot-sep">•</span>
                        <span className="report-uuid">Audit ID: {reportData.scan_id ? reportData.scan_id.slice(0, 18) : "N/A"}</span>
                    </div>
                </div>

                <div className="report-decision-score-group">
                    {/* Security Decision Badge */}
                    <div className={`report-decision-badge ${getDecisionTagClass(decision)}`}>
                        <div className="decision-badge-icon">
                            {decision === "BLOCK" && <ShieldAlertIcon size={20} />}
                            {decision === "TRUST" && <ShieldCheckIcon size={20} />}
                            {decision === "REVIEW" && <ShieldIcon size={20} />}
                        </div>
                        <div className="decision-badge-texts">
                            <span className="decision-label">POLICY DECISION</span>
                            <strong className="decision-status">
                                {getDecisionText(decision)}
                            </strong>
                        </div>
                    </div>

                    {/* Composite Risk Score Meter */}
                    <div className="report-score-card">
                        <span className="score-label">RISK SCORE</span>
                        <div className={`score-metric ${getScoreBadgeClass(riskScore, severity)}`}>
                            <span className="score-num">{riskScore}</span>
                            <span className="score-total">/100</span>
                        </div>
                        <span className={`severity-tag ${severity.toLowerCase()}`}>{severity}</span>
                    </div>
                </div>
            </div>

            {/* Quick Action Navigation Bar */}
            <div className="report-nav-bar">
                <div className="report-nav-tabs">
                    <button
                        type="button"
                        className={`report-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        Intelligence Overview
                    </button>
                    <button
                        type="button"
                        className={`report-tab-btn ${activeTab === "vulnerabilities" ? "active" : ""}`}
                        onClick={() => setActiveTab("vulnerabilities")}
                    >
                        CVE Telemetry ({totalVulns})
                    </button>
                    <button
                        type="button"
                        className={`report-tab-btn ${activeTab === "supplychain" ? "active" : ""}`}
                        onClick={() => setActiveTab("supplychain")}
                    >
                        Supply Chain Integrity
                    </button>
                    <button
                        type="button"
                        className={`report-tab-btn ${activeTab === "ml" ? "active" : ""}`}
                        onClick={() => setActiveTab("ml")}
                    >
                        ML Risk Models
                    </button>
                    <button
                        type="button"
                        className={`report-tab-btn solution-tab-btn ${activeTab === "remediation" ? "active" : ""}`}
                        onClick={() => setActiveTab("remediation")}
                    >
                        <ShieldCheckIcon size={14} /> Solution &amp; Remediation
                    </button>
                </div>

                <div className="report-actions-right">
                    <button
                        type="button"
                        className="btn-secondary report-action-btn"
                        onClick={handleExportJSON}
                    >
                        <DownloadIcon size={14} /> Export JSON
                    </button>
                    {isModal && onClose && (
                        <button
                            type="button"
                            className="cta-button primary report-action-btn"
                            onClick={onClose}
                        >
                            Done Inspecting
                        </button>
                    )}
                </div>
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === "overview" && (
                <div className="report-tab-pane">
                    {/* AI SECURITY ANALYST HERO PANEL */}
                    <AISecurityAnalyst
                        scanData={reportData}
                        onAnalysisUpdated={onUpdateReport}
                    />

                    {/* 4 Pillars Risk Intelligence Matrix */}
                    <div className="risk-matrix-grid">
                        {/* Vulnerability Risk Pillar */}
                        <div className="risk-pillar-card">
                            <div className="pillar-header">
                                <AlertTriangleIcon size={16} className="pillar-icon danger" />
                                <h4>Vulnerability Risk</h4>
                            </div>
                            <div className="pillar-body">
                                <div className="pillar-main-stat">
                                    <strong>{totalVulns}</strong>
                                    <span>Total CVEs</span>
                                </div>
                                <div className="pillar-sub-stats">
                                    <span className="crit-stat">{reportData.vulnerabilities?.critical || 0} Critical</span>
                                    <span className="high-stat">{reportData.vulnerabilities?.high || 0} High</span>
                                    <span className="med-stat">{reportData.vulnerabilities?.medium || 0} Med</span>
                                </div>
                            </div>
                            <div className="pillar-footer">
                                <span>Status:</span>
                                <strong className={reportData.vulnerabilities?.critical > 0 ? "text-crit" : reportData.vulnerabilities?.high > 0 ? "text-high" : "text-ok"}>
                                    {reportData.vulnerabilities?.critical > 0 ? "CRITICAL THREAT" : reportData.vulnerabilities?.high > 0 ? "ELEVATED" : totalVulns > 0 ? "MODERATE" : "CLEAN (0 CVEs)"}
                                </strong>
                            </div>
                        </div>

                        {/* Supply Chain Integrity Pillar */}
                        <div className="risk-pillar-card">
                            <div className="pillar-header">
                                <KeyIcon size={16} className="pillar-icon info" />
                                <h4>Supply Chain Integrity</h4>
                            </div>
                            <div className="pillar-body">
                                <div className="pillar-info-line">
                                    <span>Cosign Signature:</span>
                                    <strong className={reportData.signature?.verified ? "text-ok" : "text-warn"}>
                                        {reportData.signature?.verified ? "✓ Cryptographically Verified" : "✕ Unverified / Unsigned"}
                                    </strong>
                                </div>
                                <div className="pillar-info-line">
                                    <span>SBOM Catalog:</span>
                                    <strong>{reportData.sbom?.package_count ?? 0} packages indexed</strong>
                                </div>
                            </div>
                            <div className="pillar-footer">
                                <span>Keyring:</span>
                                <strong>Sigstore Transparency Log</strong>
                            </div>
                        </div>

                        {/* ML Random Forest Pillar */}
                        <div className="risk-pillar-card">
                            <div className="pillar-header">
                                <CpuIcon size={16} className="pillar-icon purple" />
                                <h4>Random Forest Classifier</h4>
                            </div>
                            <div className="pillar-body">
                                <div className="pillar-main-stat">
                                    <strong>{reportData.ml?.random_forest?.prediction || reportData.risk?.ml_prediction || "UNKNOWN"}</strong>
                                    <span>Predicted Posture</span>
                                </div>
                                <div className="pillar-info-line">
                                    <span>Model Confidence:</span>
                                    <strong>
                                        {reportData.ml?.random_forest?.confidence 
                                            ? `${(reportData.ml.random_forest.confidence * 100).toFixed(0)}%`
                                            : reportData.risk?.ml_confidence 
                                                ? `${(reportData.risk.ml_confidence * 100).toFixed(0)}%`
                                                : "N/A"}
                                    </strong>
                                </div>
                            </div>
                            <div className="pillar-footer">
                                <span>Model Status:</span>
                                <strong className="text-ok">Loaded (v1.0.0)</strong>
                            </div>
                        </div>

                        {/* ML Isolation Forest Anomaly Pillar */}
                        <div className="risk-pillar-card">
                            <div className="pillar-header">
                                <ShieldCheckIcon size={16} className="pillar-icon cyan" />
                                <h4>Anomaly Detection</h4>
                            </div>
                            <div className="pillar-body">
                                <div className="pillar-main-stat">
                                    <strong className={reportData.ml?.anomaly_detection?.anomaly || reportData.risk?.anomaly_detected ? "text-warn" : "text-ok"}>
                                        {reportData.ml?.anomaly_detection?.anomaly || reportData.risk?.anomaly_detected ? "ANOMALY FLAGGED" : "NORMAL BASELINE"}
                                    </strong>
                                    <span>Feature Distribution</span>
                                </div>
                                <div className="pillar-info-line">
                                    <span>Anomaly Score:</span>
                                    <strong>{reportData.ml?.anomaly_detection?.score ?? "0.00"}</strong>
                                </div>
                            </div>
                            <div className="pillar-footer">
                                <span>Isolation Forest:</span>
                                <strong className="text-ok">Active</strong>
                            </div>
                        </div>
                    </div>

                    {/* Vulnerability Distribution Summary */}
                    <VulnerabilityCards vulnerabilities={reportData.vulnerabilities} />
                    
                    {totalVulns > 0 ? (
                        <VulnerabilityChart vulnerabilities={reportData.vulnerabilities} />
                    ) : (
                        <div className="result-card clean-vuln-banner">
                            <CheckCircleIcon size={28} className="clean-icon-svg" />
                            <div>
                                <h3>NO VULNERABILITIES DETECTED</h3>
                                <p>This container image passed static CVE analysis with 0 known vulnerabilities.</p>
                            </div>
                        </div>
                    )}

                    {/* CVE Table Preview */}
                    <VulnerabilityTable 
                        vulnerabilities={reportData.vulnerabilities?.vulnerabilities || []} 
                    />
                </div>
            )}

            {/* TAB CONTENT: Vulnerabilities */}
            {activeTab === "vulnerabilities" && (
                <div className="report-tab-pane">
                    <VulnerabilityCards vulnerabilities={reportData.vulnerabilities} />
                    
                    {totalVulns > 0 ? (
                        <VulnerabilityChart vulnerabilities={reportData.vulnerabilities} />
                    ) : (
                        <div className="result-card clean-vuln-banner">
                            <CheckCircleIcon size={28} className="clean-icon-svg" />
                            <div>
                                <h3>NO VULNERABILITIES DETECTED</h3>
                                <p>Static Docker Scout scanner identified zero CVE vulnerabilities in this package manifest.</p>
                            </div>
                        </div>
                    )}

                    <VulnerabilityTable 
                        vulnerabilities={reportData.vulnerabilities?.vulnerabilities || []} 
                    />
                </div>
            )}

            {/* TAB CONTENT: Supply Chain */}
            {activeTab === "supplychain" && (
                <div className="report-tab-pane">
                    <div className="dashboard-three-column">
                        <div className="result-card">
                            <h2><PackageIcon size={18} /> Software Bill of Materials (SBOM)</h2>
                            <div className="info-row">
                                <span>SBOM Generator</span>
                                <strong>Syft Container Engine</strong>
                            </div>
                            <div className="info-row">
                                <span>Generation Status</span>
                                <strong className="status-text-badge pass"><CheckCircleIcon size={14} /> {reportData.sbom?.status || "PASS"}</strong>
                            </div>
                            <div className="info-row">
                                <span>Indexed Package Count</span>
                                <strong>{reportData.sbom?.package_count ?? 0} packages</strong>
                            </div>
                            <div className="info-row">
                                <span>Specification</span>
                                <strong>SPDX 2.3 / CycloneDX 1.5</strong>
                            </div>
                        </div>

                        <div className="result-card">
                            <h2><KeyIcon size={18} /> Cryptographic Signature</h2>
                            <div className="info-row">
                                <span>Signature Present</span>
                                <strong>{reportData.signature?.signed ? "YES" : "NO"}</strong>
                            </div>
                            <div className="info-row">
                                <span>Cosign Verification</span>
                                <strong className={`status-text-badge ${reportData.signature?.verified ? "pass" : "fail"}`}>
                                    {reportData.signature?.verified ? (
                                        <><CheckCircleIcon size={14} /> VERIFIED</>
                                    ) : (
                                        <><XCircleIcon size={14} /> UNVERIFIED</>
                                    )}
                                </strong>
                            </div>
                            <div className="info-row">
                                <span>Transparency Log</span>
                                <strong>Sigstore Rekor Log</strong>
                            </div>
                            <div className="info-row">
                                <span>Certificate OIDC</span>
                                <strong>Fulcio Root CA</strong>
                            </div>
                        </div>

                        <div className="result-card">
                            <h2><DockerIcon size={18} /> Image Configuration &amp; Manifest</h2>
                            <div className="info-row">
                                <span>Target Image</span>
                                <strong>{reportData.image}</strong>
                            </div>
                            <div className="info-row">
                                <span>Layer Manifest Count</span>
                                <strong>{reportData.docker?.layers_count ?? "N/A"} layers</strong>
                            </div>
                            <div className="info-row">
                                <span>Total Uncompressed Size</span>
                                <strong>
                                    {reportData.docker?.size_bytes 
                                        ? `${(reportData.docker.size_bytes / (1024 * 1024)).toFixed(2)} MB`
                                        : "N/A"}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Machine Learning */}
            {activeTab === "ml" && (
                <div className="report-tab-pane">
                    <div className="dashboard-grid-row">
                        <div className="result-card">
                            <h2><CpuIcon size={18} /> Random Forest Classifier</h2>
                            <p className="card-sub-desc">
                                Supervised Random Forest ensemble trained on multi-vector container vulnerability profiles, package counts, signature status, and layer manifests.
                            </p>
                            <div className="info-row">
                                <span>Predicted Risk Label</span>
                                <strong>{reportData.ml?.random_forest?.prediction || reportData.risk?.ml_prediction || "UNKNOWN"}</strong>
                            </div>
                            <div className="info-row">
                                <span>Model Confidence</span>
                                <strong>
                                    {reportData.ml?.random_forest?.confidence 
                                        ? `${(reportData.ml.random_forest.confidence * 100).toFixed(0)}%`
                                        : reportData.risk?.ml_confidence 
                                            ? `${(reportData.risk.ml_confidence * 100).toFixed(0)}%`
                                            : "N/A"}
                                </strong>
                            </div>
                            <div className="info-row">
                                <span>Base Risk Contribution</span>
                                <strong>{reportData.risk?.score_breakdown?.ml_base_score ?? 50} pts</strong>
                            </div>
                            <div className="info-row">
                                <span>Model Artifact</span>
                                <strong>risk_model.pkl (Scikit-Learn)</strong>
                            </div>
                        </div>

                        <div className="result-card">
                            <h2><ShieldCheckIcon size={18} /> Isolation Forest Anomaly Detection</h2>
                            <p className="card-sub-desc">
                                Unsupervised Isolation Forest model detecting structural configuration outliers, abnormal dependency ratios, and supply-chain anomalies.
                            </p>
                            <div className="info-row">
                                <span>Anomaly Status</span>
                                <strong className={reportData.ml?.anomaly_detection?.anomaly || reportData.risk?.anomaly_detected ? "text-warn" : "text-ok"}>
                                    {reportData.ml?.anomaly_detection?.anomaly || reportData.risk?.anomaly_detected ? "ANOMALY DETECTED" : "NORMAL (NO ANOMALY)"}
                                </strong>
                            </div>
                            <div className="info-row">
                                <span>Decision Function Score</span>
                                <strong>{reportData.ml?.anomaly_detection?.score ?? "0.00"}</strong>
                            </div>
                            <div className="info-row">
                                <span>Anomaly Penalty</span>
                                <strong>+{reportData.risk?.score_breakdown?.anomaly_penalty ?? 0} pts</strong>
                            </div>
                            <div className="info-row">
                                <span>Model Artifact</span>
                                <strong>anomaly_model.pkl</strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT: Solution & Remediation Engine */}
            {activeTab === "remediation" && (
                <div className="report-tab-pane">
                    <RemediationSolutionCenter scanData={reportData} />
                </div>
            )}
        </div>
    );
}

export default SecurityIntelligenceReport;
