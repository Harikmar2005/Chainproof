import { LightningIcon, FileTextIcon } from "../components/Icons";

function Terms({ onRouteChange }) {
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
                        <FileTextIcon size={13} /> Platform Agreement
                    </span>
                    <h1>Terms and Conditions</h1>
                    <p className="legal-updated">Effective Date: October 2026 • Version 2.4 Enterprise</p>
                </div>

                <div className="legal-body">
                    <section className="legal-section">
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or utilizing the ChainProof container scanning platform (&ldquo;Service&rdquo;), you agree to be bound by these Terms and Conditions. If you disagree with any portion of these terms, you are prohibited from utilizing the Service.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>2. Permitted Use &amp; Authorized Auditing</h2>
                        <p>
                            You agree to submit only container image tags and digests for which you are the owner, authorized operator, or which reside in publicly accessible software repositories intended for public distribution. You may not:
                        </p>
                        <ul>
                            <li>Use the Service to stage denial-of-service (DoS) or automated brute-force attacks against container registries.</li>
                            <li>Attempt to exploit vulnerabilities discovered by ChainProof against external production systems.</li>
                            <li>Bypass client-side bot protection or API rate limits using malicious script automation.</li>
                        </ul>
                    </section>

                    <section className="legal-section">
                        <h2>3. Machine Learning Risk Scores Disclaimer</h2>
                        <p>
                            ChainProof incorporates machine learning classifiers (Random Forest &amp; Isolation Forest) to provide supply-chain risk scoring and anomaly detection. These risk scores are generated on a best-effort diagnostic basis and do not constitute a formal warranty against zero-day exploits or uncatalogued vulnerabilities.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>4. Intellectual Property &amp; Open Source</h2>
                        <p>
                            ChainProof integrates with industry standard open-source toolchains including Syft, Docker Scout, and Cosign. All proprietary algorithms, visual assets, trademarks, and user interface components remain the exclusive property of ChainProof.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>5. Limitation of Liability</h2>
                        <p>
                            In no event shall ChainProof, its developers, or contributors be held liable for any direct, indirect, incidental, or consequential damages arising out of the use or inability to use the scanner or scan report artifacts.
                        </p>
                    </section>

                    <section className="legal-section">
                        <h2>6. Modifications to Service</h2>
                        <p>
                            We reserve the right to modify, suspend, or improve the Service, scanner rulesets, or these terms at any time with prior notice reflected on this page.
                        </p>
                    </section>
                </div>

                <div className="legal-footer-cta">
                    <h3>Explore container risk analysis in action</h3>
                    <button 
                        type="button" 
                        className="cta-button primary"
                        onClick={() => onRouteChange("scan")}
                    >
                        <LightningIcon size={16} /> Start Security Audit
                    </button>
                </div>
            </div>
        </main>
    );
}

export default Terms;
