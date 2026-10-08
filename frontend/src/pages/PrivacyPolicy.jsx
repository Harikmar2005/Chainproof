import { LightningIcon, ShieldCheckIcon } from "../components/Icons";

function PrivacyPolicy({ onRouteChange }) {
    return (
        <main className="legal-page" id="main-content">
            <div className="legal-container">
                <div className="legal-header">
                    <button 
                        type="button" 
                        className="back-btn" 
                        onClick={() => onRouteChange("dashboard")}
                    >
                        ← Back to Dashboard
                    </button>
                    <span className="legal-badge">
                        <ShieldCheckIcon size={13} /> Security &amp; Transparency
                    </span>
                    <h1>Privacy Policy</h1>
                    <p className="legal-updated">Last Revised: October 2026 • Version 2.4 Enterprise</p>
                </div>

                <div className="legal-body">
                    <section className="legal-section">
                        <h2>1. Overview &amp; Commitment</h2>
                        <p>
                            At <strong>ChainProof Security Intelligence</strong>, we place utmost priority on the confidentiality and integrity of your infrastructure and development workflows. This Privacy Policy details the types of technical data collected during container audits and how we safeguard your supply chain assets.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>2. Information We Process</h2>
                        <p>
                            ChainProof operates on a <strong>minimal data retention</strong> philosophy. When you initiate a security scan, our system processes:
                        </p>
                        <ul>
                            <li><strong>Public Container Image Identifiers:</strong> The repository URI, tag, and digest submitted for inspection (e.g., <code>nginx:latest</code>).</li>
                            <li><strong>Static Software Metadata:</strong> Package names, layer manifests, SBOM records generated via Syft, and vulnerability identifiers (CVEs) queried from public registries.</li>
                            <li><strong>Cryptographic Proofs:</strong> Digital signature metadata verified against public Sigstore / Cosign keyrings.</li>
                            <li><strong>Telemetry &amp; Performance Metrics:</strong> Aggregate anonymized response latencies and scan success indicators for performance tuning.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2>3. Secrets &amp; Credentials Isolation</h2>
                        <p>
                            ChainProof strictly enforces a <strong>Zero Secrets on Frontend</strong> architecture. Container scans are executed in isolated backend sandboxes. We do not extract, store, or transmit proprietary source code files or embedded environment secrets contained within private filesystem layers.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>4. Cookie &amp; Storage Usage</h2>
                        <p>
                            We employ lightweight browser <code>localStorage</code> solely to preserve user UI preferences and your explicit cookie consent selection. No persistent third-party advertising cookies or cross-site tracking pixels are placed on your device.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>5. Data Security &amp; HTTPS Encryption</h2>
                        <p>
                            All interactions with the ChainProof API and frontend services are strictly enforced over encrypted <strong>Transport Layer Security (TLS 1.3 / HTTPS)</strong>. Data in transit is protected against interception, tampering, and replay attacks.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>6. Contact Us</h2>
                        <p>
                            For inquiries regarding security disclosure, audit log deletion, or privacy compliance, contact our security team at <code>security@chainproof.io</code>.
                        </p>
                    </section>
                </div>

                <div className="legal-footer-cta">
                    <h3>Ready to inspect your container security posture?</h3>
                    <button 
                        type="button" 
                        className="cta-button primary"
                        onClick={() => onRouteChange("scan")}
                    >
                        <LightningIcon size={16} /> Run Live Container Scan
                    </button>
                </div>
            </div>
        </main>
    );
}

export default PrivacyPolicy;
