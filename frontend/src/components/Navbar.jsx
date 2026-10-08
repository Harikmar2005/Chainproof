import { useState, useEffect } from "react";
import { BarChartIcon, SearchIcon, FileTextIcon, LightningIcon, LockIcon, ShieldCheckIcon } from "./Icons";

function Navbar({ currentRoute, onRouteChange }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const handleNav = (route) => {
        onRouteChange(route);
        setMobileMenuOpen(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <header className={`app-navbar ${scrolled ? "scrolled" : ""}`}>
            <div className="navbar-container">
                {/* Brand / Logo */}
                <div 
                    className="navbar-brand" 
                    onClick={() => handleNav("dashboard")}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && handleNav("dashboard")}
                    aria-label="ChainProof Home"
                >
                    <img 
                        src="/favicon.svg" 
                        alt="ChainProof Shield Logo" 
                        className="navbar-logo-img"
                        width="32"
                        height="32"
                    />
                    <span className="navbar-brand-name">
                        Chain<span className="brand-accent">Proof</span>
                    </span>
                    <span className="navbar-badge">Enterprise v2.4</span>
                </div>

                {/* Desktop Navigation */}
                <nav className="navbar-links" aria-label="Main Navigation">
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === "dashboard" ? "active" : ""}`}
                        onClick={() => handleNav("dashboard")}
                    >
                        <BarChartIcon size={16} /> Dashboard
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === "scan" ? "active" : ""}`}
                        onClick={() => handleNav("scan")}
                    >
                        <SearchIcon size={16} /> Live Scan
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === "reports" ? "active" : ""}`}
                        onClick={() => handleNav("reports")}
                    >
                        <FileTextIcon size={16} /> Audit Reports
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === "solutions" ? "active" : ""}`}
                        onClick={() => handleNav("solutions")}
                    >
                        <ShieldCheckIcon size={16} /> Solutions
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === "privacy" ? "active" : ""}`}
                        onClick={() => handleNav("privacy")}
                    >
                        Privacy
                    </button>
                    <button
                        type="button"
                        className={`nav-link ${currentRoute === "terms" ? "active" : ""}`}
                        onClick={() => handleNav("terms")}
                    >
                        Terms
                    </button>
                </nav>

                {/* Primary Call to Action */}
                <div className="navbar-actions">
                    <button
                        type="button"
                        className="cta-button primary"
                        onClick={() => handleNav("scan")}
                        aria-label="Scan a new container image now"
                    >
                        <LightningIcon size={16} /> Scan Container
                    </button>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        type="button"
                        className={`mobile-toggle ${mobileMenuOpen ? "open" : ""}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileMenuOpen}
                    >
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen && (
                <div className="mobile-drawer" role="dialog" aria-modal="true">
                    <div className="mobile-drawer-links">
                        <button
                            type="button"
                            className={`mobile-nav-link ${currentRoute === "dashboard" ? "active" : ""}`}
                            onClick={() => handleNav("dashboard")}
                        >
                            <BarChartIcon size={18} /> Security Dashboard
                        </button>
                        <button
                            type="button"
                            className={`mobile-nav-link ${currentRoute === "scan" ? "active" : ""}`}
                            onClick={() => handleNav("scan")}
                        >
                            <SearchIcon size={18} /> Interactive Scanner
                        </button>
                        <button
                            type="button"
                            className={`mobile-nav-link ${currentRoute === "reports" ? "active" : ""}`}
                            onClick={() => handleNav("reports")}
                        >
                            <FileTextIcon size={18} /> Scan Reports &amp; History
                        </button>
                        <button
                            type="button"
                            className={`mobile-nav-link ${currentRoute === "solutions" ? "active" : ""}`}
                            onClick={() => handleNav("solutions")}
                        >
                            <ShieldCheckIcon size={18} /> Enterprise Solutions
                        </button>
                        <div className="drawer-divider" />
                        <button
                            type="button"
                            className={`mobile-nav-link ${currentRoute === "privacy" ? "active" : ""}`}
                            onClick={() => handleNav("privacy")}
                        >
                            <LockIcon size={18} /> Privacy Policy
                        </button>
                        <button
                            type="button"
                            className={`mobile-nav-link ${currentRoute === "terms" ? "active" : ""}`}
                            onClick={() => handleNav("terms")}
                        >
                            <FileTextIcon size={18} /> Terms &amp; Conditions
                        </button>
                        <button
                            type="button"
                            className="mobile-cta-btn"
                            onClick={() => handleNav("scan")}
                        >
                            <LightningIcon size={18} /> Start Security Scan
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
}

export default Navbar;
