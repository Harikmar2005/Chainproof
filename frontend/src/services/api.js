const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export async function scanImage(image) {
    const response = await fetch(`${API_BASE_URL}/scan`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            image: image.trim(),
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || "Scan failed");
    }

    return await response.json();
}

export async function getReports() {
    const response = await fetch(`${API_BASE_URL}/reports`);

    if (!response.ok) {
        throw new Error("Failed to load reports");
    }

    return await response.json();
}

export async function clearReports() {
    const response = await fetch(`${API_BASE_URL}/reports`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to clear reports");
    }

    return await response.json();
}