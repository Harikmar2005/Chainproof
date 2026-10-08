import { useState, useEffect, useRef } from "react";
import { 
    GamepadIcon, 
    ShieldAlertIcon, 
    ShieldCheckIcon, 
    ShieldIcon, 
    KeyIcon, 
    PackageIcon, 
    CpuIcon, 
    BrainIcon, 
    AlertTriangleIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    TerminalIcon, 
    AwardIcon, 
    BugIcon, 
    RefreshCwIcon, 
    ChevronRightIcon, 
    ArrowLeftIcon,
    LightningIcon,
    DockerIcon
} from "../components/Icons";

function ChainBreak({ onRouteChange }) {
    // Game state: 'intro' | 'incident' | 'sbom' | 'trust' | 'ai' | 'containment' | 'victory' | 'defeat'
    const [stage, setStage] = useState("intro");
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [timerActive, setTimerActive] = useState(false);
    const [score, setScore] = useState(0);
    const [discoveredEvidence, setDiscoveredEvidence] = useState(new Set());
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [flaggedPackage, setFlaggedPackage] = useState(null);
    const [inspectedTrust, setInspectedTrust] = useState(false);
    const [aiCorrelating, setAiCorrelating] = useState(false);
    const [aiProgressStep, setAiProgressStep] = useState(0);
    const [finalDecision, setFinalDecision] = useState(null);
    const [inspectedCards, setInspectedCards] = useState(new Set());
    const [activeTabSbom, setActiveTabSbom] = useState("all");

    const timerRef = useRef(null);

    // Timer countdown effect
    useEffect(() => {
        if (timerActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setTimerActive(false);
                        setStage("defeat");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timerActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const startGame = () => {
        setStage("incident");
        setTimeLeft(300);
        setTimerActive(true);
        setScore(100);
        setDiscoveredEvidence(new Set(["alert"]));
        setInspectedCards(new Set());
        setSelectedPackage(null);
        setFlaggedPackage(null);
        setInspectedTrust(false);
        setAiCorrelating(false);
        setAiProgressStep(0);
        setFinalDecision(null);
    };

    const addEvidence = (evidenceId, xpGain = 50) => {
        if (!discoveredEvidence.has(evidenceId)) {
            setDiscoveredEvidence((prev) => new Set([...prev, evidenceId]));
            setScore((prev) => prev + xpGain);
        }
    };

    const handleInspectCard = (cardId) => {
        setInspectedCards((prev) => new Set([...prev, cardId]));
        if (cardId === "deploy_meta") addEvidence("deploy_meta", 75);
        if (cardId === "telemetry_alert") addEvidence("telemetry_alert", 75);
        if (cardId === "baseline_diff") addEvidence("baseline_diff", 75);
        if (cardId === "build_log") addEvidence("build_log", 75);
    };

    const handleSelectPackage = (pkg) => {
        setSelectedPackage(pkg);
        if (pkg.id === "unknown-lib") {
            addEvidence("suspicious_pkg", 100);
        }
    };

    const handleFlagPackage = (pkgId) => {
        setFlaggedPackage(pkgId);
        if (pkgId === "unknown-lib") {
            setScore((prev) => prev + 150);
        }
    };

    const handleInspectTrust = () => {
        setInspectedTrust(true);
        addEvidence("signature_gap", 150);
    };

    const startAiCorrelation = () => {
        setAiCorrelating(true);
        setAiProgressStep(1);
        setTimeout(() => setAiProgressStep(2), 600);
        setTimeout(() => setAiProgressStep(3), 1200);
        setTimeout(() => setAiProgressStep(4), 1800);
        setTimeout(() => {
            setAiCorrelating(false);
            addEvidence("ai_correlated", 150);
        }, 2400);
    };

    const handleFinalDecision = (decision) => {
        setFinalDecision(decision);
        setTimerActive(false);
        if (decision === "BLOCK") {
            const timeBonus = Math.floor(timeLeft * 1.5);
            setScore((prev) => prev + 250 + timeBonus);
            setStage("victory");
        } else {
            setStage("defeat");
        }
    };

    const getRank = (currentScore) => {
        if (currentScore >= 1000) return { title: "ChainProof Elite", color: "#818cf8" };
        if (currentScore >= 800) return { title: "Supply Chain Guardian", color: "#38bdf8" };
        if (currentScore >= 600) return { title: "Threat Hunter", color: "#34d399" };
        if (currentScore >= 300) return { title: "Security Analyst", color: "#fbbf24" };
        return { title: "Junior Analyst", color: "#94a3b8" };
    };

    const rank = getRank(score);

    // Packages in Stage 2
    const packagesList = [
        {
            id: "unknown-lib",
            name: "unknown-lib",
            version: "1.4.2",
            type: "npm",
            status: "SUSPICIOUS",
            introduced: "v2.4 (10 mins ago)",
            previous: "Not Present in v2.3",
            author: "anon_dev_99 (Account age: 2 days)",
            summary: "Obfuscated network helper sending serialized environment tokens to external endpoint http://198.51.100.42/exfil.",
            isBackdoor: true
        },
        {
            id: "telemetry-helper",
            name: "telemetry-helper",
            version: "0.9.1",
            type: "npm",
            status: "REVIEW",
            introduced: "v2.4",
            previous: "Not Present in v2.3",
            author: "metrics-team (Internal Corp)",
            summary: "Standard OpenTelemetry metrics exporter dependency. Clean signature.",
            isBackdoor: false
        },
        {
            id: "express",
            name: "express",
            version: "4.18.2",
            type: "npm",
            status: "CLEAN",
            introduced: "v1.0",
            previous: "4.18.2",
            author: "expressjs",
            summary: "Standard Node.js web application framework.",
            isBackdoor: false
        },
        {
            id: "jsonwebtoken",
            name: "jsonwebtoken",
            version: "9.0.2",
            type: "npm",
            status: "CLEAN",
            introduced: "v1.2",
            previous: "9.0.2",
            author: "auth0",
            summary: "JWT signing and verification library.",
            isBackdoor: false
        },
        {
            id: "pg",
            name: "pg",
            version: "8.11.3",
            type: "npm",
            status: "CLEAN",
            introduced: "v1.0",
            previous: "8.11.3",
            author: "brianc",
            summary: "PostgreSQL client for Node.js.",
            isBackdoor: false
        }
    ];

    const filteredPackages = activeTabSbom === "suspicious" 
        ? packagesList.filter(p => p.status !== "CLEAN")
        : packagesList;

    return (
        <main className="chainbreak-escape-room" id="main-content">
            {/* Top Tactical Bar */}
            <div className="chainbreak-top-bar">
                <div className="top-bar-inner">
                    <div className="top-bar-left">
                        <div className="game-logo-badge">
                            <GamepadIcon size={18} />
                            <span className="game-title">CHAINBREAK</span>
                            <span className="game-pill">ESCAPE ROOM</span>
                        </div>
                        <span className="game-target-tag">
                            TARGET: <strong className="mono-text">payments-api:v2.4</strong>
                        </span>
                    </div>

                    <div className="top-bar-right">
                        {stage !== "intro" && stage !== "victory" && stage !== "defeat" && (
                            <div className={`countdown-timer-box ${timeLeft < 60 ? "urgent" : ""}`}>
                                <span className="timer-label">TIME REMAINING</span>
                                <strong className="timer-val">{formatTime(timeLeft)}</strong>
                            </div>
                        )}

                        <div className="score-xp-badge">
                            <AwardIcon size={16} />
                            <span>{score} XP</span>
                        </div>

                        <div className="rank-indicator-pill" style={{ borderColor: rank.color, color: rank.color }}>
                            {rank.title}
                        </div>
                    </div>
                </div>
            </div>

            {/* Stepper Navigation (Stages 1-5) */}
            {stage !== "intro" && (
                <div className="chainbreak-stepper-container">
                    <div className="stepper-inner">
                        {[
                            { id: "incident", num: "01", label: "Incident Room" },
                            { id: "sbom", num: "02", label: "SBOM Diff" },
                            { id: "trust", num: "03", label: "Trust & Sigstore" },
                            { id: "ai", num: "04", label: "AI Correlation" },
                            { id: "containment", num: "05", label: "Containment" },
                        ].map((s, idx) => {
                            const stagesOrder = ["incident", "sbom", "trust", "ai", "containment"];
                            const currentIdx = stagesOrder.indexOf(stage);
                            const thisIdx = stagesOrder.indexOf(s.id);
                            const isDone = thisIdx < currentIdx || stage === "victory";
                            const isCurrent = stage === s.id;

                            return (
                                <div key={s.id} className={`step-node ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                                    <div className="step-circle">
                                        {isDone ? "✓" : s.num}
                                    </div>
                                    <span className="step-name">{s.label}</span>
                                    {idx < 4 && <div className="step-connector" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MAIN STAGE CONTENT CONTAINER */}
            <div className="chainbreak-main-container">
                {/* ---------------------------------------------------- */}
                {/* STAGE: INTRO / BRIEFING */}
                {/* ---------------------------------------------------- */}
                {stage === "intro" && (
                    <div className="briefing-terminal-card">
                        <div className="terminal-header-bar">
                            <span className="dot red"></span>
                            <span className="dot yellow"></span>
                            <span className="dot green"></span>
                            <span className="terminal-title">CHAINBREAK // INCIDENT RESPONSE TERMINAL</span>
                        </div>

                        <div className="briefing-content">
                            <div className="briefing-hero-badge">
                                <ShieldAlertIcon size={20} />
                                <span>CRITICAL SUPPLY CHAIN ALERT</span>
                            </div>

                            <h1 className="briefing-title">
                                Production Container Breach Alert: <br />
                                <span className="highlight-text">payments-api:v2.4</span>
                            </h1>

                            <div className="briefing-story-box">
                                <p>
                                    <strong>INCIDENT DISPATCH:</strong> 10 minutes ago, the automated production cluster deployed 
                                    container image <code>payments-api:v2.4</code>. An anomalous layer signature and unexpected package 
                                    behavior triggered a high-severity ChainProof telemetry alarm.
                                </p>
                                <p>
                                    As the Lead Security Engineer on duty, you have <strong>5 minutes</strong> to analyze the evidence, 
                                    inspect the SBOM diff, verify cryptographic provenance, correlate AI signals, and make the final containment decision.
                                </p>
                            </div>

                            <div className="mission-objectives-grid">
                                <div className="obj-card">
                                    <span className="obj-num">STAGE 01</span>
                                    <strong>Inspect Incident Room</strong>
                                    <p>Discover baseline anomalies and deployment clues.</p>
                                </div>
                                <div className="obj-card">
                                    <span className="obj-num">STAGE 02</span>
                                    <strong>Inspect Syft SBOM Diff</strong>
                                    <p>Identify the suspicious backdoored dependency.</p>
                                </div>
                                <div className="obj-card">
                                    <span className="obj-num">STAGE 03</span>
                                    <strong>Verify Cosign Trust</strong>
                                    <p>Examine Sigstore cryptographic provenance.</p>
                                </div>
                                <div className="obj-card">
                                    <span className="obj-num">STAGE 04</span>
                                    <strong>Run AI Correlation</strong>
                                    <p>Synthesize multi-signal threat intelligence.</p>
                                </div>
                                <div className="obj-card">
                                    <span className="obj-num">STAGE 05</span>
                                    <strong>Contain the Breach</strong>
                                    <p>Execute the authoritative policy gate decision.</p>
                                </div>
                            </div>

                            <div className="briefing-cta-row">
                                <button type="button" className="cta-button primary start-game-btn" onClick={startGame}>
                                    <LightningIcon size={18} /> ACCEPT MISSION &amp; ENTER INCIDENT ROOM
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => onRouteChange("dashboard")}>
                                    <ArrowLeftIcon size={14} /> Return to SOC Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STAGE 1: INCIDENT ROOM */}
                {/* ---------------------------------------------------- */}
                {stage === "incident" && (
                    <div className="stage-investigation-wrapper">
                        <div className="stage-header-row">
                            <div>
                                <span className="stage-tag">STAGE 01 // EVIDENCE COLLECTION</span>
                                <h2 className="stage-title">Production Incident Room</h2>
                                <p className="stage-subtitle">
                                    Click each evidence telemetry feed below to gather clues on container <code>payments-api:v2.4</code>.
                                </p>
                            </div>
                            <div className="evidence-counter-box">
                                <span>Evidence Clues Discovered:</span>
                                <strong>{inspectedCards.size} / 4</strong>
                            </div>
                        </div>

                        {/* 4 Interactive Evidence Cards */}
                        <div className="evidence-cards-grid">
                            {/* Card 1 */}
                            <div 
                                className={`evidence-inspect-card ${inspectedCards.has("deploy_meta") ? "inspected" : ""}`}
                                onClick={() => handleInspectCard("deploy_meta")}
                            >
                                <div className="card-top">
                                    <DockerIcon size={18} className="card-icon" />
                                    <span className="card-status-pill">{inspectedCards.has("deploy_meta") ? "INSPECTED" : "UNREAD"}</span>
                                </div>
                                <h4>Deployment Telemetry</h4>
                                <p className="card-desc">Cluster: <code>prod-us-east-1</code> • Deployed: 10 mins ago • Tag: <code>v2.4</code></p>
                                {inspectedCards.has("deploy_meta") && (
                                    <div className="clue-reveal-box">
                                        <CheckCircleIcon size={14} className="clue-icon" />
                                        <span><strong>Clue:</strong> Deployed directly from non-standard commit hash <code>#8f4c2e</code> bypassing main branch.</span>
                                    </div>
                                )}
                            </div>

                            {/* Card 2 */}
                            <div 
                                className={`evidence-inspect-card ${inspectedCards.has("telemetry_alert") ? "inspected" : ""}`}
                                onClick={() => handleInspectCard("telemetry_alert")}
                            >
                                <div className="card-top">
                                    <AlertTriangleIcon size={18} className="card-icon alert-icon" />
                                    <span className="card-status-pill">{inspectedCards.has("telemetry_alert") ? "INSPECTED" : "UNREAD"}</span>
                                </div>
                                <h4>Anomaly Alarm Log</h4>
                                <p className="card-desc">Layer size increased +18 MB. Unexpected outbound socket traffic initiated.</p>
                                {inspectedCards.has("telemetry_alert") && (
                                    <div className="clue-reveal-box alert">
                                        <CheckCircleIcon size={14} className="clue-icon" />
                                        <span><strong>Clue:</strong> Isolation Forest flagged outlier socket calls to IP <code>198.51.100.42</code>.</span>
                                    </div>
                                )}
                            </div>

                            {/* Card 3 */}
                            <div 
                                className={`evidence-inspect-card ${inspectedCards.has("baseline_diff") ? "inspected" : ""}`}
                                onClick={() => handleInspectCard("baseline_diff")}
                            >
                                <div className="card-top">
                                    <PackageIcon size={18} className="card-icon" />
                                    <span className="card-status-pill">{inspectedCards.has("baseline_diff") ? "INSPECTED" : "UNREAD"}</span>
                                </div>
                                <h4>Package Count Baseline</h4>
                                <p className="card-desc">v2.3 baseline: 135 packages. v2.4 image: 137 packages (+2 new dependencies).</p>
                                {inspectedCards.has("baseline_diff") && (
                                    <div className="clue-reveal-box">
                                        <CheckCircleIcon size={14} className="clue-icon" />
                                        <span><strong>Clue:</strong> 2 new libraries were introduced during the late-night build cycle.</span>
                                    </div>
                                )}
                            </div>

                            {/* Card 4 */}
                            <div 
                                className={`evidence-inspect-card ${inspectedCards.has("build_log") ? "inspected" : ""}`}
                                onClick={() => handleInspectCard("build_log")}
                            >
                                <div className="card-top">
                                    <TerminalIcon size={18} className="card-icon" />
                                    <span className="card-status-pill">{inspectedCards.has("build_log") ? "INSPECTED" : "UNREAD"}</span>
                                </div>
                                <h4>CI/CD Pipeline Attestation</h4>
                                <p className="card-desc">Build pipeline runner executed in unpinned ephemeral container environment.</p>
                                {inspectedCards.has("build_log") && (
                                    <div className="clue-reveal-box">
                                        <CheckCircleIcon size={14} className="clue-icon" />
                                        <span><strong>Clue:</strong> Cosign signature verification was bypassed with <code>--skip-verify</code>.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stage Progression Action */}
                        <div className="stage-action-bar">
                            <span className="action-hint">
                                {inspectedCards.size < 2 
                                    ? "Inspect at least 2 evidence cards to unlock the SBOM Diff investigation." 
                                    : "All initial evidence gathered. Proceed to SBOM package deep-dive."}
                            </span>
                            <button
                                type="button"
                                className="cta-button primary"
                                disabled={inspectedCards.size < 2}
                                onClick={() => {
                                    setStage("sbom");
                                    setScore(prev => prev + 50);
                                }}
                            >
                                Proceed to STAGE 02: SBOM Diff →
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STAGE 2: SBOM INVESTIGATION */}
                {/* ---------------------------------------------------- */}
                {stage === "sbom" && (
                    <div className="stage-investigation-wrapper">
                        <div className="stage-header-row">
                            <div>
                                <span className="stage-tag">STAGE 02 // SOFTWARE BILL OF MATERIALS</span>
                                <h2 className="stage-title">Syft SBOM Manifest Deep-Dive</h2>
                                <p className="stage-subtitle">
                                    137 packages cataloged. Compare dependencies against the trusted v2.3 baseline and flag the malicious injection.
                                </p>
                            </div>
                            <div className="sbom-filter-tabs">
                                <button
                                    type="button"
                                    className={`filter-tab ${activeTabSbom === "all" ? "active" : ""}`}
                                    onClick={() => setActiveTabSbom("all")}
                                >
                                    All Packages (137)
                                </button>
                                <button
                                    type="button"
                                    className={`filter-tab ${activeTabSbom === "suspicious" ? "active" : ""}`}
                                    onClick={() => setActiveTabSbom("suspicious")}
                                >
                                    Changed / New (2)
                                </button>
                            </div>
                        </div>

                        <div className="sbom-investigation-layout">
                            {/* Package List Table */}
                            <div className="sbom-packages-pane">
                                <div className="pane-title">Container Dependencies (Syft SPDX Catalog)</div>
                                <div className="packages-table-wrapper">
                                    <table className="sbom-table">
                                        <thead>
                                            <tr>
                                                <th>Package</th>
                                                <th>Version</th>
                                                <th>Status</th>
                                                <th>Introduced</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPackages.map((pkg) => (
                                                <tr
                                                    key={pkg.id}
                                                    className={`pkg-row ${selectedPackage?.id === pkg.id ? "selected" : ""} ${flaggedPackage === pkg.id ? "flagged" : ""}`}
                                                    onClick={() => handleSelectPackage(pkg)}
                                                >
                                                    <td className="pkg-name-cell">
                                                        <strong>{pkg.name}</strong>
                                                    </td>
                                                    <td className="mono-text">{pkg.version}</td>
                                                    <td>
                                                        <span className={`status-badge ${pkg.status.toLowerCase()}`}>
                                                            {pkg.status}
                                                        </span>
                                                    </td>
                                                    <td>{pkg.introduced}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Package Inspector Pane */}
                            <div className="package-inspector-pane">
                                {selectedPackage ? (
                                    <div className="inspector-card">
                                        <div className="inspector-header">
                                            <div>
                                                <span className="inspector-sub">PACKAGE TELEMETRY</span>
                                                <h3 className="inspector-title">{selectedPackage.name}</h3>
                                            </div>
                                            <span className={`status-badge ${selectedPackage.status.toLowerCase()}`}>
                                                {selectedPackage.status}
                                            </span>
                                        </div>

                                        <div className="inspector-field-grid">
                                            <div className="field-item">
                                                <span>Version:</span>
                                                <strong className="mono-text">{selectedPackage.version}</strong>
                                            </div>
                                            <div className="field-item">
                                                <span>Previous State:</span>
                                                <strong>{selectedPackage.previous}</strong>
                                            </div>
                                            <div className="field-item">
                                                <span>Author / Origin:</span>
                                                <strong>{selectedPackage.author}</strong>
                                            </div>
                                            <div className="field-item">
                                                <span>Introduced In:</span>
                                                <strong>{selectedPackage.introduced}</strong>
                                            </div>
                                        </div>

                                        <div className="inspector-summary-box">
                                            <span className="summary-label">Behavioral Telemetry Analysis:</span>
                                            <p>{selectedPackage.summary}</p>
                                        </div>

                                        {selectedPackage.isBackdoor ? (
                                            <div className="flag-action-box">
                                                <div className="flag-alert-text">
                                                    <BugIcon size={16} />
                                                    <span>Critical malicious behavior detected! Flag this dependency to isolate the compromise.</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`flag-btn ${flaggedPackage === selectedPackage.id ? "flagged-done" : ""}`}
                                                    onClick={() => handleFlagPackage(selectedPackage.id)}
                                                >
                                                    {flaggedPackage === selectedPackage.id ? "✓ FLAGGED AS MALICIOUS BACKDOOR" : "🚩 Flag as Malicious Dependency"}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flag-action-box clean">
                                                <span>Verified benign package. Keep inspecting other dependencies.</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="inspector-placeholder">
                                        <PackageIcon size={32} className="placeholder-icon" />
                                        <h4>Select a package from the SBOM list</h4>
                                        <p>Click any dependency on the left to inspect its version provenance and behavioral telemetry.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stage Progression Action */}
                        <div className="stage-action-bar">
                            <span className="action-hint">
                                {flaggedPackage === "unknown-lib"
                                    ? "Malicious package identified! Advance to cryptographic trust investigation."
                                    : "Investigate and flag the suspicious backdoor library to proceed."}
                            </span>
                            <button
                                type="button"
                                className="cta-button primary"
                                disabled={flaggedPackage !== "unknown-lib"}
                                onClick={() => {
                                    setStage("trust");
                                    setScore(prev => prev + 100);
                                }}
                            >
                                Proceed to STAGE 03: Trust &amp; Sigstore →
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STAGE 3: TRUST & PROVENANCE */}
                {/* ---------------------------------------------------- */}
                {stage === "trust" && (
                    <div className="stage-investigation-wrapper">
                        <div className="stage-header-row">
                            <div>
                                <span className="stage-tag">STAGE 03 // CRYPTOGRAPHIC PROVENANCE</span>
                                <h2 className="stage-title">Sigstore Cosign &amp; Rekor Verification</h2>
                                <p className="stage-subtitle">
                                    Correlate the suspicious dependency with image provenance and cryptographic signing state.
                                </p>
                            </div>
                        </div>

                        <div className="trust-investigation-grid">
                            <div className="trust-status-card fail">
                                <div className="trust-card-top">
                                    <KeyIcon size={22} className="trust-icon" />
                                    <span className="trust-badge-crit">SIGNATURE: NOT VERIFIED</span>
                                </div>
                                <h3>Container Image Signature Status</h3>
                                <p>Cosign cryptographic validation failed on digest <code>sha256:8f4c2e71...</code></p>
                                
                                <div className="trust-log-terminal">
                                    <div className="log-line warn">$ cosign verify --key cosign.pub payments-api:v2.4</div>
                                    <div className="log-line error">Error: no matching signatures found on remote registry</div>
                                    <div className="log-line info">Querying Rekor Transparency Log... [0 entries found]</div>
                                    <div className="log-line error">RESULT: UNVERIFIED ARTIFACT (TAMPER PROOF MISSING)</div>
                                </div>

                                <button
                                    type="button"
                                    className={`inspect-trust-btn ${inspectedTrust ? "done" : ""}`}
                                    onClick={handleInspectTrust}
                                >
                                    {inspectedTrust ? "✓ Provenance Failure Correlated (+150 XP)" : "Inspect Rekor Transparency Proofs"}
                                </button>
                            </div>

                            <div className="attack-path-correlation-card">
                                <h3>Supply Chain Attack Path Synthesis</h3>
                                <div className="attack-steps-flow">
                                    <div className="attack-node completed">
                                        <span className="node-num">01</span>
                                        <div>
                                            <strong>Malicious Package Injected</strong>
                                            <p>Dependency <code>unknown-lib@1.4.2</code> added to build.</p>
                                        </div>
                                    </div>
                                    <div className="node-arrow">↓</div>
                                    <div className={`attack-node ${inspectedTrust ? "completed" : "pending"}`}>
                                        <span className="node-num">02</span>
                                        <div>
                                            <strong>Unsigned Artifact Pushed</strong>
                                            <p>Attacker bypassed Cosign signing keypair in CI/CD.</p>
                                        </div>
                                    </div>
                                    <div className="node-arrow">↓</div>
                                    <div className="attack-node threat">
                                        <span className="node-num">03</span>
                                        <div>
                                            <strong>Production Deployment Risk</strong>
                                            <p>Backdoor actively listening in production cluster.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stage Progression Action */}
                        <div className="stage-action-bar">
                            <span className="action-hint">
                                {inspectedTrust
                                    ? "Provenance failure verified. Ready to run ChainProof AI Security Correlation."
                                    : "Inspect the Rekor transparency log output to unlock AI analysis."}
                            </span>
                            <button
                                type="button"
                                className="cta-button primary"
                                disabled={!inspectedTrust}
                                onClick={() => {
                                    setStage("ai");
                                    setScore(prev => prev + 100);
                                }}
                            >
                                Proceed to STAGE 04: AI Correlation Engine →
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STAGE 4: AI SECURITY ANALYSIS */}
                {/* ---------------------------------------------------- */}
                {stage === "ai" && (
                    <div className="stage-investigation-wrapper">
                        <div className="stage-header-row">
                            <div>
                                <span className="stage-tag">STAGE 04 // AI CORRELATION ENGINE</span>
                                <h2 className="stage-title">Multi-Signal Threat Intelligence Synthesis</h2>
                                <p className="stage-subtitle">
                                    ChainProof AI engine reasons across CVEs, SBOM diff, Cosign proofs, and ML models to generate the authoritative threat correlation.
                                </p>
                            </div>
                        </div>

                        <div className="ai-investigation-panel">
                            {!discoveredEvidence.has("ai_correlated") ? (
                                <div className="ai-trigger-box">
                                    <BrainIcon size={36} className="ai-pulse-center-icon" />
                                    <h3>Synthesize Collected Evidence Signals</h3>
                                    <p>Correlate <code>unknown-lib</code> telemetry, unsigned Cosign digest, and Isolation Forest socket anomalies.</p>
                                    <button
                                        type="button"
                                        className="cta-button primary start-ai-btn"
                                        onClick={startAiCorrelation}
                                        disabled={aiCorrelating}
                                    >
                                        <RefreshCwIcon size={16} className={aiCorrelating ? "spin-animation" : ""} />
                                        {aiCorrelating ? "Synthesizing Cross-Signal Telemetry..." : "Execute AI Multi-Signal Correlation"}
                                    </button>

                                    {aiCorrelating && (
                                        <div className="ai-correlating-steps">
                                            <span className={aiProgressStep >= 1 ? "done" : ""}>✓ Correlating Syft SBOM Package Diff</span>
                                            <span className={aiProgressStep >= 2 ? "done" : ""}>✓ Evaluating Cosign Attestation Ledger</span>
                                            <span className={aiProgressStep >= 3 ? "done" : ""}>✓ Processing Random Forest Risk Matrix</span>
                                            <span className={aiProgressStep >= 4 ? "done" : ""}>✓ Synthesizing Isolation Forest Anomaly Vectors</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="ai-verdict-display-card">
                                    <div className="ai-verdict-top">
                                        <div className="ai-badge-group">
                                            <span className="ai-pill">AI SECURITY CORRELATION ENGINE</span>
                                            <span className="confidence-pill">
                                                <ShieldCheckIcon size={13} /> 91% Correlation Confidence
                                            </span>
                                        </div>
                                        <span className="verdict-block-tag">RECOMMENDED DECISION: BLOCK</span>
                                    </div>

                                    <h3 className="ai-threat-heading">
                                        CORRELATED THREAT: Active Software Supply Chain Compromise
                                    </h3>
                                    <p className="ai-threat-desc">
                                        Independent security telemetry signals converge to confirm an unverified malicious dependency 
                                        (<code>unknown-lib@1.4.2</code>) coupled with missing cryptographic Sigstore provenance. 
                                        Random Forest classified risk as <strong>CRITICAL</strong> and Isolation Forest flagged abnormal socket exfiltration.
                                    </p>

                                    <div className="ai-signals-grid">
                                        <div className="signal-item crit">
                                            <span>SBOM Signal</span>
                                            <strong>Malicious Package (unknown-lib)</strong>
                                        </div>
                                        <div className="signal-item crit">
                                            <span>Provenance Signal</span>
                                            <strong>Unsigned Artifact (Cosign Failed)</strong>
                                        </div>
                                        <div className="signal-item crit">
                                            <span>ML Classification</span>
                                            <strong>Random Forest: CRITICAL (94%)</strong>
                                        </div>
                                        <div className="signal-item crit">
                                            <span>Anomaly Detector</span>
                                            <strong>Isolation Forest: Outlier Socket Traffic</strong>
                                        </div>
                                    </div>

                                    <div className="priority-finding-box">
                                        <strong>Priority Finding #1:</strong> Potential remote credential exfiltration backdoor introduced in production container layer.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stage Progression Action */}
                        <div className="stage-action-bar">
                            <span className="action-hint">
                                {discoveredEvidence.has("ai_correlated")
                                    ? "AI Correlation complete. Make the final operational containment decision!"
                                    : "Execute AI correlation above to synthesize findings."}
                            </span>
                            <button
                                type="button"
                                className="cta-button primary"
                                disabled={!discoveredEvidence.has("ai_correlated")}
                                onClick={() => {
                                    setStage("containment");
                                    setScore(prev => prev + 100);
                                }}
                            >
                                Proceed to FINAL STAGE: Containment Policy →
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* STAGE 5: CONTAINMENT DECISION */}
                {/* ---------------------------------------------------- */}
                {stage === "containment" && (
                    <div className="stage-investigation-wrapper">
                        <div className="stage-header-row">
                            <div>
                                <span className="stage-tag">FINAL STAGE // THREAT RESPONSE GATE</span>
                                <h2 className="stage-title">Operational Policy Decision</h2>
                                <p className="stage-subtitle">
                                    Container <code>payments-api:v2.4</code> is currently active in staging/canary. Choose the policy gate action:
                                </p>
                            </div>
                        </div>

                        <div className="containment-decision-grid">
                            {/* Option 1: TRUST */}
                            <div className="decision-choice-card trust" onClick={() => handleFinalDecision("TRUST")}>
                                <div className="choice-icon-box trust">
                                    <ShieldCheckIcon size={24} />
                                </div>
                                <h3>TRUST DEPLOYMENT</h3>
                                <p>Approve container for full 100% production rollout across all customer traffic.</p>
                                <span className="choice-action-btn trust">Select: TRUST (Approve)</span>
                            </div>

                            {/* Option 2: REVIEW */}
                            <div className="decision-choice-card review" onClick={() => handleFinalDecision("REVIEW")}>
                                <div className="choice-icon-box review">
                                    <ShieldIcon size={24} />
                                </div>
                                <h3>ALLOW WITH REVIEW</h3>
                                <p>Allow container to continue running in canary while logging non-critical warnings.</p>
                                <span className="choice-action-btn review">Select: REVIEW (Permit)</span>
                            </div>

                            {/* Option 3: BLOCK (CORRECT) */}
                            <div className="decision-choice-card block" onClick={() => handleFinalDecision("BLOCK")}>
                                <div className="choice-icon-box block">
                                    <ShieldAlertIcon size={24} />
                                </div>
                                <h3>BLOCK &amp; QUARANTINE</h3>
                                <p>Immediately block container deployment, revoke admission token, and trigger rollback to v2.3.</p>
                                <span className="choice-action-btn block">Select: BLOCK (Quarantine)</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* VICTORY SCREEN */}
                {/* ---------------------------------------------------- */}
                {stage === "victory" && (
                    <div className="game-result-card victory">
                        <div className="result-header">
                            <div className="victory-badge">
                                <AwardIcon size={32} />
                            </div>
                            <span className="result-status-tag">SYSTEM SECURED // THREAT CONTAINED</span>
                            <h1 className="result-title">Supply Chain Breach Successfully Neutralized</h1>
                            <p className="result-desc">
                                Outstanding investigation! You identified the backdoored dependency (<code>unknown-lib</code>), 
                                verified the cryptographic provenance failure, and enforced an immediate deployment block before production data could be compromised.
                            </p>
                        </div>

                        <div className="result-metrics-row">
                            <div className="res-stat-card">
                                <span>TOTAL SCORE</span>
                                <strong className="stat-xp">{score} XP</strong>
                            </div>
                            <div className="res-stat-card">
                                <span>OPERATIONAL RANK</span>
                                <strong className="stat-rank" style={{ color: rank.color }}>{rank.title}</strong>
                            </div>
                            <div className="res-stat-card">
                                <span>EVIDENCE DISCOVERED</span>
                                <strong>5 / 5 Clues</strong>
                            </div>
                            <div className="res-stat-card">
                                <span>TIME REMAINING</span>
                                <strong>{formatTime(timeLeft)}</strong>
                            </div>
                        </div>

                        <div className="post-mortem-checklist">
                            <h3>Incident Post-Mortem &amp; Defense Summary:</h3>
                            <ul>
                                <li>✓ <strong>Initial Alert:</strong> Detected unauthorized deployment bypassing main branch review.</li>
                                <li>✓ <strong>SBOM Isolation:</strong> Uncovered obfuscated backdoor <code>unknown-lib@1.4.2</code>.</li>
                                <li>✓ <strong>Provenance Proof:</strong> Verified missing Sigstore / Cosign cryptographic signature.</li>
                                <li>✓ <strong>AI Intelligence:</strong> Correlated multi-signal telemetry with 91% confidence.</li>
                                <li>✓ <strong>Zero-Trust Enforcement:</strong> Executed immediate policy gate block and cluster rollback.</li>
                            </ul>
                        </div>

                        <div className="result-actions-row">
                            <button type="button" className="cta-button primary" onClick={startGame}>
                                <RefreshCwIcon size={16} /> Play ChainBreak Again
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => onRouteChange("dashboard")}>
                                <ShieldCheckIcon size={16} /> Return to ChainProof SOC
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* DEFEAT SCREEN */}
                {/* ---------------------------------------------------- */}
                {stage === "defeat" && (
                    <div className="game-result-card defeat">
                        <div className="result-header">
                            <div className="defeat-badge">
                                <XCircleIcon size={32} />
                            </div>
                            <span className="result-status-tag red">BREACH COMPLETED // DEPLOYMENT FAILED</span>
                            <h1 className="result-title">
                                {timeLeft <= 0 ? "Investigation Time Expired" : "The Compromised Image Reached Production"}
                            </h1>
                            <p className="result-desc">
                                {timeLeft <= 0 
                                    ? "The 5-minute incident window elapsed before containment could be established. The backdoor payload exfiltrated production database tokens."
                                    : "Selecting TRUST or REVIEW allowed the malicious package 'unknown-lib' to execute in the live customer environment."}
                            </p>
                        </div>

                        <div className="post-mortem-checklist defeat">
                            <h3>Why BLOCK DEPLOYMENT Was Required:</h3>
                            <ul>
                                <li>⚠️ <strong>Malicious Payload:</strong> <code>unknown-lib</code> contained exfiltration socket hooks.</li>
                                <li>⚠️ <strong>Missing Cosign Signature:</strong> The image was unverified and bypassed tamper checks.</li>
                                <li>⚠️ <strong>Zero-Trust Mandate:</strong> Any unverified artifact with critical anomalies must be blocked.</li>
                            </ul>
                        </div>

                        <div className="result-actions-row">
                            <button type="button" className="cta-button primary" onClick={startGame}>
                                <RefreshCwIcon size={16} /> Retry Investigation
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => onRouteChange("dashboard")}>
                                <ArrowLeftIcon size={16} /> Return to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default ChainBreak;
