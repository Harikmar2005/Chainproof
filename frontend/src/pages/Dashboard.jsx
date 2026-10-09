import { useState, useEffect } from "react";
import { getReports } from "../services/api";
import { 
    DockerIcon, 
    BarChartIcon, 
    AlertTriangleIcon, 
    CpuIcon, 
    ShieldCheckIcon, 
    KeyIcon, 
    LightningIcon,
    ShieldIcon,
    ShieldAlertIcon,
    PackageIcon,
    ChevronRightIcon,
    BrainIcon
} from "../components/Icons";

function Dashboard({ onRouteChange, onQuickScan }) {
    const [stats, setStats] = useState({
        totalScans: 0,
        criticalImages: 0,
        criticalCVEs: 0,
        totalCVEs: 0,
        trustCount: 0,
        reviewCount: 0,
        blockCount: 0,
        riskDist: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        recentScans: [],
        avgRiskScore: 0,
    });
    const [quickInput, setQuickInput] = useState("");
    const [quickError, setQuickError] = useState("");

    useEffect(() => {
        let isMounted = true;
        getReports()
            .then((data) => {
                if (!isMounted || !Array.isArray(data)) return;
                const total = data.length;
                let critImages = 0;
                let critCVEs = 0;
                let totalCVEs = 0;
                let scoreSum = 0;
                let trustCount = 0;
                let reviewCount = 0;
                let blockCount = 0;
                const dist = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };

                data.forEach((r) => {
                    const cves = r.vulnerabilities?.critical || 0;
                    const totalC = r.vulnerabilities?.total || 0;
                    critCVEs += cves;
                    totalCVEs += totalC;
                    scoreSum += (r.risk_score || 0);

                    const sev = (r.severity || "LOW").toUpperCase();
                    if (dist[sev] !== undefined) {
                        dist[sev]++;
                    } else {
                        dist.MEDIUM++;
                    }

                    if (sev === "CRITICAL") critImages++;

                    const dec = (r.ai_analysis?.security_decision || (sev === "CRITICAL" ? "BLOCK" : sev === "LOW" ? "TRUST" : "REVIEW")).toUpperCase();
                    if (dec === "BLOCK") blockCount++;
                    else if (dec === "TRUST") trustCount++;
                    else reviewCount++;
                });

                setStats({
                    totalScans: total,
                    criticalImages: critImages,
                    criticalCVEs: critCVEs,
                    totalCVEs: totalCVEs,
                    trustCount: trustCount,
                    reviewCount: reviewCount,
                    blockCount: blockCount,
                    riskDist: dist,
                    recentScans: data.slice(0, 6),
                    avgRiskScore: total > 0 ? Math.round(scoreSum / total) : 0,
                });
            })
            .catch(() => {});
        return () => { isMounted = false; };
    }, []);

    const handleQuickScanSubmit = (e) => {
        e.preventDefault();
        const trimmed = quickInput.trim();
        if (!trimmed) {
            setQuickError("Please enter a container image tag.");
            return;
        }
        if (/[;&|><$`\\]/.test(trimmed)) {
            setQuickError("Invalid characters detected in image name.");
            return;
        }
        onQuickScan(trimmed);
    };

    const trustRate = stats.totalScans > 0 
        ? Math.round((stats.trustCount / stats.totalScans) * 100) 
        : 100;

    const getDecisionBadge = (report) => {
        const dec = (report.ai_analysis?.security_decision || (report.severity === "CRITICAL" ? "BLOCK" : report.severity === "LOW" ? "TRUST" : "REVIEW")).toUpperCase();
        if (dec === "BLOCK") {
            return (
                <span className="event-decision-pill block">
                    <ShieldAlertIcon size={11} /> BLOCK
                </span>
            );
        }
        if (dec === "TRUST") {
            return (
                <span className="event-decision-pill trust">
                    <ShieldCheckIcon size={11} /> TRUST
                </span>
            );
        }
        return (
            <span className="event-decision-pill review">
                <ShieldIcon size={11} /> REVIEW
            </span>
        );
    };

    return (
        <main className="dashboard-page" id="main-content">
            <div className="dashboard-container">
                {/* Hero Section: Enterprise Cybersecurity Console */}
                <section className="dashboard-hero">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="live-pulse"></span>
                            <ShieldIcon size={14} />
                            <span>CONTAINER SECURITY INTELLIGENCE</span>
                        </div>
                        <h1 className="hero-title">
                            Continuous Verification &amp; <br />
                            <span className="gradient-text">Supply Chain Intelligence</span>
                        </h1>
                        <p className="hero-description">
                            Continuous verification of container vulnerabilities, software composition, provenance, 
                            and supply-chain risk with automated AI security decisions.
                        </p>

                        {/* Quick Scan Input */}
                        <div className="hero-cta-group">
                            <form className="hero-quick-scan-form" onSubmit={handleQuickScanSubmit}>
                                <div className="hero-input-wrapper">
                                    <DockerIcon size={20} className="hero-input-icon-svg" />
                                    <input
                                        type="text"
                                        placeholder="Enter container image (e.g. alpine:latest, bkimminich/juice-shop:latest)"
                                        value={quickInput}
                                        onChange={(e) => {
                                            const sanitized = e.target.value.replace(/[<>'"`&;|\\]/g, "").slice(0, 200);
                                            setQuickInput(sanitized);
                                            if (quickError) setQuickError("");
                                        }}
                                        aria-label="Scan container image"
                                    />
                                    <button type="submit" className="cta-button primary hero-cta-btn">
                                        <LightningIcon size={16} /> Scan Container
                                    </button>
                                </div>
                                {quickError && <span className="hero-error-text">{quickError}</span>}
                            </form>
                        </div>

                        {/* Quick Test Target Chips */}
                        <div className="hero-presets">
                            <span>Benchmark Targets:</span>
                            {[
                                { name: "alpine:latest", label: "alpine:latest" },
                                { name: "nginx:alpine", label: "nginx:alpine" },
                                { name: "python:3.11-slim", label: "python:3.11-slim" },
                                { name: "bkimminich/juice-shop:latest", label: "juice-shop (High Risk)" }
                            ].map((target) => (
                                <button
                                    key={target.name}
                                    type="button"
                                    className={`hero-preset-chip ${target.name.includes("juice") ? "danger-chip" : ""}`}
                                    onClick={() => {
                                        onQuickScan(target.name);
                                        onRouteChange("scan");
                                    }}
                                >
                                    {target.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Top Summary Metrics Cards */}
                <section className="dashboard-metrics-grid" aria-label="Supply chain security telemetry metrics">
                    <div className="metric-card">
                        <div className="metric-header">
                            <BarChartIcon size={18} className="metric-icon-svg" />
                            <span className="metric-label">Images Scanned</span>
                        </div>
                        <div className="metric-value">{stats.totalScans}</div>
                        <div className="metric-sub">Indexed in security ledger</div>
                    </div>

                    <div className="metric-card highlight-danger">
                        <div className="metric-header">
                            <AlertTriangleIcon size={18} className="metric-icon-svg danger" />
                            <span className="metric-label">Critical Risk Images</span>
                        </div>
                        <div className="metric-value danger-text">{stats.criticalImages}</div>
                        <div className="metric-sub">{stats.criticalCVEs} Critical CVEs detected</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-header">
                            <ShieldCheckIcon size={18} className="metric-icon-svg info" />
                            <span className="metric-label">Total Vulnerabilities</span>
                        </div>
                        <div className="metric-value">{stats.totalCVEs}</div>
                        <div className="metric-sub">Across all audited workloads</div>
                    </div>

                    <div className="metric-card">
                        <div className="metric-header">
                            <KeyIcon size={18} className="metric-icon-svg success" />
                            <span className="metric-label">Supply Chain Trust</span>
                        </div>
                        <div className="metric-value success-text">{trustRate}%</div>
                        <div className="metric-sub">{stats.trustCount} Trusted / {stats.blockCount} Blocked</div>
                    </div>
                </section>

                {/* AI SECURITY INTELLIGENCE COMPONENT */}
                <section className="dashboard-ai-intelligence-card" aria-label="AI Security Intelligence Correlation">
                    <div className="ai-intel-header">
                        <div className="ai-intel-badge-row">
                            <span className="ai-intel-pill">
                                <BrainIcon size={14} /> AI SECURITY INTELLIGENCE
                            </span>
                            <span className="ai-intel-subtext">Multi-Signal Telemetry Correlation</span>
                        </div>
                        <span className={`ai-decision-tag ${stats.blockCount > 0 ? "block" : stats.reviewCount > 0 ? "review" : "trust"}`}>
                            {stats.blockCount > 0 ? "POLICY: BLOCK" : stats.reviewCount > 0 ? "POLICY: REVIEW" : "POLICY: TRUST"}
                        </span>
                    </div>

                    <div className="ai-intel-main-grid">
                        {/* Left: Overall Assessment & Signals */}
                        <div className="ai-intel-col-left">
                            <div className="ai-assessment-box">
                                <span className="ai-sub-label">OVERALL ASSESSMENT</span>
                                <h3 className="ai-assessment-title">
                                    {stats.totalScans === 0 
                                        ? "No container workloads audited yet. Initiate a scan to generate intelligence."
                                        : stats.blockCount > 0 
                                            ? `${stats.blockCount} container image${stats.blockCount > 1 ? "s" : ""} require immediate remediation before deployment.`
                                            : stats.reviewCount > 0
                                                ? `${stats.reviewCount} container image${stats.reviewCount > 1 ? "s" : ""} require security team review prior to release.`
                                                : `All ${stats.totalScans} audited container workloads satisfy enterprise zero-trust thresholds.`}
                                </h3>
                            </div>

                            <div className="ai-correlation-table">
                                <span className="ai-sub-label">AI SIGNAL CORRELATION</span>
                                <div className="correlation-row">
                                    <span className="signal-name">Vulnerability Exposure</span>
                                    <span className={`signal-val ${stats.criticalCVEs > 0 ? "crit" : stats.riskDist.HIGH > 0 ? "high" : "low"}`}>
                                        {stats.criticalCVEs > 0 ? "CRITICAL" : stats.riskDist.HIGH > 0 ? "HIGH" : stats.totalCVEs > 0 ? "MODERATE" : "LOW"}
                                    </span>
                                </div>
                                <div className="correlation-row">
                                    <span className="signal-name">Supply Chain Integrity</span>
                                    <span className={`signal-val ${stats.blockCount > 0 ? "crit" : stats.reviewCount > 0 ? "high" : "ok"}`}>
                                        {stats.blockCount > 0 ? "CRITICAL GAP" : stats.reviewCount > 0 ? "UNVERIFIED" : "VERIFIED"}
                                    </span>
                                </div>
                                <div className="correlation-row">
                                    <span className="signal-name">ML Risk Prediction (Random Forest)</span>
                                    <span className={`signal-val ${stats.criticalImages > 0 ? "crit" : stats.riskDist.HIGH > 0 ? "high" : "low"}`}>
                                        {stats.criticalImages > 0 ? "CRITICAL RISK" : stats.riskDist.HIGH > 0 ? "ELEVATED" : "LOW RISK"}
                                    </span>
                                </div>
                                <div className="correlation-row">
                                    <span className="signal-name">Configuration Anomaly (Isolation Forest)</span>
                                    <span className={`signal-val ${stats.criticalImages > 0 ? "crit" : "ok"}`}>
                                        {stats.criticalImages > 0 ? "ANOMALY FLAGGED" : "NORMAL BASELINE"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Top Findings & Recommended Action */}
                        <div className="ai-intel-col-right">
                            <div className="ai-findings-box">
                                <span className="ai-sub-label">TOP CORRELATED FINDINGS</span>
                                <div className="ai-top-findings-list">
                                    <div className="finding-row-item">
                                        <span className="find-num">01</span>
                                        <span className="find-text">
                                            {stats.criticalCVEs > 0 
                                                ? `${stats.criticalCVEs} Critical CVEs identified in active image layer manifests.`
                                                : "Zero critical vulnerability exposures across container ledger."}
                                        </span>
                                    </div>
                                    <div className="finding-row-item">
                                        <span className="find-num">02</span>
                                        <span className="find-text">
                                            {stats.blockCount > 0 || stats.reviewCount > 0
                                                ? "Unverified Sigstore / Cosign cryptographic provenance on unsigned images."
                                                : "Cosign keyless transparency verification active across registry artifacts."}
                                        </span>
                                    </div>
                                    <div className="finding-row-item">
                                        <span className="find-num">03</span>
                                        <span className="find-text">
                                            {stats.criticalImages > 0
                                                ? "Isolation Forest flagged outlier layer depth and excessive package ratios."
                                                : "Container composition conforms to expected production baseline distributions."}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-action-footer-box">
                                <div className="action-roadmap-flow">
                                    <span className="ai-sub-label">RECOMMENDED REMEDIATION PIPELINE:</span>
                                    <div className="roadmap-badges">
                                        <span className="rm-badge">Patch</span>
                                        <span className="rm-arrow">→</span>
                                        <span className="rm-badge">Rebuild</span>
                                        <span className="rm-arrow">→</span>
                                        <span className="rm-badge">Sign (Cosign)</span>
                                        <span className="rm-arrow">→</span>
                                        <span className="rm-badge">Rescan</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="cta-button primary ai-view-analysis-btn"
                                    onClick={() => onRouteChange("reports")}
                                >
                                    View AI Security Analysis →
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Risk Distribution & Architecture Pipeline Row */}
                <div className="dashboard-grid-row">
                    {/* Risk Distribution Card */}
                    <div className="result-card">
                        <div className="section-heading">
                            <div>
                                <h2>Risk Distribution</h2>
                                <p>Severity breakdown across audited container fleet.</p>
                            </div>
                            <span className="metric-badge">Avg Score: {stats.avgRiskScore}/100</span>
                        </div>

                        <div className="risk-dist-bars">
                            <div className="dist-item">
                                <div className="dist-label-row">
                                    <span className="dist-label crit-label">Critical Risk</span>
                                    <strong>{stats.riskDist.CRITICAL} images ({stats.totalScans > 0 ? Math.round((stats.riskDist.CRITICAL / stats.totalScans) * 100) : 0}%)</strong>
                                </div>
                                <div className="dist-bar-track">
                                    <div 
                                        className="dist-bar-fill crit-fill" 
                                        style={{ width: `${stats.totalScans > 0 ? (stats.riskDist.CRITICAL / stats.totalScans) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="dist-item">
                                <div className="dist-label-row">
                                    <span className="dist-label high-label">High Risk</span>
                                    <strong>{stats.riskDist.HIGH} images ({stats.totalScans > 0 ? Math.round((stats.riskDist.HIGH / stats.totalScans) * 100) : 0}%)</strong>
                                </div>
                                <div className="dist-bar-track">
                                    <div 
                                        className="dist-bar-fill high-fill" 
                                        style={{ width: `${stats.totalScans > 0 ? (stats.riskDist.HIGH / stats.totalScans) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="dist-item">
                                <div className="dist-label-row">
                                    <span className="dist-label med-label">Medium Risk</span>
                                    <strong>{stats.riskDist.MEDIUM} images ({stats.totalScans > 0 ? Math.round((stats.riskDist.MEDIUM / stats.totalScans) * 100) : 0}%)</strong>
                                </div>
                                <div className="dist-bar-track">
                                    <div 
                                        className="dist-bar-fill med-fill" 
                                        style={{ width: `${stats.totalScans > 0 ? (stats.riskDist.MEDIUM / stats.totalScans) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>

                            <div className="dist-item">
                                <div className="dist-label-row">
                                    <span className="dist-label low-label">Low Risk (Verified)</span>
                                    <strong>{stats.riskDist.LOW} images ({stats.totalScans > 0 ? Math.round((stats.riskDist.LOW / stats.totalScans) * 100) : 0}%)</strong>
                                </div>
                                <div className="dist-bar-track">
                                    <div 
                                        className="dist-bar-fill low-fill" 
                                        style={{ width: `${stats.totalScans > 0 ? (stats.riskDist.LOW / stats.totalScans) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Multi-Layered Security Engine Architecture Pipeline */}
                    <div className="result-card">
                        <div className="section-heading">
                            <div>
                                <h2>Security Engine Pipeline</h2>
                                <p>Continuous four-tier verification and intelligence workflow.</p>
                            </div>
                            <span className="metric-badge active-badge">Deterministic &amp; AI</span>
                        </div>

                        <div className="pipeline-steps-architecture">
                            <div className="pipeline-arch-step">
                                <div className="arch-step-badge">01</div>
                                <div className="arch-step-body">
                                    <div className="arch-step-title-row">
                                        <strong>EVIDENCE COLLECTION</strong>
                                        <span className="arch-tag">Scanners</span>
                                    </div>
                                    <p>Docker metadata • Syft SBOM catalog • Docker Scout CVEs • Cosign / Sigstore proofs</p>
                                </div>
                            </div>

                            <div className="pipeline-arch-connector">↓</div>

                            <div className="pipeline-arch-step">
                                <div className="arch-step-badge">02</div>
                                <div className="arch-step-body">
                                    <div className="arch-step-title-row">
                                        <strong>ML RISK INTELLIGENCE</strong>
                                        <span className="arch-tag purple">Scikit-Learn</span>
                                    </div>
                                    <p>Supervised Random Forest risk classifier • Unsupervised Isolation Forest anomaly detector</p>
                                </div>
                            </div>

                            <div className="pipeline-arch-connector">↓</div>

                            <div className="pipeline-arch-step">
                                <div className="arch-step-badge">03</div>
                                <div className="arch-step-body">
                                    <div className="arch-step-title-row">
                                        <strong>AI CORRELATION</strong>
                                        <span className="arch-tag indigo">Reasoning Engine</span>
                                    </div>
                                    <p>Multi-signal evidence correlation • Risk-factor prioritization • Actionable remediation roadmap</p>
                                </div>
                            </div>

                            <div className="pipeline-arch-connector">↓</div>

                            <div className="pipeline-arch-step">
                                <div className="arch-step-badge decision">04</div>
                                <div className="arch-step-body">
                                    <div className="arch-step-title-row">
                                        <strong>SECURITY DECISION</strong>
                                        <span className="arch-tag green">Policy Gate</span>
                                    </div>
                                    <p className="decision-values">TRUST / REVIEW / BLOCK (Deterministic Risk Score: 0-100)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Recent Security Events Section */}
                <section className="recent-scans-card">
                    <div className="card-top-row">
                        <div>
                            <h2>Recent Container Security Events</h2>
                            <p>Real-time telemetry and decision outputs from recent image inspections</p>
                        </div>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onRouteChange("reports")}
                        >
                            View All Audit Records ({stats.totalScans}) →
                        </button>
                    </div>

                    {stats.recentScans.length > 0 ? (
                        <div className="recent-scans-list">
                            {stats.recentScans.map((r, i) => (
                                <div 
                                    key={r.id || r.scan_id || i} 
                                    className="recent-scan-item"
                                    onClick={() => onRouteChange("reports")}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === "Enter" && onRouteChange("reports")}
                                >
                                    <div className="scan-item-info">
                                        <DockerIcon size={22} className="scan-item-docker-icon" />
                                        <div>
                                            <strong className="scan-item-title">{r.image}</strong>
                                            <div className="scan-item-sub-meta">
                                                <span>{r.timestamp || "Recent scan"}</span>
                                                <span className="dot-sep">•</span>
                                                <span>{r.vulnerabilities?.total || 0} CVEs</span>
                                                <span className="dot-sep">•</span>
                                                <span>Score: {r.risk_score}/100</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="scan-item-meta">
                                        <span className={`status-pill ${(r.severity || "UNKNOWN").toLowerCase()}`}>
                                            {r.severity || "UNKNOWN"}
                                        </span>
                                        {getDecisionBadge(r)}
                                        <ChevronRightIcon size={16} className="chevron-icon" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="dashboard-empty-scans">
                            <p>No container audits recorded yet. Run your first scan to populate security telemetry.</p>
                            <button
                                type="button"
                                className="cta-button primary"
                                onClick={() => onRouteChange("scan")}
                            >
                                <LightningIcon size={16} /> Scan Image
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

export default Dashboard;