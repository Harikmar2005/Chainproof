import { ShieldCheckIcon, LockIcon } from "./Icons";

function Footer({ onRouteChange }) {
    return (
        <footer className="app-footer">
            <div className="footer-container">
                <div className="footer-top">
                    {/* Brand column */}
                    <div className="footer-col brand-col">
                        <div className="footer-brand">
                            <img 
                                src="/favicon.svg" 
                                alt="ChainProof Logo" 
                                width="28" 
                                height="28" 
                            />
                            <span className="footer-brand-title">ChainProof</span>
                        </div>
                        <p className="footer-tagline">
                            Enterprise-grade container vulnerability analysis, SBOM verification, and AI-driven supply chain defense for modern DevOps.
                        </p>
                        <div className="security-status-tag">
                            <span className="status-indicator-dot"></span>
                            <span>All Systems Operational • SSL / HTTPS Enforced</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="footer-col">
                        <h3>Platform</h3>
                        <ul>
                            <li>
                                <button type="button" onClick={() => onRouteChange("dashboard")}>
                                    Dashboard
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onRouteChange("scan")}>
                                    Live Image Scanner
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onRouteChange("reports")}>
                                    Audit Reports
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onRouteChange("solutions")}>
                                    Enterprise Solutions
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Security Standards */}
                    <div className="footer-col">
                        <h3>Security Standards</h3>
                        <div className="badge-list">
                            <span className="tech-badge">Syft SBOM v1.0</span>
                            <span className="tech-badge">Docker Scout SARIF</span>
                            <span className="tech-badge">Cosign Sigstore</span>
                            <span className="tech-badge">Isolation Forest ML</span>
                        </div>
                    </div>

                    {/* Legal */}
                    <div className="footer-col">
                        <h3>Compliance &amp; Legal</h3>
                        <ul>
                            <li>
                                <button type="button" onClick={() => onRouteChange("privacy")}>
                                    Privacy Policy
                                </button>
                            </li>
                            <li>
                                <button type="button" onClick={() => onRouteChange("terms")}>
                                    Terms &amp; Conditions
                                </button>
                            </li>
                            <li>
                                <span className="footer-badge-clean">
                                    <ShieldCheckIcon size={14} /> Zero Data-Retention Mode
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p className="copyright-text">
                        &copy; {new Date().getFullYear()} ChainProof Security Intelligence. All rights reserved.
                    </p>
                    <div className="footer-legal-links">
                        <button type="button" onClick={() => onRouteChange("privacy")}>Privacy Policy</button>
                        <span>•</span>
                        <button type="button" onClick={() => onRouteChange("terms")}>Terms of Service</button>
                        <span>•</span>
                        <span className="https-secured-label">
                            <LockIcon size={13} /> TLS 1.3 / HTTPS Verified
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
