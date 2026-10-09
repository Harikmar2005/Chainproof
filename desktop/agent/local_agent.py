"""
ChainProof Desktop Local Scanner Agent
Runs locally on Windows, macOS, or Linux alongside the ChainProof Desktop application.
Provides safe local interface to interact with local Docker daemon, Syft, Scout, Cosign, and ML models.
Operates offline for local container scanning and synchronizes results with ChainProof Cloud when online.
"""

import json
import logging
import os
import sys
import threading
import time
import uuid
import urllib.request
import urllib.error
from datetime import datetime
from typing import Dict, Any, List, Optional

# Ensure project root / backend is in sys.path so we can reuse the deterministic engines
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.docker_service import check_docker_health, list_local_images, ensure_image, validate_image_name
from app.services.sbom_service import generate_sbom, check_syft_health
from app.services.vulnerability_service import scan_vulnerabilities, check_scout_health
from app.services.signature_service import verify_signature, check_cosign_health
from app.services.scan_orchestrator import perform_scan
from app.api.reports import make_json_safe

logging.basicConfig(level=logging.INFO, format="%(asctime)s [DESKTOP-AGENT] %(levelname)s: %(message)s")
logger = logging.getLogger("chainproof.desktop_agent")

OFFLINE_CACHE_FILE = os.path.join(CURRENT_DIR, "offline_scans.json")
MONITORED_LOCAL_FILE = os.path.join(CURRENT_DIR, "monitored_local.json")
AGENT_CONFIG_FILE = os.path.join(CURRENT_DIR, "agent_config.json")

_cache_lock = threading.Lock()


