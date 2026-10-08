import { LightningIcon, SearchIcon, AlertTriangleIcon } from "../components/Icons";

function NotFound({ onRouteChange }) {
    return (
        <main className="not-found-page" id="main-content">
            <div className="not-found-container">
                <div className="not-found-glitch">404</div>
                <div className="not-found-badge">
                    <AlertTriangleIcon size={14} /> RESOURCE NOT LOCATED
                </div>
                
                <h1>Resource Missing in Registry</h1>
                
                <p>
                    The page or security report endpoint you requested does not exist or has been relocated within the supply chain manifest.
                </p>

                <div className="not-found-actions">
                    <button 
                        type="button" 
                        className="cta-button primary"
                        onClick={() => onRouteChange("dashboard")}
                    >
                        <LightningIcon size={16} /> Return to Dashboard
                    </button>
                    <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => onRouteChange("scan")}
                    >
                        <SearchIcon size={16} /> Run Container Scan
                    </button>
                </div>

                <div className="not-found-quicklinks">
                    <span>Quick Navigation:</span>
                    <button type="button" onClick={() => onRouteChange("dashboard")}>Dashboard</button>
                    <span>•</span>
                    <button type="button" onClick={() => onRouteChange("scan")}>Live Scanner</button>
                    <span>•</span>
                    <button type="button" onClick={() => onRouteChange("reports")}>Reports</button>
                    <span>•</span>
                    <button type="button" onClick={() => onRouteChange("privacy")}>Privacy Policy</button>
                </div>
            </div>
        </main>
    );
}

export default NotFound;
