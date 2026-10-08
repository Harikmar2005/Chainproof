import { useState, useEffect } from "react";
import { Analytics } from "../services/analytics";
import { LockIcon } from "./Icons";

function CookieConsent({ onRouteChange }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const consent = localStorage.getItem("chainproof_cookie_consent");
            if (!consent) {
                const timer = setTimeout(() => setVisible(true), 600);
                return () => clearTimeout(timer);
            }
        } catch {
            setVisible(false);
        }
    }, []);

    const handleAcceptAll = () => {
        try {
            localStorage.setItem("chainproof_cookie_consent", "accepted");
            Analytics.trackEvent("cookie_consent_accepted");
        } catch {}
        setVisible(false);
    };

    const handleEssentialOnly = () => {
        try {
            localStorage.setItem("chainproof_cookie_consent", "essential_only");
            Analytics.trackEvent("cookie_consent_essential");
        } catch {}
        setVisible(false);
    };

    const handleDecline = () => {
        try {
            localStorage.setItem("chainproof_cookie_consent", "declined");
        } catch {}
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <aside 
            className="cookie-consent-banner" 
            role="region" 
            aria-label="Cookie consent banner"
        >
            <div className="cookie-consent-container">
                <div className="cookie-icon-wrapper">
                    <LockIcon size={24} className="cookie-icon-svg" />
                </div>
                <div className="cookie-content">
                    <h4>Privacy &amp; Cookie Preferences</h4>
                    <p>
                        ChainProof uses strictly essential session tokens and privacy-friendly telemetry to ensure fast container scans, protect against automated bots, and evaluate platform reliability. No personal data is sold or shared. Read our{" "}
                        <button 
                            type="button" 
                            className="inline-link-btn" 
                            onClick={() => onRouteChange("privacy")}
                        >
                            Privacy Policy
                        </button>.
                    </p>
                </div>
                <div className="cookie-actions">
                    <button 
                        type="button" 
                        className="btn-cookie-secondary" 
                        onClick={handleEssentialOnly}
                    >
                        Essential Only
                    </button>
                    <button 
                        type="button" 
                        className="btn-cookie-primary" 
                        onClick={handleAcceptAll}
                    >
                        Accept All
                    </button>
                    <button 
                        type="button" 
                        className="btn-cookie-close" 
                        onClick={handleDecline}
                        aria-label="Decline and dismiss cookies"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default CookieConsent;
