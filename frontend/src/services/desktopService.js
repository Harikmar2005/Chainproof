/**
 * ChainProof Desktop Service
 * Interacts with the Desktop Local Scanner Agent (http://127.0.0.1:8008)
 * and Tauri Desktop runtime for host Docker inspection, offline scanning, and cloud sync.
 */

const LOCAL_AGENT_URL = "http://127.0.0.1:8008";

export const DesktopService = {
    /**
     * Check if Desktop Local Scanner Agent is running locally on the user's workstation.
     */
    async isAgentAvailable() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1500);
            const res = await fetch(`${LOCAL_AGENT_URL}/api/agent/status`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return res.ok;
        } catch {
            return false;
        }
    },

    /**
     * Get detailed status of the local Docker daemon, Syft, Scout, Cosign, and pending offline scans.
     */
    async getStatus() {
        const res = await fetch(`${LOCAL_AGENT_URL}/api/agent/status`);
        if (!res.ok) throw new Error("Could not connect to Desktop Local Agent");
        return await res.json();
    },

    /**
     * Discover locally cached Docker images on this machine.
     */
    async getLocalImages() {
        const res = await fetch(`${LOCAL_AGENT_URL}/api/agent/images`);
        if (!res.ok) throw new Error("Failed to list local Docker images");
        return await res.json();
    },

    /**
     * Trigger a local container scan via the Desktop Local Scanner Agent.
     * Operates completely offline without requiring active cloud connection.
     */
    async scanLocalImage(image) {
        const res = await fetch(`${LOCAL_AGENT_URL}/api/agent/scan`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Local scan failed with HTTP ${res.status}`);
        }
        return await res.json();
    },

    /**
     * Retrieve offline scan history stored on the desktop.
     */
    async getOfflineScans() {
        const res = await fetch(`${LOCAL_AGENT_URL}/api/agent/offline-scans`);
        if (!res.ok) return [];
        return await res.json();
    },

    /**
     * Synchronize offline scan queue to the central ChainProof Cloud API.
     */
    async syncWithCloud() {
        const res = await fetch(`${LOCAL_AGENT_URL}/api/agent/sync`, { method: "POST" });
        if (!res.ok) throw new Error("Synchronization with Cloud failed.");
        return await res.json();
    },

    /**
     * Update watched local images for automatic scanning on new tag/pull.
     */
    async setMonitoredImages(images) {
        const res = await fetch(`${LOCAL_AGENT_URL}/api/agent/monitored`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ images })
        });
        return await res.json();
    },

    /**
     * Dispatch native desktop notification via Tauri or Browser Notification API.
     */
    showNotification(title, message) {
        if (window.__TAURI__ && window.__TAURI__.invoke) {
            window.__TAURI__.invoke("notify_desktop", { title, body: message }).catch(() => {});
        } else if ("Notification" in window && Notification.permission === "granted") {
            new Notification(`ChainProof: ${title}`, { body: message });
        }
    }
};
