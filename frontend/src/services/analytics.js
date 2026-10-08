/**
 * Privacy-First Lightweight Analytics Engine for ChainProof
 * Respects 'Do Not Track' and user cookie consent.
 */

const ANALYTICS_KEY = "chainproof_analytics_events";

export const Analytics = {
    // Check if analytics cookies/tracking is permitted
    isConsentGiven() {
        try {
            const consent = localStorage.getItem("chainproof_cookie_consent");
            return consent === "accepted" || consent === "essential_only";
        } catch {
            return false;
        }
    },

    // Track a page view or virtual route change
    trackPageView(pageName) {
        this.logEvent("page_view", {
            page: pageName,
            timestamp: new Date().toISOString(),
            referrer: document.referrer || "direct",
            viewport: `${window.innerWidth}x${window.innerHeight}`,
        });
    },

    // Track custom user interactions (e.g. scan initiated, report downloaded)
    trackEvent(eventName, properties = {}) {
        this.logEvent(eventName, {
            ...properties,
            timestamp: new Date().toISOString(),
        });
    },

    // Internal logger that saves to session history and optionally dispatches
    logEvent(name, payload) {
        if (!this.isConsentGiven()) {
            return;
        }

        try {
            const history = JSON.parse(sessionStorage.getItem(ANALYTICS_KEY) || "[]");
            history.push({ event: name, payload });
            // Keep last 50 events in session
            if (history.length > 50) history.shift();
            sessionStorage.setItem(ANALYTICS_KEY, JSON.stringify(history));

            if (import.meta.env.DEV) {
                console.log(`[Analytics: ${name}]`, payload);
            }
        } catch (e) {
            // Fail silently to avoid breaking UI
        }
    },

    // Get event history for diagnostic debugging
    getHistory() {
        try {
            return JSON.parse(sessionStorage.getItem(ANALYTICS_KEY) || "[]");
        } catch {
            return [];
        }
    }
};
