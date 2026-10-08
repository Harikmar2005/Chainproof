import { CheckCircleIcon, AlertTriangleIcon, XCircleIcon } from "./Icons";

function SecurityChecks({ result }) {
    if (!result) {
        return null;
    }

    const sbomPassed = result.sbom?.status === "PASS";
    const signatureVerified = result.signature?.verified;
    const vulnerabilityCount = result.vulnerabilities?.total || 0;
    const anomalyDetected = result.ml?.anomaly_detection?.anomaly;

    return (
        <div className="result-card">
            <h2>Security Verification Checks</h2>

            <div className="info-row">
                <span>SBOM Composition</span>
                <strong className={`status-text-badge ${sbomPassed ? "pass" : "fail"}`}>
                    {sbomPassed ? (
                        <>
                            <CheckCircleIcon size={14} /> PASSED
                        </>
                    ) : (
                        <>
                            <XCircleIcon size={14} /> FAILED
                        </>
                    )}
                </strong>
            </div>

            <div className="info-row">
                <span>Vulnerability Scanner</span>
                <strong className={`status-text-badge ${vulnerabilityCount > 0 ? "warn" : "pass"}`}>
                    {vulnerabilityCount > 0 ? (
                        <>
                            <AlertTriangleIcon size={14} /> {vulnerabilityCount} DETECTED
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon size={14} /> CLEAN
                        </>
                    )}
                </strong>
            </div>

            <div className="info-row">
                <span>Cryptographic Signature</span>
                <strong className={`status-text-badge ${signatureVerified ? "pass" : "fail"}`}>
                    {signatureVerified ? (
                        <>
                            <CheckCircleIcon size={14} /> VERIFIED
                        </>
                    ) : (
                        <>
                            <XCircleIcon size={14} /> UNVERIFIED
                        </>
                    )}
                </strong>
            </div>

            <div className="info-row">
                <span>ML Anomaly Detector</span>
                <strong className={`status-text-badge ${anomalyDetected ? "warn" : "pass"}`}>
                    {anomalyDetected ? (
                        <>
                            <AlertTriangleIcon size={14} /> ANOMALY FLAGGED
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon size={14} /> NORMAL
                        </>
                    )}
                </strong>
            </div>
        </div>
    );
}

export default SecurityChecks;