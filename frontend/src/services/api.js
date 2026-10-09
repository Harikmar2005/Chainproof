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
 * Retrieve authorization headers from secure local storage
 */
export function getAuthHeaders() {
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    };
    try {
        const token = localStorage.getItem("chainproof_token");
        const apiKey = localStorage.getItem("chainproof_api_key");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        } else if (apiKey) {
            headers["X-API-Key"] = apiKey;
        }
    } catch (_) {}
    return headers;
}

export async function loginUser(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Authentication failed");
    }
    const data = await res.json();
    if (data.access_token) {
        localStorage.setItem("chainproof_token", data.access_token);
        localStorage.setItem("chainproof_user", JSON.stringify(data.user));
    }
    return data;
}

export function logoutUser() {
    try {
        localStorage.removeItem("chainproof_token");
        localStorage.removeItem("chainproof_user");
    } catch (_) {}
}

export function getStoredUser() {
    try {
        const raw = localStorage.getItem("chainproof_user");
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
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
            headers: getAuthHeaders(),
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

/**
 * Fetch automation rules
 */
export async function getAutomations() {
    const res = await fetch(`${API_BASE_URL}/automations`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load automations");
    return await res.json();
}

/**
 * Trigger an automation run on-demand
 */
export async function triggerAutomationRun(id) {
    const res = await fetch(`${API_BASE_URL}/automations/${id}/run`, { 
        method: "POST", 
        headers: getAuthHeaders() 
    });
    if (!res.ok) throw new Error("Failed to trigger automation run");
    return await res.json();
}

/**
 * Fetch background job execution history
 */
export async function getJobs(limit = 50) {
    const res = await fetch(`${API_BASE_URL}/jobs?limit=${limit}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load jobs");
    return await res.json();
}

/**
 * Fetch security notifications
 */
export async function getNotifications(limit = 50) {
    const res = await fetch(`${API_BASE_URL}/notifications?limit=${limit}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load notifications");
    return await res.json();
}

/**
 * Fetch monitored container images
 */
export async function getMonitoredImages() {
    const res = await fetch(`${API_BASE_URL}/monitored-images`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error("Failed to load monitored images");
    return await res.json();
}

/**
 * Add a monitored container image
 */
export async function addMonitoredImage(data) {
    const res = await fetch(`${API_BASE_URL}/monitored-images`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to add monitored image");
    return await res.json();
}

/**
 * Delete a monitored container image
 */
export async function deleteMonitoredImage(id) {
    const res = await fetch(`${API_BASE_URL}/monitored-images/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete monitored image");
    return await res.json();
}

/**
 * Check backend system health and tool diagnostics
 */
export async function getSystemHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error("Failed to check health");
    return await res.json();
}