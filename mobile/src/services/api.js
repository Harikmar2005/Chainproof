/**
 * ChainProof Mobile Cloud API Client
 * Secure HTTPS communication with ChainProof Cloud Security Backend
 */

let API_URL = "http://10.0.2.2:8000/api/v1"; // Default Android Emulator host (or configure via Settings)

export const setApiUrl = (url) => {
    API_URL = url.replace(/\/+$/, "");
    if (!API_URL.endsWith("/api/v1")) {
        API_URL += "/api/v1";
    }
};

export const getApiUrl = () => API_URL;

async function request(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers
    };

    try {
        const response = await fetch(url, { ...options, headers });
        if (!response.ok) {
            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.detail || `HTTP Error ${response.status}`);
        }
        return await response.json();
    } catch (err) {
        console.warn(`[Mobile API] Request to ${url} failed:`, err.message);
        throw err;
    }
}

export const MobileAPI = {
    checkHealth: () => request("/health"),
    getReports: () => request("/reports"),
    getReport: (id) => request(`/reports/${id}`),
    triggerScan: (image) => request("/scan", {
        method: "POST",
        body: JSON.stringify({ image: image.trim() })
    }),
    getAutomations: () => request("/automations"),
    runAutomation: (id) => request(`/automations/${id}/run`, { method: "POST" }),
    getJobs: () => request("/jobs"),
    getNotifications: () => request("/notifications"),
    getMonitoredImages: () => request("/monitored-images"),
    addMonitoredImage: (payload) => request("/monitored-images", {
        method: "POST",
        body: JSON.stringify(payload)
    }),
    deleteMonitoredImage: (id) => request(`/monitored-images/${id}`, { method: "DELETE" }),
    registerDevice: (token, deviceName = "Mobile Device", platform = "MOBILE") => 
        request("/notifications/devices", {
            method: "POST",
            body: JSON.stringify({ token, device_name: deviceName, platform })
        })
};
