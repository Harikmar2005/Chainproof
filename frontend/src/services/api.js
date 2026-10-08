import { Analytics } from "./analytics";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

/**
 * Scan Docker container image
 */
export async function scanImage(image) {
    const cleanImage = image.trim();
    
    Analytics.trackEvent("scan_initiated", { image: cleanImage });

    const response = await fetch(`${API_BASE_URL}/scan`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            image: cleanImage,
        }),
    });

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
    const response = await fetch(`${API_BASE_URL}/reports`);

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

    const response = await fetch(`${API_BASE_URL}/reports`, {
        method: "DELETE",
    });

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

    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(scanData),
    });

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