class DesktopScannerAgent:
    """Agent orchestrating local scans, offline storage, event watching, and cloud sync."""

    def __init__(self):
        self.agent_id = f"agent-{uuid.uuid4().hex[:8]}"
        self.cloud_url = os.getenv("CHAINPROOF_CLOUD_URL", "http://127.0.0.1:8000/api/v1")
        self.api_key = os.getenv("CHAINPROOF_AGENT_KEY", "")
        self.is_running = False
        self._watcher_thread = None
        self._sync_thread = None
        self._load_config()

    def _load_config(self):
        if os.path.exists(AGENT_CONFIG_FILE):
            try:
                with open(AGENT_CONFIG_FILE, "r", encoding="utf-8") as f:
                    cfg = json.load(f)
                    self.cloud_url = cfg.get("cloud_url", self.cloud_url)
                    self.api_key = cfg.get("api_key", self.api_key)
                    if "agent_id" in cfg:
                        self.agent_id = cfg["agent_id"]
            except Exception as e:
                logger.warning(f"Could not load agent_config.json: {e}")

    def save_config(self, cloud_url: str = None, api_key: str = None):
        if cloud_url:
            self.cloud_url = cloud_url.rstrip("/")
        if api_key is not None:
            self.api_key = api_key
        with open(AGENT_CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "agent_id": self.agent_id,
                "cloud_url": self.cloud_url,
                "api_key": self.api_key,
                "updated_at": datetime.utcnow().isoformat() + "Z"
            }, f, indent=2)

    # --------------------------------------------------------------------------
    # Diagnostics & Docker discovery
    # --------------------------------------------------------------------------
    def get_agent_status(self) -> Dict[str, Any]:
        """Detect local tools, Docker daemon status, and offline queue size."""
        docker_info = check_docker_health()
        syft_info = check_syft_health()
        scout_info = check_scout_health()
        cosign_info = check_cosign_health()
        offline_count = len(self.get_offline_scans())

        return {
            "agent_id": self.agent_id,
            "version": "2.0.0",
            "cloud_url": self.cloud_url,
            "docker": docker_info,
            "syft": syft_info,
            "scout": scout_info,
            "cosign": cosign_info,
            "offline_pending_count": offline_count,
            "online_cloud_reachable": self.check_cloud_connectivity()
        }

    def list_local_images(self) -> List[Dict[str, Any]]:
        """List container images cached locally in Docker."""
        return list_local_images()

    # --------------------------------------------------------------------------
    # Local Scan Execution
    # --------------------------------------------------------------------------
    def scan_local_image(self, image_name: str) -> Dict[str, Any]:
        """
        Executes a real local scan using the host's Docker, Syft, Scout, Cosign, and ML models.
        Caches results locally for offline operation, and attempts auto-sync if online.
        """
        clean_name = validate_image_name(image_name)
        logger.info(f"Initiating local scan for '{clean_name}'...")

        # Run complete ChainProof scan pipeline
        result = perform_scan(clean_name)
        result = make_json_safe(result)
        result["scanned_by_agent"] = self.agent_id
        result["scanned_at_local"] = datetime.utcnow().isoformat() + "Z"

        # Save into local offline store
        self._store_offline_scan(result)

        # Attempt opportunistic sync to Cloud API
        if self.check_cloud_connectivity():
            threading.Thread(target=self.sync_with_cloud, daemon=True).start()

        return result

    # --------------------------------------------------------------------------
    # Offline Persistence & Queue
    # --------------------------------------------------------------------------
    def _store_offline_scan(self, scan_data: Dict[str, Any]):
        with _cache_lock:
            scans = self.get_offline_scans()
            scans.insert(0, scan_data)
            with open(OFFLINE_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(scans[:200], f, indent=2)

    def get_offline_scans(self) -> List[Dict[str, Any]]:
        if not os.path.exists(OFFLINE_CACHE_FILE):
            return []
        try:
            with open(OFFLINE_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    # --------------------------------------------------------------------------
    # Cloud Synchronization
    # --------------------------------------------------------------------------
    def check_cloud_connectivity(self) -> bool:
        """Check if ChainProof Cloud API endpoint is reachable."""
        try:
            url = f"{self.cloud_url}/health"
            req = urllib.request.Request(url, headers={"User-Agent": "ChainProof-DesktopAgent/2.0"})
            with urllib.request.urlopen(req, timeout=3) as resp:
                return resp.status == 200
        except Exception:
            return False

    def sync_with_cloud(self) -> Dict[str, Any]:
        """Uploads offline scan queue to the ChainProof Cloud API."""
        with _cache_lock:
            scans = self.get_offline_scans()
            if not scans:
                return {"synced": 0, "message": "No pending offline scans to sync."}

            url = f"{self.cloud_url}/agent/sync"
            payload = json.dumps({
                "agent_id": self.agent_id,
                "agent_version": "2.0.0",
                "scans": scans
            }).encode("utf-8")

            headers = {
                "Content-Type": "application/json",
                "User-Agent": "ChainProof-DesktopAgent/2.0"
            }
            if self.api_key:
                headers["X-API-Key"] = self.api_key

            try:
                req = urllib.request.Request(url, data=payload, headers=headers)
                with urllib.request.urlopen(req, timeout=15) as res:
                    data = json.loads(res.read().decode("utf-8"))
                    logger.info(f"Synced {data.get('synced', 0)} scans with Cloud API successfully.")
                    return data
            except Exception as e:
                logger.warning(f"Cloud synchronization failed: {e}")
                return {"synced": 0, "error": str(e)}

    # --------------------------------------------------------------------------
    # Local Image Monitoring & Docker Event Watcher
    # --------------------------------------------------------------------------
    def get_monitored_images(self) -> List[Dict[str, Any]]:
        if not os.path.exists(MONITORED_LOCAL_FILE):
            return []
        try:
            with open(MONITORED_LOCAL_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []

    def set_monitored_images(self, images: List[str]):
        with open(MONITORED_LOCAL_FILE, "w", encoding="utf-8") as f:
            json.dump([{"image": img, "monitored_at": datetime.utcnow().isoformat() + "Z"} for img in images], f, indent=2)

    def start_background_watcher(self):
        """Starts background threads for Docker event monitoring and periodic cloud sync."""
        if self.is_running:
            return
        self.is_running = True
        self._watcher_thread = threading.Thread(target=self._docker_event_loop, daemon=True)
        self._sync_thread = threading.Thread(target=self._periodic_sync_loop, daemon=True)
        self._watcher_thread.start()
        self._sync_thread.start()
        logger.info("Desktop Agent background watcher & periodic sync active.")

    def _periodic_sync_loop(self):
        while self.is_running:
            time.sleep(120)  # Check sync every 2 minutes
            if self.check_cloud_connectivity():
                self.sync_with_cloud()

    def _docker_event_loop(self):
        """Monitors local Docker daemon for newly pulled or tagged images matching monitored targets."""
        import docker
        while self.is_running:
            try:
                client = docker.from_env()
                for event in client.events(decode=True, filters={"type": "image", "event": ["tag", "pull"]}):
                    if not self.is_running:
                        break
                    actor_attrs = event.get("Actor", {}).get("Attributes", {})
                    image_name = actor_attrs.get("name")
                    if image_name:
                        monitored = [m["image"] for m in self.get_monitored_images()]
                        if any(image_name == m or image_name.startswith(m) for m in monitored):
                            logger.info(f"Detected new image version for monitored target: {image_name}. Auto-scanning...")
                            try:
                                self.scan_local_image(image_name)
                            except Exception as scan_err:
                                logger.error(f"Auto-scan failed for {image_name}: {scan_err}")
            except Exception as e:
                time.sleep(15)  # Reconnection delay if Docker restarts


# ==============================================================================
# Embedded Lightweight Local REST Server for Tauri Desktop GUI
# ==============================================================================
def start_local_agent_server(port: int = 8008):
    from http.server import HTTPServer, BaseHTTPRequestHandler

    agent = DesktopScannerAgent()
    agent.start_background_watcher()

    class AgentHandler(BaseHTTPRequestHandler):
        def _send_json(self, status: int, data: Any):
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, X-API-Key")
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

        def do_OPTIONS(self):
            self._send_json(200, {"status": "ok"})

        def do_GET(self):
            path = self.path.split("?")[0]
            if path == "/api/agent/status":
                self._send_json(200, agent.get_agent_status())
            elif path == "/api/agent/images":
                self._send_json(200, agent.list_local_images())
            elif path == "/api/agent/offline-scans":
                self._send_json(200, agent.get_offline_scans())
            elif path == "/api/agent/monitored":
                self._send_json(200, agent.get_monitored_images())
            else:
                self._send_json(404, {"error": "Not found"})

        def do_POST(self):
            path = self.path.split("?")[0]
            content_len = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_len) if content_len > 0 else b"{}"
            try:
                payload = json.loads(body.decode("utf-8"))
            except Exception:
                payload = {}

            if path == "/api/agent/scan":
                image = payload.get("image", "").strip()
                if not image:
                    self._send_json(400, {"error": "image field is required"})
                    return
                try:
                    res = agent.scan_local_image(image)
                    self._send_json(200, res)
                except Exception as e:
                    self._send_json(500, {"error": str(e)})

            elif path == "/api/agent/sync":
                res = agent.sync_with_cloud()
                self._send_json(200, res)

            elif path == "/api/agent/config":
                cloud_url = payload.get("cloud_url")
                api_key = payload.get("api_key")
                agent.save_config(cloud_url, api_key)
                self._send_json(200, {"status": "saved", "config": agent.get_agent_status()})

            elif path == "/api/agent/monitored":
                images = payload.get("images", [])
                agent.set_monitored_images(images)
                self._send_json(200, {"status": "saved", "monitored": agent.get_monitored_images()})
            else:
                self._send_json(404, {"error": "Not found"})

    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, AgentHandler)
    logger.info(f"ChainProof Desktop Local Scanner Agent listening on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping Desktop Scanner Agent...")
        agent.is_running = False
        httpd.server_close()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8008
    start_local_agent_server(port)
