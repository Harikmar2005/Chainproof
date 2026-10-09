# ChainProof Platform Architecture

## Executive Overview

**ChainProof** is an enterprise cross-platform automated software supply-chain security platform. It provides continuous vulnerability detection, Software Bill of Materials (SBOM) generation, cryptographic container signature verification, dual machine-learning inference (Random Forest risk classifier + Isolation Forest anomaly detector), deterministic policy enforcement, and multi-signal AI security correlation.

---

## High-Level System Architecture

```text
                                  +-------------------------------------------------------+
                                  |                     CLIENT TIER                       |
                                  |                                                       |
                                  |   React Web (Vercel)   Tauri Desktop   Expo Mobile    |
                                  +-------------+----------------+---------------+--------+
                                                |                |               |
                                                | HTTPS          | HTTPS         | HTTPS
                                                v                v               v
                                  +-------------------------------------------------------+
                                  |             CHAINPROOF CLOUD SECURITY API             |
                                  |             (FastAPI on Linux VPS / VM)               |
                                  +---------------------------+---------------------------+
                                                              |
                               +------------------------------+------------------------------+
                               |                                                             |
                               v                                                             v
            +------------------------------------+                        +------------------------------------+
            |      CLOUD SCANNER SUBSYSTEM       |                        |    DESKTOP SCANNER AGENT (HOST)    |
            |                                    |                        |                                    |
            |   • Host Docker Daemon Engine      |                        |   • Local Host Docker Daemon       |
            |   • Anchore Syft (SBOM Gen)        |                        |   • Local Syft CLI                 |
            |   • Docker Scout (CVE Scanner)     |                        |   • Local Docker Scout CLI         |
            |   • Sigstore Cosign (Integrity)    |                        |   • Local Sigstore Cosign CLI      |
            +------------------+-----------------+                        +------------------+-----------------+
                               |                                                             |
                               +------------------------------+------------------------------+
                                                              |
                                                              v
                                  +-------------------------------------------------------+
                                  |               SECURITY & ML ENGINE                    |
                                  |                                                       |
                                  |   [Random Forest]     [Isolation Forest]      [AI]    |
                                  |      Classifier        Anomaly Detector    Correlation|
                                  |           \                   /               /       |
                                  |            +-----------------+---------------+        |
                                  |                              |                        |
                                  |                              v                        |
                                  |                  Deterministic Risk Engine            |
                                  |               (LOW: TRUST | MEDIUM: REVIEW            |
                                  |             HIGH: REVIEW/ALERT | CRITICAL: BLOCK)     |
                                  +-------------------------------------------------------+
                                                              |
                                  +---------------------------+---------------------------+
                                  |                AUTOMATION & SCHEDULER                 |
                                  |                                                       |
                                  |   • Background Cron Scheduler (/app/automation)       |
                                  |   • Registry Webhook Push Listeners (Docker/GHCR)     |
                                  |   • CI/CD Pipeline Policy Gates (GitHub/GitLab)       |
                                  |   • Notification Dispatcher (Push/Email/Webhook)      |
                                  +-------------------------------------------------------+
```

---

## Component Breakdown

### 1. Web Application (`frontend/`)
- **Framework**: React 19 + Vite 7.
- **Hosting**: Deployed to Vercel as a pure static single-page application (SPA).
- **Backend Communication**: Communicates with the Cloud Security API over secure HTTPS using the configured `VITE_API_URL` environment variable.
- **Separation of Concerns**: Never executes Docker or native scanner binaries inside Vercel serverless functions.

### 2. Desktop Application (`frontend/src-tauri/` & `desktop/agent/`)
- **Framework**: Tauri (Rust backend + React frontend).
- **Platforms**: Windows, macOS, and Linux.
- **Capabilities**:
  - Detects local Docker Engine.
  - Lists and monitors local container images.
  - Runs local scans completely offline using the **Desktop Local Scanner Agent**.
  - Automatically scans newly tagged or pulled image versions via Docker event listeners.
  - Emits native desktop notifications.
  - Opportunistically synchronizes offline scan batches with ChainProof Cloud.

