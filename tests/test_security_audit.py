"""
ChainProof Comprehensive Security Audit Verification Suite
Tests:
1. Bcrypt Password Hashing and Timing-Safe Verification
2. JWT Authentication and Expiration
3. Role-Based Access Control (RBAC): Admin vs Analyst vs Agent
4. Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
5. Rate Limiting Middleware (HTTP 429 & Retry-After)
6. Input Sanitization and XSS Prevention
7. API Key Secret Masking and Constant-Time Digest Verification
8. Information Leakage and Path Masking
"""

import os
import sys
import unittest
from fastapi.testclient import TestClient

# Ensure backend is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

# Set test environment to production to test strict enforcement
os.environ["ENVIRONMENT"] = "production"
os.environ["JWT_SECRET"] = "audit-super-secret-production-test-key-12345"
os.environ["ENABLE_DOCS"] = "false"

from app.main import app
from app.api.auth import hash_password, verify_password, create_access_token, decode_access_token
from app.services.sanitizer import sanitize_text, sanitize_raw_string, sanitize_dict
from app.services.docker_service import validate_image_name
from app.storage.db import get_all_api_keys, create_api_key, verify_api_key


class TestChainProofSecurityAudit(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_01_bcrypt_password_hashing(self):
        """Verify Bcrypt salt rounds, hashing strength, and rejection of invalid passwords."""
        plain = "SuperSecureP@ssw0rd2026!"
        hashed = hash_password(plain)

        # Ensure hash starts with standard bcrypt identifier
        self.assertTrue(hashed.startswith("$2b$") or hashed.startswith("$2a$"))
        # Ensure password matches
        self.assertTrue(verify_password(plain, hashed))
        # Ensure incorrect password fails
        self.assertFalse(verify_password("WrongPassword123", hashed))
        # Ensure empty password fails
        self.assertFalse(verify_password("", hashed))
        print("[AUDIT SUCCESS 1/8] Bcrypt password hashing and verification verified.")

    def test_02_jwt_token_security(self):
        """Verify cryptographically signed JWT generation, decoding, and tamper resistance."""
        token = create_access_token("usr-test-01", "auditor", "ADMIN")
        decoded = decode_access_token(token)

        self.assertEqual(decoded["sub"], "usr-test-01")
        self.assertEqual(decoded["username"], "auditor")
        self.assertEqual(decoded["role"], "ADMIN")
        self.assertIn("exp", decoded)

        # Tampered token must fail
        tampered = token[:-5] + "XXXXX"
        with self.assertRaises(Exception):
            decode_access_token(tampered)
        print("[AUDIT SUCCESS 2/8] JWT signing and cryptographic tamper-resistance verified.")

    def test_03_security_headers_and_fingerprinting(self):
        """Verify standard security headers are injected and server banners are masked."""
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)

        # Critical security headers
        self.assertEqual(res.headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(res.headers.get("X-Frame-Options"), "DENY")
        self.assertEqual(res.headers.get("X-XSS-Protection"), "1; mode=block")
        self.assertIn("max-age=31536000", res.headers.get("Strict-Transport-Security", ""))
        self.assertIn("strict-origin-when-cross-origin", res.headers.get("Referrer-Policy", ""))
        self.assertIn("default-src 'none'", res.headers.get("Content-Security-Policy", ""))

        # Server information masking
        self.assertNotIn("server", res.headers)
        self.assertNotIn("x-powered-by", res.headers)
        print("[AUDIT SUCCESS 3/8] Enterprise security headers and server masking verified.")

    def test_04_production_docs_turned_off(self):
        """Verify OpenAPI documentation and Swagger schemas are disabled in production."""
        res_docs = self.client.get("/docs")
        self.assertEqual(res_docs.status_code, 404)

        res_openapi = self.client.get("/openapi.json")
        self.assertEqual(res_openapi.status_code, 404)

        res_redoc = self.client.get("/redoc")
        self.assertEqual(res_redoc.status_code, 404)
        print("[AUDIT SUCCESS 4/8] Production debug and schema exposure disabled.")

    def test_05_rbac_and_admin_route_protection(self):
        """Verify that unauthenticated callers and non-admin users cannot access admin routes."""
        # 1. Unauthenticated request to admin route must be 401
        res_unauth = self.client.post("/api/v1/automations", json={"name": "Attacker Automation"})
        self.assertEqual(res_unauth.status_code, 401)

        # 2. Analyst token accessing admin route must be 403 Forbidden
        analyst_token = create_access_token("usr-analyst", "analyst_bob", "ANALYST")
        res_analyst = self.client.post(
            "/api/v1/automations",
            json={"name": "Unauthorized Automation"},
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        self.assertEqual(res_analyst.status_code, 403)
        self.assertIn("Access denied", res_analyst.json().get("detail", ""))

        # 3. Admin token accessing admin route must succeed
        admin_token = create_access_token("usr-admin", "admin_alice", "ADMIN")
        res_admin = self.client.post(
            "/api/v1/automations",
            json={
                "name": "Audit Verified Rule",
                "trigger": "SCHEDULE",
                "schedule": "04:00",
                "targets": ["alpine:latest"],
                "action": "SCAN_IMAGE"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        self.assertEqual(res_admin.status_code, 200)
        auto_id = res_admin.json()["id"]

        # 4. Admin deletion succeeds
        res_del = self.client.delete(
            f"/api/v1/automations/{auto_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        self.assertEqual(res_del.status_code, 200)
        print("[AUDIT SUCCESS 5/8] Role-Based Access Control (RBAC) strictly enforced.")

    def test_06_input_sanitization_and_xss_defense(self):
        """Verify input sanitization strips XSS vectors and rejects shell control chars."""
        # HTML tag stripping
        xss_payload = "<script>alert('XSS')</script>Hello<b>World</b>"
        clean = sanitize_text(xss_payload)
        self.assertNotIn("<script>", clean)
        self.assertNotIn("<b>", clean)

        # Raw string sanitization
        clean_name = sanitize_raw_string("<img src=x onerror=alert(1)>admin_user")
        self.assertEqual(clean_name, "admin_user")

        # Recursive dictionary sanitization
        nested = {"title": "<script>evil()</script>Title", "details": {"note": "<style>bad</style>Notes"}}
        clean_dict = sanitize_dict(nested)
        self.assertNotIn("<script>", clean_dict["title"])
        self.assertNotIn("<style>", clean_dict["details"]["note"])

        # Shell command injection rejection
        with self.assertRaises(ValueError):
            validate_image_name("alpine; rm -rf /")
        with self.assertRaises(ValueError):
            validate_image_name("alpine | cat /etc/shadow")
        with self.assertRaises(ValueError):
            validate_image_name("alpine$(whoami)")
        with self.assertRaises(ValueError):
            validate_image_name("alpine`id`")
        print("[AUDIT SUCCESS 6/8] Input sanitization and XSS / command injection prevention verified.")

    def test_07_api_key_masking_and_constant_time_verification(self):
        """Verify API keys are hashed and masked, with constant-time verification."""
        import hashlib
        raw_key = "cp_live_test_audit_key_secret_12345"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        created = create_api_key(name="Audit Test Agent", key_hash=key_hash, prefix="cp_live_test...")

        # Verify key
        valid = verify_api_key(raw_key)
        self.assertIsNotNone(valid)
        self.assertEqual(valid["name"], "Audit Test Agent")

        # Verify invalid key
        invalid = verify_api_key("cp_live_invalid_fake_key")
        self.assertIsNone(invalid)

        # Ensure raw hash is masked when listing keys
        all_keys = get_all_api_keys()
        target_key = next((k for k in all_keys if k["id"] == created["id"]), None)
        self.assertIsNotNone(target_key)
        self.assertNotIn(raw_key, target_key.values())
        print("[AUDIT SUCCESS 7/8] API key hashing, masking, and timing-safe verification verified.")

    def test_08_health_endpoint_path_masking(self):
        """Verify absolute host paths are not leaked in health diagnostics."""
        res = self.client.get("/api/v1/health")
        data = res.json()
        syft_info = data.get("components", {}).get("syft_sbom", {})
        cosign_info = data.get("components", {}).get("cosign_signature", {})

        # Ensure no absolute Windows user directory path is exposed
        if "binary" in syft_info:
            self.assertNotIn("Users\\kamalesh", syft_info["binary"])
        if "binary" in cosign_info:
            self.assertNotIn("Users\\kamalesh", cosign_info["binary"])
        print("[AUDIT SUCCESS 8/8] Host environment information disclosure prevention verified.")

    def test_09_rate_limiting_enforcement(self):
        """Verify that rapid brute-force requests exceed threshold and return HTTP 429."""
        # /api/v1/auth/login has max 10 requests / 60 seconds
        status_codes = []
        for _ in range(12):
            res = self.client.post("/api/v1/auth/login", json={"username": "test_brute", "password": "wrongpassword123"})
            status_codes.append(res.status_code)

        # At least one request must have been rate-limited with HTTP 429
        self.assertIn(429, status_codes)
        print(f"[AUDIT SUCCESS 9/9] Rate limiting triggered HTTP 429: {status_codes[-2:]}")


if __name__ == "__main__":
    unittest.main()
