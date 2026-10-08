import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CookieConsent from "./components/CookieConsent";
import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Reports from "./pages/Reports";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Solutions from "./pages/Solutions";
import NotFound from "./pages/NotFound";
import { Analytics } from "./services/analytics";

function getRouteFromHash() {
    const hash = window.location.hash.replace(/^#\/?/, "").toLowerCase();
    if (!hash || hash === "" || hash === "dashboard") return "dashboard";
    if (hash === "scan") return "scan";
    if (hash === "reports" || hash === "history") return "reports";
    if (hash === "solutions" || hash === "solution") return "solutions";
    if (hash === "privacy" || hash === "privacy-policy") return "privacy";
    if (hash === "terms" || hash === "terms-and-conditions") return "terms";
    return "404";
}

function App() {
    const [route, setRoute] = useState(getRouteFromHash);
    const [presetImage, setPresetImage] = useState("");

    useEffect(() => {
        const handleHashChange = () => {
            const newRoute = getRouteFromHash();
            setRoute(newRoute);
            Analytics.trackPageView(newRoute);
        };

        window.addEventListener("hashchange", handleHashChange);
        Analytics.trackPageView(route);

        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    const navigateTo = (newRoute) => {
        window.location.hash = `#${newRoute}`;
        setRoute(newRoute);
        Analytics.trackPageView(newRoute);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleQuickScan = (image) => {
        setPresetImage(image);
        navigateTo("scan");
    };

    const renderCurrentPage = () => {
        switch (route) {
            case "dashboard":
                return <Dashboard onRouteChange={navigateTo} onQuickScan={handleQuickScan} />;
            case "scan":
                return <Scan onRouteChange={navigateTo} initialImage={presetImage} />;
            case "reports":
                return <Reports onRouteChange={navigateTo} />;
            case "solutions":
                return <Solutions onRouteChange={navigateTo} />;
            case "privacy":
                return <PrivacyPolicy onRouteChange={navigateTo} />;
            case "terms":
                return <Terms onRouteChange={navigateTo} />;
            default:
                return <NotFound onRouteChange={navigateTo} />;
        }
    };

    return (
        <div className="app-shell">
            {/* Global Sticky Navigation */}
            <Navbar currentRoute={route} onRouteChange={navigateTo} />

            {/* Main Application Content */}
            <div className="app-content-wrapper">
                {renderCurrentPage()}
            </div>

            {/* Global Footer */}
            <Footer onRouteChange={navigateTo} />

            {/* GDPR / Cookie Consent Banner */}
            <CookieConsent onRouteChange={navigateTo} />
        </div>
    );
}

export default App;