### 3. Mobile Application (`mobile/`)
- **Framework**: React Native + Expo.
- **Platforms**: Android and iOS.
- **Role**: Secure mobile monitoring, control, and incident notification client.
- **Capabilities**:
  - Real-time security posture dashboard and average risk score telemetry.
  - On-demand remote scan dispatch to Cloud Docker daemon.
  - Drill-down vulnerability inspection, SBOM package exploration, and Cosign integrity status.
  - ML inference review (Random Forest probabilities + Isolation Forest anomaly status).
  - Automation schedule and registry watch list management.
  - Push notification alerts for Critical policy blocks.
- **Docker Requirement**: Mobile never runs Docker, Syft, Scout, or Cosign locally; all audits execute via the Cloud Security API over HTTPS.

### 4. Cloud Security API (`backend/`)
- **Framework**: FastAPI (Python 3.11/3.14 + Uvicorn ASGI).
- **Endpoints**:
  - `GET /api/v1/health`: System health and scanner tool availability.
  - `POST /api/v1/scan`: Synchronous full-pipeline container audit.
  - `GET /api/v1/reports`, `GET /api/v1/reports/{id}`, `DELETE /api/v1/reports`: Historical audit ledger.
  - `POST /api/v1/automations`, `GET /api/v1/automations`, `PUT /api/v1/automations/{id}`, `DELETE /api/v1/automations/{id}`, `POST /api/v1/automations/{id}/run`: Rule management.
  - `GET /api/v1/jobs`, `GET /api/v1/jobs/{id}`: Background automation job executions.
  - `GET /api/v1/monitored-images`, `POST /api/v1/monitored-images`, `DELETE /api/v1/monitored-images/{id}`: Registry monitoring.
  - `POST /api/v1/webhooks/registry`: Docker Hub, GHCR, Harbor push webhooks.
  - `POST /api/v1/webhooks/cicd`: Synchronous & asynchronous pipeline gates.
  - `POST /api/v1/notifications/devices`: Mobile/Desktop push token registration.
  - `POST /api/v1/agent/sync`: Desktop Local Scanner Agent offline sync.
  - `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `POST /api/v1/auth/keys`: Authentication & Agent API keys.

### 5. Multi-Signal Security & Risk Decision Engine
1. **Container Metadata**: Docker inspection extracting real byte sizes, layers count, architecture, and image digest.
2. **SBOM Generation**: Anchore Syft generates a complete package inventory across Alpine apk, Debian dpkg, RPM, npm, PyPI, and Go modules.
3. **Vulnerability Analysis**: Docker Scout extracts real CVEs, EPSS percentiles, CVSS v3 ratings, and fix recommendations formatted in SARIF.
4. **Cryptographic Integrity**: Sigstore Cosign checks for cryptographic signatures against configured public keys.
5. **Machine Learning Models**:
   - **Random Forest**: Evaluates a feature vector of 8 dimensions (`critical_cves`, `high_cves`, `medium_cves`, `low_cves`, `package_count`, `image_size_mb`, `is_signed`, `signature_verified`) to predict threat severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
   - **Isolation Forest**: Detects structural anomalies across the container profile.
6. **Deterministic Risk Action Matrix**:
   - `LOW` (Score < 25): `TRUST`
   - `MEDIUM` (Score 25–49): `REVIEW`
   - `HIGH` (Score 50–74): `REVIEW / ALERT`
   - `CRITICAL` (Score >= 75): `BLOCK / ALERT`
7. **AI Security Correlation Engine**: Synthesizes verified evidence into plain-text executive assessments and actionable remediation steps without hallucinating unverified CVEs.

---

## Docker Socket Security Architecture

> [!WARNING]
> Never expose the Docker daemon over unauthenticated TCP port `2375`. This permits root-level remote code execution on the host machine.

- **Production Scanner Host**: The FastAPI backend communicates with the local Docker daemon via the standard Unix socket file:
  ```text
  /var/run/docker.sock
  ```
- **File Permissions**: The Docker socket is owned by `root:docker` with mode `0660`. The backend service process runs under a dedicated service user belonging to the `docker` group or within a container that mounts `/var/run/docker.sock` explicitly.
- **Subprocess Security**: All external tool executions (`syft`, `docker scout`, `cosign`) strictly pass command arguments as distinct array vectors (`subprocess.run([binary, arg1, arg2], ...)`). `shell=True` is prohibited throughout the codebase. Image names are strictly validated against RFC 1123 / OCI regex patterns prior to invocation.
