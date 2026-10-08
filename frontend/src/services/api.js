import { Analytics } from "./analytics";

/**
 * Resolve API Base URL from environment variables:
 * Supports VITE_API_URL or VITE_API_BASE_URL with fallback to local development.
 * Normalizes trailing slashes and ensures /api/v1 route prefix.
 */
function resolveApiBaseUrl() {
    const raw = (
        import.meta.env.VITE_API_URL || 
        import.meta.env.VITE_API_BASE_URL || 
        "http://127.0.0.1:8000"
    ).trim();

    const stripped = raw.replace(/\/+$/, "");
    if (!stripped) {
        return "http://127.0.0.1:8000/api/v1";
    }
    if (stripped.endsWith("/api/v1")) {
        return stripped;
    }
    return `${stripped}/api/v1`;
}

export const API_BASE_URL = resolveApiBaseUrl();

// Non-sensitive debug logging in development
if (import.meta.env.DEV) {
    console.debug(`[ChainProof API] Configured endpoint: ${API_BASE_URL}`);
}

/**
 * Format network errors into clear actionable diagnostic messages
 */
function handleNetworkError(err, actionContext = "operation") {
    if (err instanceof TypeError && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError") || err.message.includes("Load failed"))) {
        return new Error(
            `Unable to reach ChainProof Security API at (${API_BASE_URL}). ` +
            `Please ensure the FastAPI backend is running and accessible.`
        );
    }
    return err;
}

/**
 * Scan Docker container image
 */
export async function scanImage(image) {
    const cleanImage = image.trim();
    
    Analytics.trackEvent("scan_initiated", { image: cleanImage });

    let response;
    try {
        response = await fetch(`${API_BASE_URL}/scan`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                image: cleanImage,
            }),
        });
    } catch (networkErr) {
        const enhancedErr = handleNetworkError(networkErr, "Container scan");
        Analytics.trackEvent("scan_failed", { image: cleanImage, error: enhancedErr.message });
        throw enhancedErr;
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message = error.detail || `Scan request failed with HTTP ${response.status}`;
        Analytics.trackEvent("scan_failed", { image: cleanImage, error: message });
        throw new Error(message);
    }

    const data = await response.json();
    Analytics.trackEvent("scan_completed", { 
        image: cleanImage, 
        riskScore: data.risk_score,
        severity: data.severity 
    });
    return data;
}

/**
 * Fetch historical scan reports
 */
export async function getReports() {
    let response;
    try {
        response = await fetch(`${API_BASE_URL}/reports`);
    } catch (networkErr) {
        throw handleNetworkError(networkErr, "Load reports");
    }

    if (!response.ok) {
        throw new Error("Failed to load scan reports from backend");
    }

    return await response.json();
}

/**
 * Clear scan history reports
 */
export async function clearReports() {
    Analytics.trackEvent("reports_cleared");

    let response;
    try {
        response = await fetch(`${API_BASE_URL}/reports`, {
            method: "DELETE",
        });
    } catch (networkErr) {
        throw handleNetworkError(networkErr, "Clear reports");
    }

    if (!response.ok) {
        throw new Error("Failed to clear scan history");
    }

    return await response.json();
}

/**
 * Request on-demand AI Security Analysis for an existing scan result
 */
export async function analyzeScan(scanData) {
    Analytics.trackEvent("ai_analysis_requested", { image: scanData?.image });

    let response;
    try {
        response = await fetch(`${API_BASE_URL}/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(scanData),
        });
    } catch (networkErr) {
        throw handleNetworkError(networkErr, "AI analysis");
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const message = error.detail || `AI analysis request failed with HTTP ${response.status}`;
        throw new Error(message);
    }

    const data = await response.json();
    Analytics.trackEvent("ai_analysis_completed", { 
        image: scanData?.image,
        decision: data.security_decision
    });
    return data;
}