# ChainProof Automation & Policy Engine Guide

## Architecture Overview

The ChainProof Automation Engine (`backend/app/automation/`) automates supply-chain security audits, continuous registry monitoring, and CI/CD quality gates.

```text
                                  TRIGGERS
       +----------------------------------------------------------------+
       |  SCHEDULE  |  NEW_IMAGE_VERSION  |  MANUAL  |  WEBHOOK  | CI/CD|
       +-------------------------------+--------------------------------+
                                       |
                                       v
                         +----------------------------+
                         |     Automation Engine      |
                         |  (engine.py / scheduler.py)|
                         +-------------+--------------+
                                       |
                         +-------------v--------------+
                         |   Full Scan Pipeline       |
                         |  Docker • Syft • Scout     |
                         |  Cosign • RF • IsoForest   |
                         +-------------+--------------+
                                       |
                         +-------------v--------------+
                         |  Deterministic Risk Action |
                         |   LOW      -> TRUST        |
                         |   MEDIUM   -> REVIEW       |
                         |   HIGH     -> REVIEW/ALERT |
                         |   CRITICAL -> BLOCK/ALERT  |
                         +-------------+--------------+
                                       |
                                    ACTIONS
       +----------------------------------------------------------------+
       | SCAN_IMAGE | GENERATE_REPORT | NOTIFICATION | BLOCK | WEBHOOK  |
       +----------------------------------------------------------------+
```

---

## Supported Triggers

| Trigger | Description | Trigger Method |
|---|---|---|
| `SCHEDULE` | Periodic cron / time-of-day execution | Automated background loop in `scheduler.py` (e.g. `"02:00"` UTC) |
| `NEW_IMAGE_VERSION` | Fired when a new container tag or digest is published | Registry push webhooks (`POST /api/v1/webhooks/registry`) or Desktop Docker event watcher |
| `MANUAL` | Triggered on-demand by security operators via Web, Desktop, or Mobile | `POST /api/v1/automations/{id}/run` |
| `WEBHOOK` | Generic HTTP trigger from external tools | Incoming payload to `/api/v1/webhooks/registry` |
| `CI/CD` | Fired during software build and deployment pipelines | Incoming payload to `POST /api/v1/webhooks/cicd` |

---

## Supported Actions

| Action | Behavior |
|---|---|
| `SCAN_IMAGE` | Pulls container image, runs full Docker + Syft + Scout + Cosign + ML + AI pipeline, and saves to ledger. |
| `GENERATE_REPORT` | Compiles detailed compliance and CVE summary into the persistent audit reports collection. |
| `SEND_NOTIFICATION` | Dispatches security alert across Desktop, Mobile Push, Email, and Webhook channels. |
| `BLOCK_DEPLOYMENT` | Synchronously evaluates risk gate; returns HTTP 200 with `"blocked": true` if Critical severity or score >= 75 is detected. |
| `WEBHOOK` | Sends HTTP POST alert payload to configured external endpoint (`CHAINPROOF_WEBHOOK_URL`). |

---

## Deterministic Risk Action Matrix

ChainProof enforces strict policy decisions based on verified telemetry:

| Risk Level | Score Range | Action | Policy Decision |
|---|---|---|---|
| **LOW** | 0 – 24 | `TRUST` | Workload passes security gate. Continuous monitoring maintained. |
| **MEDIUM** | 25 – 49 | `REVIEW` | Non-blocking advisory. Security team notified for scheduled review. |
| **HIGH** | 50 – 74 | `REVIEW / ALERT` | Security warning emitted across notification channels. Requires triage. |
| **CRITICAL** | 75 – 100 | `BLOCK / ALERT` | Deployment BLOCKED. Critical CVE, unsigned binary, or exploit risk detected. |

> [!NOTE]
> AI never overrides the deterministic risk score. AI synthesizes and explains the verified findings.

---

## Concrete Automation Rule Examples

### Example 1: Production Nightly Vulnerability Audit
```json
{
  "name": "Production Nightly Vulnerability Audit",
  "trigger": "SCHEDULE",
  "schedule": "02:00",
  "targets": [
    "alpine:latest",
    "nginx:alpine",
    "python:3.11-slim"
  ],
  "action": "SCAN_IMAGE",
  "enabled": true,
  "tags": ["production", "nightly", "cve"]
}
```

### Example 2: Container Registry Push Listener
```json
{
  "name": "GHCR / Docker Hub Production Image Monitor",
  "trigger": "NEW_IMAGE_VERSION",
  "target": "ghcr.io/company/backend:latest",
  "action": "SCAN_IMAGE",
  "enabled": true,
  "tags": ["registry", "webhook", "cicd"]
}
```

### Example 3: CI/CD Pull Request Quality Gate
```json
{
  "name": "Pull Request Security Gate",
  "trigger": "CI/CD",
  "action": "BLOCK_DEPLOYMENT",
  "enabled": true,
  "tags": ["github-actions", "gate"]
}
```

---

## Automation API Endpoints

- `GET /api/v1/automations`: List all active automation rules.
- `POST /api/v1/automations`: Create a new automation rule.
- `GET /api/v1/automations/{id}`: Retrieve details of a specific rule.
- `PUT /api/v1/automations/{id}`: Update an automation rule.
- `DELETE /api/v1/automations/{id}`: Delete an automation rule.
- `POST /api/v1/automations/{id}/run`: Immediately execute an automation rule on-demand.
- `GET /api/v1/jobs`: Query historical job logs and policy decisions.
- `GET /api/v1/jobs/{id}`: Query detailed execution logs for a single job.
