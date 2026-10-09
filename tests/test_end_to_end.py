"""
ChainProof End-to-End Verification Test Suite
Tests real execution of:
- Docker inspection
- Syft SBOM generation
- Docker Scout vulnerability scanning
- Sigstore Cosign verification
- Random Forest ML prediction
- Isolation Forest anomaly detection
- Deterministic Risk Engine & Action Matrix
- AI Security Correlation Engine
- Automation Engine execution
- Notification dispatching
"""

import sys
import os
import unittest

# Ensure backend is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.docker_service import ensure_image, check_docker_health, validate_image_name
from app.services.sbom_service import generate_sbom, check_syft_health
from app.services.vulnerability_service import scan_vulnerabilities, check_scout_health
from app.services.signature_service import verify_signature, check_cosign_health
from app.services.scan_orchestrator import perform_scan
from app.automation.engine import automation_engine
from app.notifications.dispatcher import dispatch_notification
from app.storage.db import get_all_jobs, get_all_notifications, get_all_monitored_images


class TestChainProofEndToEnd(unittest.TestCase):

    def test_01_tool_diagnostics(self):
        """Verify host environment has required CLI tools and Docker daemon."""
        docker_health = check_docker_health()
        self.assertTrue(docker_health["connected"], f"Docker daemon not connected: {docker_health.get('error')}")

        syft_health = check_syft_health()
        self.assertTrue(syft_health["available"], f"Syft binary not available: {syft_health.get('error')}")

        cosign_health = check_cosign_health()
        self.assertTrue(cosign_health["available"], f"Cosign binary not available: {cosign_health.get('error')}")

        scout_health = check_scout_health()
        self.assertTrue(scout_health["available"], f"Docker Scout plugin not available: {scout_health.get('error')}")
        print("[SUCCESS] Tool Diagnostics Verified: Docker, Syft, Scout, Cosign all operational.")

    def test_02_image_name_validation(self):
        """Verify strict regex validation and rejection of shell metacharacters."""
        self.assertEqual(validate_image_name("alpine:latest"), "alpine:latest")
        self.assertEqual(validate_image_name("ghcr.io/org/repo:v1.2.3"), "ghcr.io/org/repo:v1.2.3")
        
        with self.assertRaises(ValueError):
            validate_image_name("alpine; rm -rf /")
        with self.assertRaises(ValueError):
            validate_image_name("alpine | cat /etc/passwd")
        with self.assertRaises(ValueError):
            validate_image_name("alpine$(whoami)")
        print("[SUCCESS] Strict image name validation and shell-injection prevention verified.")

    def test_03_scan_alpine(self):
        """Verify real pipeline on alpine:latest."""
        res = perform_scan("alpine:latest")
        self.assertIn("scan_id", res)
        self.assertEqual(res["image"], "alpine:latest")
        self.assertGreater(res["docker"]["size_bytes"], 0)
        self.assertEqual(res["sbom"]["status"], "PASS")
        self.assertGreater(res["sbom"]["package_count"], 0)
        self.assertIn(res["severity"], ["LOW", "MEDIUM", "HIGH", "CRITICAL"])
        self.assertIn("random_forest", res["ml"])
        self.assertIn("anomaly_detection", res["ml"])
        self.assertIn("ai_analysis", res)
        self.assertIn(res["ai_analysis"]["security_decision"], ["TRUST", "REVIEW", "BLOCK"])
        print(f"[SUCCESS] alpine:latest Scan Verified: Score {res['risk_score']}/100, Decision {res['ai_analysis']['security_decision']}")

    def test_04_scan_nginx_alpine(self):
        """Verify real pipeline on nginx:alpine."""
        res = perform_scan("nginx:alpine")
        self.assertIn("scan_id", res)
        self.assertGreater(res["docker"]["size_bytes"], 0)
        self.assertEqual(res["sbom"]["status"], "PASS")
        self.assertGreater(res["sbom"]["package_count"], 0)
        print(f"[SUCCESS] nginx:alpine Scan Verified: Score {res['risk_score']}/100, Decision {res['ai_analysis']['security_decision']}")

    def test_05_automation_engine_and_matrix(self):
        """Verify Automation Engine risk action matrix and job execution."""
        eval_low = automation_engine.evaluate_risk_decision("LOW", 15)
        self.assertEqual(eval_low["decision"], "TRUST")
        self.assertEqual(eval_low["action"], "TRUST")

        eval_med = automation_engine.evaluate_risk_decision("MEDIUM", 35)
        self.assertEqual(eval_med["decision"], "REVIEW")
        self.assertEqual(eval_med["action"], "REVIEW")

        eval_high = automation_engine.evaluate_risk_decision("HIGH", 60)
        self.assertEqual(eval_high["decision"], "REVIEW")
        self.assertEqual(eval_high["action"], "REVIEW / ALERT")

        eval_crit = automation_engine.evaluate_risk_decision("CRITICAL", 85)
        self.assertEqual(eval_crit["decision"], "BLOCK")
        self.assertEqual(eval_crit["action"], "BLOCK / ALERT")

        # Execute rule
        jobs = automation_engine.execute_rule(
            automation_id=None,
            trigger_type="MANUAL",
            target_override="alpine:latest"
        )
        self.assertTrue(len(jobs) > 0)
        self.assertEqual(jobs[0]["status"], "SUCCESS")
        print("[SUCCESS] Automation Engine & Deterministic Risk Matrix Verified.")

    def test_06_notifications_dispatcher(self):
        """Verify notification dispatcher records to persistent ledger."""
        notif = dispatch_notification(
            title="E2E Security Test Alert",
            message="Automated integration test verification.",
            severity="CRITICAL",
            payload={"test": True}
        )
        self.assertIn("id", notif)
        all_notifs = get_all_notifications()
        self.assertTrue(any(n["id"] == notif["id"] for n in all_notifs))
        print("[SUCCESS] Notification Dispatcher Verified.")


if __name__ == "__main__":
    unittest.main()
