# ChainProof Desktop Application Guide

## Architecture Overview

ChainProof Desktop provides developers and SecOps teams with native host container security on **Windows, macOS, and Linux**. It leverages **Tauri** (Rust backend + React frontend) paired with a dedicated **Desktop Local Scanner Agent**.

```text
+-----------------------------------------------------------+
|                  ChainProof Desktop GUI                   |
|                  (Tauri WebView + React)                  |
+-----------------------------+-----------------------------+
                              |
                     Local HTTP / IPC
                              |
                              v
+-----------------------------------------------------------+
|             Desktop Local Scanner Agent                   |
|             (desktop/agent/local_agent.py :8008)          |
|                                                           |
|   • Local Docker Daemon Connection (npipe:// or .sock)    |
|   • Local Syft CLI                                        |
|   • Local Docker Scout CLI                                |
|   • Local Cosign CLI                                      |
|   • Pre-trained Random Forest & Isolation Forest ML       |
|   • Local Offline Cache (offline_scans.json)              |
|   • Docker Event Listener (Tag & Pull auto-trigger)       |
+-----------------------------+-----------------------------+
                              |
                     Opportunistic Sync (HTTPS)
                              |
                              v
+-----------------------------------------------------------+
|             ChainProof Cloud API (Production)             |
+-----------------------------------------------------------+
```

---

## Separation of Concerns

1. **ChainProof Desktop UI**:
   - Renders the interactive security dashboard, image catalog, and real-time alerts.
   - Dispatches native system notifications via Tauri's OS notification APIs.
   - Never directly spawns raw shell commands; delegates all scanner operations to the Local Agent.

2. **Desktop Local Scanner Agent**:
   - Runs on `http://127.0.0.1:8008` as a lightweight background daemon.
   - Connects to the local Docker Engine socket (or Named Pipe `\\.\pipe\docker_cli` on Windows).
   - Generates SBOMs via Syft, scans CVEs with Docker Scout, verifies Cosign signatures, and evaluates machine-learning risk scores.
   - Automatically detects internet connectivity; operates completely offline and flushes queued scans to Cloud API via `POST /api/v1/agent/sync` upon reconnection.

---

## Desktop Capabilities

- **Detect Local Docker**: Instant verification of local Docker Engine connectivity, engine version, and OS platform.
- **List Local Images**: Inspects all locally cached container images with tags, byte sizes, and creation timestamps.
- **Offline Scanning**: Scans any locally pulled container image without needing an active internet connection or cloud API key.
- **Continuous Registry & Event Watcher**: Listens to the Docker daemon event stream (`client.events(filters={"type": "image", "event": ["tag", "pull"]})`). Automatically runs an audit whenever a monitored container tag is updated.
- **Scheduled Scans**: Runs automated recurring audits on local containers at specified intervals.
- **Cloud Synchronization**: Pushes offline results to the enterprise Cloud API ledger for centralized audit compliance.

---

## Running and Building the Desktop Application

### Prerequisites
1. Docker Desktop or Docker Engine running locally.
2. Syft CLI (`winget install Anchore.Syft` or `curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh`).
3. Cosign CLI (`winget install Sigstore.Cosign` or `curl -fsSL https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64`).
4. Docker Scout CLI plugin (`docker scout version`).
5. Node.js 18+ and Python 3.10+.
6. Rust & Cargo (required for building the native Tauri executable bundle).

---

### Step 1: Start the Desktop Local Scanner Agent

#### Windows:
```powershell
# From the project root
.\desktop\agent\run_agent.bat
# Or manually with the virtualenv:
.\backend\.venv\Scripts\python.exe desktop\agent\local_agent.py 8008
```

#### Linux / macOS:
```bash
chmod +x ./desktop/agent/run_agent.sh
./desktop/agent/run_agent.sh
```

The agent will initialize on `http://127.0.0.1:8008` and start the Docker event listener.

---

### Step 2: Run Desktop in Development Mode

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` or launch the Tauri development window:

```bash
cargo tauri dev
```

---

### Step 3: Compile Production Desktop Installer

```bash
cd frontend
cargo tauri build
```

This compiles optimized native platform installers:
- **Windows**: `.msi` and `.exe` (under `frontend/src-tauri/target/release/bundle/msi/`)
- **Linux**: `.deb` and `.AppImage`
- **macOS**: `.dmg` and `.app`
