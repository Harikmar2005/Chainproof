import { useState } from "react";
import { scanImage } from "../services/api";

function Scan() {
    const [image, setImage] = useState("");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleScan = async () => {
        if (!image.trim()) {
            setError("Please enter a Docker image name.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setResult(null);

            const data = await scanImage(image);

            setResult(data);
        } catch (err) {
            setError(err.message || "Scan failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="scan-page">
            <div className="scan-container">

                {/* Header */}
                <div className="scan-header">
                    <h1>Container Security Scanner</h1>

                    <p>
                        Analyze a Docker image using vulnerability scanning,
                        SBOM analysis, digital signature verification and AI/ML.
                    </p>
                </div>

                {/* Scan Input */}
                <div className="scan-box">

                    <label htmlFor="docker-image">
                        Docker Image
                    </label>

                    <div className="scan-input-row">

                        <input
                            id="docker-image"
                            type="text"
                            placeholder="Example: alpine:latest"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleScan();
                                }
                            }}
                            disabled={loading}
                        />

                        <button
                            onClick={handleScan}
                            disabled={loading}
                        >
                            {loading ? "Scanning..." : "Start Scan"}
                        </button>

                    </div>

                    <div className="scan-example">
                        Try: <strong>alpine:latest</strong>
                    </div>

                </div>

                {/* Loading */}
                {loading && (
                    <div className="scan-loading">
                        <div className="spinner"></div>

                        <h2>Scanning Container Image</h2>

                        <p>
                            Running Docker, SBOM, vulnerability, signature
                            and AI/ML analysis...
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="scan-error">
                        <strong>Scan Error</strong>
                        <p>{error}</p>
                    </div>
                )}

                {/* Result */}
                {result && !loading && (
                    <div className="scan-result">

                        {/* Risk */}
                        <div className="result-card risk-result">

                            <h2>Security Risk</h2>

                            <div className="risk-score">
                                {result.risk_score}
                            </div>

                            <div className="risk-severity">
                                {result.severity}
                            </div>

                            <div className="risk-verdict">
                                {result.verdict}
                            </div>

                        </div>

                        {/* Image Information */}
                        <div className="result-card">

                            <h2>Container Information</h2>

                            <div className="info-row">
                                <span>Image</span>
                                <strong>{result.image}</strong>
                            </div>

                            {result.docker && (
                                <>
                                    <div className="info-row">
                                        <span>Image Size</span>
                                        <strong>
                                            {(
                                                result.docker.size_bytes /
                                                (1024 * 1024)
                                            ).toFixed(2)} MB
                                        </strong>
                                    </div>

                                    <div className="info-row">
                                        <span>Layers</span>
                                        <strong>
                                            {result.docker.layers_count}
                                        </strong>
                                    </div>
                                </>
                            )}

                        </div>

                        {/* Vulnerabilities */}
                        {result.vulnerabilities && (
                            <div className="result-card">

                                <h2>Vulnerabilities</h2>

                                <div className="vulnerability-grid">

                                    <div className="vulnerability critical">
                                        <span>Critical</span>
                                        <strong>
                                            {result.vulnerabilities.critical}
                                        </strong>
                                    </div>

                                    <div className="vulnerability high">
                                        <span>High</span>
                                        <strong>
                                            {result.vulnerabilities.high}
                                        </strong>
                                    </div>

                                    <div className="vulnerability medium">
                                        <span>Medium</span>
                                        <strong>
                                            {result.vulnerabilities.medium}
                                        </strong>
                                    </div>

                                    <div className="vulnerability low">
                                        <span>Low</span>
                                        <strong>
                                            {result.vulnerabilities.low}
                                        </strong>
                                    </div>

                                </div>

                                <div className="total-vulnerabilities">
                                    Total vulnerabilities:{" "}
                                    <strong>
                                        {result.vulnerabilities.total}
                                    </strong>
                                </div>

                            </div>
                        )}

                        {/* AI / ML */}
                        {result.ml && (
                            <div className="result-card">

                                <h2>AI Security Analysis</h2>

                                <div className="ml-section">

                                    <div className="ml-card">
                                        <h3>Random Forest</h3>

                                        <div className="ml-row">
                                            <span>Prediction</span>
                                            <strong>
                                                {result.ml.random_forest?.prediction || "N/A"}
                                            </strong>
                                        </div>

                                        <div className="ml-row">
                                            <span>Confidence</span>
                                            <strong>
                                                {result.ml.random_forest
                                                    ? `${(
                                                        result.ml.random_forest.confidence *
                                                        100
                                                    ).toFixed(0)}%`
                                                    : "N/A"}
                                            </strong>
                                        </div>

                                        <div className="ml-row">
                                            <span>Model</span>
                                            <strong>
                                                {result.ml.random_forest?.model_loaded
                                                    ? "Loaded"
                                                    : "Not Loaded"}
                                            </strong>
                                        </div>

                                    </div>

                                    <div className="ml-card">
                                        <h3>Isolation Forest</h3>

                                        <div className="ml-row">
                                            <span>Anomaly</span>
                                            <strong>
                                                {result.ml.anomaly_detection?.anomaly
                                                    ? "Detected"
                                                    : "Normal"}
                                            </strong>
                                        </div>

                                        <div className="ml-row">
                                            <span>Anomaly Score</span>
                                            <strong>
                                                {result.ml.anomaly_detection?.score ?? "N/A"}
                                            </strong>
                                        </div>

                                        <div className="ml-row">
                                            <span>Model</span>
                                            <strong>
                                                {result.ml.anomaly_detection?.model_loaded
                                                    ? "Loaded"
                                                    : "Not Loaded"}
                                            </strong>
                                        </div>

                                    </div>

                                </div>

                            </div>
                        )}

                        {/* SBOM */}
                        {result.sbom && (
                            <div className="result-card">

                                <h2>Software Bill of Materials</h2>

                                <div className="info-row">
                                    <span>Status</span>
                                    <strong>{result.sbom.status}</strong>
                                </div>

                                <div className="info-row">
                                    <span>Packages</span>
                                    <strong>{result.sbom.package_count}</strong>
                                </div>

                            </div>
                        )}

                        {/* Signature */}
                        {result.signature && (
                            <div className="result-card">

                                <h2>Digital Signature</h2>

                                <div className="info-row">
                                    <span>Signed</span>
                                    <strong>
                                        {result.signature.signed
                                            ? "Yes"
                                            : "No"}
                                    </strong>
                                </div>

                                <div className="info-row">
                                    <span>Verified</span>
                                    <strong>
                                        {result.signature.verified
                                            ? "Verified"
                                            : "Not Verified"}
                                    </strong>
                                </div>

                            </div>
                        )}

                        {/* Findings */}
                        {result.findings &&
                            result.findings.length > 0 && (
                                <div className="result-card">

                                    <h2>Security Findings</h2>

                                    <div className="findings-list">

                                        {result.findings.map((finding, index) => (
                                            <div
                                                className="finding"
                                                key={index}
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
                                        ))}

                                    </div>

                                </div>
                            )}

                    </div>
                )}

            </div>
        </div>
    );
}

export default Scan;