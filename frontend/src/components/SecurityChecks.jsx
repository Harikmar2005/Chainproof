function SecurityChecks({ result }) {
    if (!result) {
        return null;
    }

    const sbomPassed = result.sbom?.status === "PASS";
    const signatureVerified = result.signature?.verified;
    const vulnerabilityCount =
        result.vulnerabilities?.total || 0;

    const anomalyDetected =
        result.ml?.anomaly_detection?.anomaly;

    return (
        <div className="result-card">

            <h2>Security Checks</h2>

            <div className="info-row">
                <span>SBOM Analysis</span>
                <strong>
                    {sbomPassed ? "✓ PASSED" : "✕ FAILED"}
                </strong>
            </div>

            <div className="info-row">
                <span>Vulnerability Scan</span>
                <strong>
                    {vulnerabilityCount > 0
                        ? `⚠ ${vulnerabilityCount} FOUND`
                        : "✓ CLEAN"}
                </strong>
            </div>

            <div className="info-row">
                <span>Digital Signature</span>
                <strong>
                    {signatureVerified
                        ? "✓ VERIFIED"
                        : "✕ NOT VERIFIED"}
                </strong>
            </div>

            <div className="info-row">
                <span>Anomaly Detection</span>
                <strong>
                    {anomalyDetected
                        ? "⚠ ANOMALY"
                        : "✓ NORMAL"}
                </strong>
            </div>

        </div>
    );
}

export default SecurityChecks;