import { useState, useRef } from "react";
import { scanImage } from "../services/api";
import LoadingScanner from "../components/LoadingScanner";
import SecurityIntelligenceReport from "../components/SecurityIntelligenceReport";
import { 
    DockerIcon, 
    ShieldCheckIcon, 
    LightningIcon, 
    AlertTriangleIcon,
    FileTextIcon 
} from "../components/Icons";

const DOCKER_IMAGE_REGEX = /^[a-zA-Z0-9]+([._\/-][a-zA-Z0-9]+)*(:[a-zA-Z0-9._-]+)?(@sha256:[a-fA-F0-9]{64})?$/;

const SAMPLE_PRESETS = [
    { name: "alpine:latest", label: "Alpine Linux (Ultra-slim, Clean)" },
    { name: "nginx:alpine", label: "Nginx Alpine (Minimal Web Server)" },
    { name: "python:3.11-slim", label: "Python 3.11 Slim (Standard Base)" },
    { name: "bkimminich/juice-shop:latest", label: "Juice Shop (High Risk / Vulnerable)" },
];

function Scan({ onRouteChange, initialImage = "" }) {
    const [image, setImage] = useState(initialImage);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [honeypot, setHoneypot] = useState("");
    
    // Synchronous execution lock to completely prevent duplicate triggers from synthetic touch/click events
    const isScanningRef = useRef(false);
    const lastCompletedScanTimeRef = useRef(0);

    const validateImage = (input) => {
        const clean = input.trim();
        if (!clean) {
            return "Please specify a Docker image name to audit (e.g. alpine:latest, bkimminich/juice-shop:latest).";
        }
        if (clean.length > 255) {
            return "Image reference name exceeds maximum allowed length (255 characters).";
        }
        if (/[;&|><$`\\]/.test(clean)) {
            return "Invalid characters detected. Shell control characters are not permitted.";
        }
        if (!DOCKER_IMAGE_REGEX.test(clean)) {
            return "Invalid container format. Expected format like 'repository/image:tag' or 'image:tag'.";
        }
        return null;
    };

    const handleScan = async (overrideImage) => {
        // Immediate synchronous guard
        if (isScanningRef.current || loading) {
            return;
        }

        const targetImage = (overrideImage || image).trim();

        if (honeypot) {
            console.warn("Spam bot trap triggered.");
            return;
        }

        // Cooldown applies strictly between finished scans
        const now = Date.now();
        const elapsed = now - lastCompletedScanTimeRef.current;
        const cooldownMs = 1500;
        if (lastCompletedScanTimeRef.current > 0 && elapsed < cooldownMs) {
            const remaining = ((cooldownMs - elapsed) / 1000).toFixed(1);
            setError(`Please wait ${remaining}s before initiating another scan.`);
            return;
        }

        const validationError = validateImage(targetImage);
        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            isScanningRef.current = true;
            setLoading(true);
            setError("");
            setResult(null);

            const data = await scanImage(targetImage);
            setResult(data);
        } catch (err) {
            setError(err?.message || "Container scan failed. Ensure the image exists and Docker daemon is reachable.");
        } finally {
            lastCompletedScanTimeRef.current = Date.now();
            isScanningRef.current = false;
            setLoading(false);
        }
    };

    const handlePresetClick = (preset) => {
        if (isScanningRef.current || loading) return;
        setImage(preset);
        setError("");
        handleScan(preset);
    };

    const handleUpdateResult = (updatedData) => {
        setResult(updatedData);
    };

    return (
        <main className="scan-page" id="main-content">
            <div className="scan-container">
                {/* Header */}
                <div className="scan-header">
                    <div className="scan-tag">
                        <ShieldCheckIcon size={14} /> Real-Time Security Intelligence Audit
                    </div>
                    <h1>Container Security Scanner</h1>
                    <p>
                        Continuous multi-engine inspection correlating Syft SBOM composition, Docker Scout CVEs, 
                        Sigstore Cosign cryptographic provenance, and ML risk models.
                    </p>
                </div>

                {/* Scanner Input Panel */}
                <section className="scan-box" aria-label="Container Scan Form">
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleScan();
                        }}
                    >
                        <div style={{ display: "none" }} aria-hidden="true">
                            <input 
                                type="text" 
                                name="bot_honey_trap" 
                                tabIndex="-1" 
                                value={honeypot} 
                                onChange={(e) => setHoneypot(e.target.value)} 
                                autoComplete="off" 
                            />
                        </div>

                        <label htmlFor="docker-image-input">
                            Target Container Image reference:
                        </label>

                        <div className="scan-input-row">
                            <div className="input-with-icon">
                                <DockerIcon size={18} className="input-leading-icon-svg" />
                                <input
                                    id="docker-image-input"
                                    type="text"
                                    placeholder="e.g. alpine:latest, bkimminich/juice-shop:latest, python:3.11-slim"
                                    value={image}
                                    onChange={(e) => {
                                        const clean = e.target.value.replace(/[<>'"`&;|\\]/g, "").slice(0, 255);
                                        setImage(clean);
                                        if (error) setError("");
                                    }}
                                    disabled={loading}
                                    autoComplete="off"
                                    spellCheck="false"
                                    aria-required="true"
                                    aria-invalid={!!error}
                                />
                            </div>

                            <button
                                type="submit"
                                className="cta-button primary scan-cta-btn"
                                disabled={loading}
                                aria-label="Initiate container scan"
                            >
                                {loading ? (
                                    <span className="btn-loading-flex">
                                        <span className="btn-spinner"></span> Scanning Pipeline...
                                    </span>
                                ) : (
                                    <>
                                        <LightningIcon size={16} /> Start Security Audit
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Presets */}
                    <div className="presets-container">
                        <span className="presets-label">Benchmark Test Targets:</span>
                        <div className="preset-buttons">
                            {SAMPLE_PRESETS.map((p) => (
                                <button
                                    key={p.name}
                                    type="button"
                                    className={`preset-btn ${p.name.includes("juice") ? "preset-danger" : ""}`}
                                    onClick={() => handlePresetClick(p.name)}
                                    disabled={loading}
                                    title={p.label}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="scan-error-alert" role="alert">
                            <AlertTriangleIcon size={18} className="error-icon-svg" />
                            <div>
                                <strong>Scan Failed:</strong>
                                <p>{error}</p>
                            </div>
                        </div>
                    )}
                </section>

                {/* Loading Animation */}
                {loading && <LoadingScanner image={image} />}

                {/* Scan Results: Upgraded Professional Intelligence Report */}
                {result && !loading && (
                    <div className="scan-results-area">
                        <SecurityIntelligenceReport
                            reportData={result}
                            onUpdateReport={handleUpdateResult}
                        />

                        {/* Bottom Navigation CTA */}
                        <div className="scan-bottom-cta">
                            <button
                                type="button"
                                className="btn-secondary"
                                onClick={() => onRouteChange("reports")}
                            >
                                <FileTextIcon size={16} /> View Historical Audit Records →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

export default Scan;