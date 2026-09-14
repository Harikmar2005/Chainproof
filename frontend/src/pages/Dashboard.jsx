import { useState } from "react";

import { scanImage } from "../services/api";

import RiskCard from "../components/RiskCard";
import VulnerabilityCards from "../components/VulnerabilityCards";
import MLAnalysis from "../components/MLAnalysis";
import SecurityChecks from "../components/SecurityChecks";
import VulnerabilityTable from "../components/VulnerabilityTable";
import RiskBreakdown from "../components/RiskBreakdown";
import VulnerabilityChart from "../components/VulnerabilityChart";

function Dashboard() {
    const [image, setImage] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ==========================================
    // START SCAN
    // ==========================================

    const handleScan = async () => {
        const imageName = image.trim();

        if (!imageName) {
            setError("Please enter a Docker image name.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);

            const data = await scanImage(imageName);

            setResult(data);
        } catch (err) {
            console.error("Scan error:", err);

            setError(
                err?.message ||
                "Unable to scan the container image."
            );
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // DASHBOARD
    // ==========================================

    return (
        <div className="dashboard">

            {/* ======================================
          HEADER
      ====================================== */}

            <header className="dashboard-header">

                <div>
                    <div className="brand">
                        🛡️ ChainProof
                    </div>

                    <h1>
                        Container Security Intelligence
                    </h1>

                    <p>
                        AI-powered software supply-chain security analysis
                    </p>
                </div>

                <div className="status-badge">
                    ● SYSTEM ONLINE
                </div>

            </header>


            {/* ======================================
          SCANNER
      ====================================== */}

            <section className="scanner-panel">

                <div className="scanner-title">

                    <h2>
                        Scan Container Image
                    </h2>

                    <p>
                        Analyze Docker images for vulnerabilities,
                        software composition, image integrity and
                        anomalous security profiles.
                    </p>

                </div>


                <div className="scanner-input">

                    <input
                        type="text"
                        value={image}
                        placeholder="Enter Docker image e.g. alpine:latest"
                        onChange={(event) =>
                            setImage(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                handleScan();
                            }
                        }}
                        disabled={loading}
                    />


                    <button
                        type="button"
                        onClick={handleScan}
                        disabled={loading}
                    >
                        {loading
                            ? "Scanning..."
                            : "🔍 Start Scan"}
                    </button>

                </div>


                {error && (
                    <div className="dashboard-error">
                        {error}
                    </div>
                )}

            </section>


            {/* ======================================
          LOADING
      ====================================== */}

            {loading && (
                <section className="dashboard-loading">

                    <div className="spinner"></div>

                    <h2>
                        Analyzing Container Image
                    </h2>

                    <p>
                        Running Docker inspection, SBOM generation,
                        vulnerability scanning, signature verification
                        and AI/ML analysis...
                    </p>

                </section>
            )}


            {/* ======================================
          RESULTS
      ====================================== */}

            {result && !loading && (

                <main className="dashboard-results">


                    {/* ==================================
              SCANNED IMAGE
          ================================== */}

                    <section className="image-banner">

                        <div>

                            <span>
                                SCANNED IMAGE
                            </span>

                            <h2>
                                {result.image || "Unknown Image"}
                            </h2>

                        </div>


                        <div className="scan-id">

                            <span>
                                SCAN ID
                            </span>

                            <strong>
                                {result.scan_id || "N/A"}
                            </strong>

                        </div>

                    </section>


                    {/* ==================================
              RISK SCORE
          ================================== */}

                    <RiskCard
                        result={result}
                    />


                    {/* ==================================
              RISK BREAKDOWN
          ================================== */}

                    <RiskBreakdown
                        risk={result.risk}
                    />


                    {/* ==================================
              VULNERABILITY SUMMARY
          ================================== */}

                    <VulnerabilityCards
                        vulnerabilities={
                            result.vulnerabilities
                        }
                    />


                    {/* ==================================
              VULNERABILITY CHART
          ================================== */}

                    <VulnerabilityChart
                        vulnerabilities={
                            result.vulnerabilities
                        }
                    />


                    {/* ==================================
              AI / ML ANALYSIS
          ================================== */}

                    <MLAnalysis
                        ml={result.ml}
                    />


                    {/* ==================================
              SECURITY CHECKS
          ================================== */}

                    <SecurityChecks
                        result={result}
                    />


                    {/* ==================================
              VULNERABILITY DETAILS
          ================================== */}

                    <VulnerabilityTable
                        vulnerabilities={
                            result.vulnerabilities?.vulnerabilities ||
                            []
                        }
                    />


                    {/* ==================================
              TECHNICAL INFORMATION
          ================================== */}

                    <section className="dashboard-three-column">


                        {/* ==================================
                DOCKER INFORMATION
            ================================== */}

                        <div className="result-card">

                            <h2>
                                Docker Image
                            </h2>


                            <div className="info-row">

                                <span>
                                    Image
                                </span>

                                <strong>
                                    {result.image || "N/A"}
                                </strong>

                            </div>


                            <div className="info-row">

                                <span>
                                    Image Size
                                </span>

                                <strong>

                                    {result.docker?.size_bytes
                                        ? `${(
                                            result.docker.size_bytes /
                                            (1024 * 1024)
                                        ).toFixed(2)} MB`
                                        : "N/A"}

                                </strong>

                            </div>


                            <div className="info-row">

                                <span>
                                    Layers
                                </span>

                                <strong>
                                    {result.docker?.layers_count ??
                                        "N/A"}
                                </strong>

                            </div>

                        </div>


                        {/* ==================================
                SBOM
            ================================== */}

                        <div className="result-card">

                            <h2>
                                Software Bill of Materials
                            </h2>


                            <div className="info-row">

                                <span>
                                    Status
                                </span>

                                <strong>
                                    {result.sbom?.status ||
                                        "N/A"}
                                </strong>

                            </div>


                            <div className="info-row">

                                <span>
                                    Packages
                                </span>

                                <strong>
                                    {result.sbom?.package_count ??
                                        0}
                                </strong>

                            </div>

                        </div>


                        {/* ==================================
                DIGITAL SIGNATURE
            ================================== */}

                        <div className="result-card">

                            <h2>
                                Image Integrity
                            </h2>


                            <div className="info-row">

                                <span>
                                    Signed
                                </span>

                                <strong>
                                    {result.signature?.signed
                                        ? "YES"
                                        : "NO"}
                                </strong>

                            </div>


                            <div className="info-row">

                                <span>
                                    Verified
                                </span>

                                <strong>
                                    {result.signature?.verified
                                        ? "VERIFIED"
                                        : "NOT VERIFIED"}
                                </strong>

                            </div>

                        </div>

                    </section>


                    {/* ==================================
              SECURITY FINDINGS
          ================================== */}

                    <section className="result-card">

                        <h2>
                            Security Findings
                        </h2>


                        <div className="findings-list">

                            {result.findings?.length > 0 ? (

                                result.findings.map(
                                    (finding, index) => (

                                        <div
                                            className="finding"
                                            key={`${finding.type}-${index}`}
                                        >

                                            <div>

                                                <strong>
                                                    {finding.type}
                                                </strong>

                                                <p>
                                                    {finding.message}
                                                </p>

                                            </div>


                                            <span>
                                                {finding.severity}
                                            </span>

                                        </div>

                                    )
                                )

                            ) : (

                                <p>
                                    No security findings detected.
                                </p>

                            )}

                        </div>

                    </section>


                </main>

            )}

        </div>
    );
}

export default Dashboard;