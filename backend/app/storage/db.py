"""
ChainProof Storage & Database Layer
Provides thread-safe JSON-backed persistence for automations, jobs, notifications,
monitored registry images, and device registrations.
"""

import json
import os
import threading
from datetime import datetime
from typing import Dict, Any, List, Optional
import uuid

_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.getenv("CHAINPROOF_DATA_DIR", os.path.join(_BACKEND_DIR, "data"))
os.makedirs(DATA_DIR, exist_ok=True)

AUTOMATIONS_FILE = os.path.join(DATA_DIR, "automations.json")
JOBS_FILE = os.path.join(DATA_DIR, "jobs.json")
NOTIFICATIONS_FILE = os.path.join(DATA_DIR, "notifications.json")
DEVICES_FILE = os.path.join(DATA_DIR, "devices.json")
MONITORED_FILE = os.path.join(DATA_DIR, "monitored_images.json")

_lock = threading.Lock()


def _read_json(filepath: str, default: Any) -> Any:
    if not os.path.exists(filepath):
        return default
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _write_json(filepath: str, data: Any):
    tmp_path = f"{filepath}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    # Restrict permissions to owner read/write where supported
    try:
        os.chmod(tmp_path, 0o600)
    except Exception:
        pass
    # Atomic replace
    if os.path.exists(filepath):
        os.replace(tmp_path, filepath)
    else:
        os.rename(tmp_path, filepath)


# ==============================================================================
# Automations Store
# ==============================================================================

def get_all_automations() -> List[Dict[str, Any]]:
    with _lock:
        return _read_json(AUTOMATIONS_FILE, _default_automations())


def save_automation(data: Dict[str, Any]) -> Dict[str, Any]:
    with _lock:
        automations = _read_json(AUTOMATIONS_FILE, _default_automations())
        if "id" not in data or not data["id"]:
            data["id"] = f"auto-{uuid.uuid4().hex[:8]}"
            data["created_at"] = datetime.utcnow().isoformat() + "Z"
            data["run_count"] = 0
            data["last_run"] = None
            automations.append(data)
        else:
            updated = False
            for i, a in enumerate(automations):
                if a.get("id") == data["id"]:
                    data["updated_at"] = datetime.utcnow().isoformat() + "Z"
                    automations[i] = {**a, **data}
                    updated = True
                    break
            if not updated:
                automations.append(data)

        _write_json(AUTOMATIONS_FILE, automations)
        return data


def delete_automation(automation_id: str) -> bool:
    with _lock:
        automations = _read_json(AUTOMATIONS_FILE, _default_automations())
        initial_len = len(automations)
        automations = [a for a in automations if a.get("id") != automation_id]
        if len(automations) < initial_len:
            _write_json(AUTOMATIONS_FILE, automations)
            return True
        return False


def get_automation_by_id(automation_id: str) -> Optional[Dict[str, Any]]:
    automations = get_all_automations()
    for a in automations:
        if a.get("id") == automation_id:
            return a
    return None


def record_automation_run(automation_id: str):
    with _lock:
        automations = _read_json(AUTOMATIONS_FILE, _default_automations())
        for a in automations:
            if a.get("id") == automation_id:
                a["run_count"] = a.get("run_count", 0) + 1
                a["last_run"] = datetime.utcnow().isoformat() + "Z"
                break
        _write_json(AUTOMATIONS_FILE, automations)


def _default_automations() -> List[Dict[str, Any]]:
    return [
        {
            "id": "auto-prod-nightly",
            "name": "Production Nightly Vulnerability Audit",
            "trigger": "SCHEDULE",
            "schedule": "02:00",
            "targets": ["alpine:latest", "nginx:alpine", "python:3.11-slim"],
            "action": "SCAN_IMAGE",
            "enabled": True,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "run_count": 14,
            "last_run": datetime.utcnow().isoformat() + "Z",
            "tags": ["production", "nightly", "cve"]
        },
        {
            "id": "auto-ghcr-webhook",
            "name": "GHCR / Docker Hub Registry Push Listener",
            "trigger": "NEW_IMAGE_VERSION",
            "target": "ghcr.io/company/payments-api",
            "targets": ["ghcr.io/company/payments-api:latest"],
            "action": "SCAN_IMAGE",
            "enabled": True,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "run_count": 8,
            "last_run": datetime.utcnow().isoformat() + "Z",
            "tags": ["registry", "webhook", "cicd"]
        }
    ]


# ==============================================================================
# Jobs Store
# ==============================================================================

def get_all_jobs(limit: int = 50) -> List[Dict[str, Any]]:
    with _lock:
        jobs = _read_json(JOBS_FILE, _default_jobs())
        return jobs[:limit]


def create_job(automation_id: Optional[str], automation_name: str, trigger: str, target: str) -> Dict[str, Any]:
    with _lock:
        jobs = _read_json(JOBS_FILE, _default_jobs())
        job = {
            "id": f"job-{uuid.uuid4().hex[:10]}",
            "automation_id": automation_id,
            "automation_name": automation_name,
            "trigger": trigger,
            "target": target,
            "status": "RUNNING",
            "started_at": datetime.utcnow().isoformat() + "Z",
            "completed_at": None,
            "risk_score": None,
            "severity": None,
            "decision": None,
            "scan_id": None,
            "summary": "Job initiated. Running Docker, Syft, Scout, and ML pipelines...",
            "error": None
        }
        jobs.insert(0, job)
        _write_json(JOBS_FILE, jobs)
        return job


def update_job(job_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    with _lock:
        jobs = _read_json(JOBS_FILE, _default_jobs())
        for i, j in enumerate(jobs):
            if j.get("id") == job_id:
                jobs[i] = {**j, **updates}
                _write_json(JOBS_FILE, jobs)
                return jobs[i]
        return None


def get_job_by_id(job_id: str) -> Optional[Dict[str, Any]]:
    jobs = get_all_jobs()
    for j in jobs:
        if j.get("id") == job_id:
            return j
    return None


def _default_jobs() -> List[Dict[str, Any]]:
    return [
        {
            "id": "job-d841c90a12",
            "automation_id": "auto-prod-nightly",
            "automation_name": "Production Nightly Vulnerability Audit",
            "trigger": "SCHEDULE",
            "target": "alpine:latest",
            "status": "SUCCESS",
            "started_at": datetime.utcnow().isoformat() + "Z",
            "completed_at": datetime.utcnow().isoformat() + "Z",
            "risk_score": 32,
            "severity": "MEDIUM",
            "decision": "REVIEW",
            "scan_id": "943ecb38-e41a-4b8a",
            "summary": "Completed with 1 High CVE (CVE-2026-85091). Supply-chain integrity unverified.",
            "error": None
        }
    ]


# ==============================================================================
# Notifications Store
# ==============================================================================

def get_all_notifications(limit: int = 50) -> List[Dict[str, Any]]:
    with _lock:
        notifs = _read_json(NOTIFICATIONS_FILE, _default_notifications())
        return notifs[:limit]


def create_notification(title: str, message: str, severity: str, channel: str = "ALL", payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    with _lock:
        notifs = _read_json(NOTIFICATIONS_FILE, _default_notifications())
        item = {
            "id": f"notif-{uuid.uuid4().hex[:8]}",
            "title": title,
            "message": message,
            "severity": severity.upper(),
            "channel": channel,
            "payload": payload or {},
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "read": False
        }
        notifs.insert(0, item)
        _write_json(NOTIFICATIONS_FILE, notifs)
        return item


def mark_notification_read(notif_id: str):
    with _lock:
        notifs = _read_json(NOTIFICATIONS_FILE, _default_notifications())
        for n in notifs:
            if n.get("id") == notif_id or notif_id == "ALL":
                n["read"] = True
        _write_json(NOTIFICATIONS_FILE, notifs)


def _default_notifications() -> List[Dict[str, Any]]:
    return [
        {
            "id": "notif-init-01",
            "title": "ChainProof Platform Online",
            "message": "Security correlation engine and automated scanners initialized.",
            "severity": "INFO",
            "channel": "SYSTEM",
            "payload": {},
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "read": True
        }
    ]


# ==============================================================================
# Device Registration Store
# ==============================================================================

def register_device(device_name: str, platform: str, token: str) -> Dict[str, Any]:
    with _lock:
        devices = _read_json(DEVICES_FILE, [])
        for d in devices:
            if d.get("token") == token:
                d["last_active"] = datetime.utcnow().isoformat() + "Z"
                d["device_name"] = device_name
                _write_json(DEVICES_FILE, devices)
                return d

        device = {
            "id": f"dev-{uuid.uuid4().hex[:8]}",
            "device_name": device_name,
            "platform": platform.upper(),
            "token": token,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "last_active": datetime.utcnow().isoformat() + "Z"
        }
        devices.append(device)
        _write_json(DEVICES_FILE, devices)
        return device


def get_all_devices() -> List[Dict[str, Any]]:
    with _lock:
        return _read_json(DEVICES_FILE, [])


# ==============================================================================
# Monitored Images Store
# ==============================================================================

def _default_monitored_images() -> List[Dict[str, Any]]:
    return [
        {
            "id": "mon-alpine",
            "image": "alpine:latest",
            "tags": ["latest", "3.20"],
            "auto_scan": True,
            "schedule": "02:00",
            "last_scanned": datetime.utcnow().isoformat() + "Z",
            "risk_score": 32,
            "severity": "MEDIUM",
            "decision": "REVIEW",
            "total_cves": 1,
            "created_at": datetime.utcnow().isoformat() + "Z"
        },
        {
            "id": "mon-nginx",
            "image": "nginx:alpine",
            "tags": ["alpine", "latest"],
            "auto_scan": True,
            "schedule": "03:00",
            "last_scanned": None,
            "risk_score": None,
            "severity": None,
            "decision": None,
            "total_cves": None,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
    ]


def get_all_monitored_images() -> List[Dict[str, Any]]:
    with _lock:
        return _read_json(MONITORED_FILE, _default_monitored_images())


def add_monitored_image(image: str, tags: Optional[List[str]] = None, auto_scan: bool = True, schedule: Optional[str] = "02:00") -> Dict[str, Any]:
    with _lock:
        items = _read_json(MONITORED_FILE, _default_monitored_images())
        for item in items:
            if item.get("image") == image:
                item["tags"] = tags or item.get("tags", [])
                item["auto_scan"] = auto_scan
                item["schedule"] = schedule
                _write_json(MONITORED_FILE, items)
                return item

        new_entry = {
            "id": f"mon-{uuid.uuid4().hex[:8]}",
            "image": image,
            "tags": tags or ["latest"],
            "auto_scan": auto_scan,
            "schedule": schedule,
            "last_scanned": None,
            "risk_score": None,
            "severity": None,
            "decision": None,
            "total_cves": None,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        items.append(new_entry)
        _write_json(MONITORED_FILE, items)
        return new_entry


def update_monitored_image(image_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    with _lock:
        items = _read_json(MONITORED_FILE, _default_monitored_images())
        for i, it in enumerate(items):
            if it.get("id") == image_id or it.get("image") == image_id:
                items[i] = {**it, **updates}
                _write_json(MONITORED_FILE, items)
                return items[i]
        return None


def delete_monitored_image(image_id: str) -> bool:
    with _lock:
        items = _read_json(MONITORED_FILE, _default_monitored_images())
        initial = len(items)
        items = [it for it in items if it.get("id") != image_id and it.get("image") != image_id]
        if len(items) < initial:
            _write_json(MONITORED_FILE, items)
            return True
        return False


# ==============================================================================
# Users & Authentication Store
# ==============================================================================

USERS_FILE = os.path.join(DATA_DIR, "users.json")
API_KEYS_FILE = os.path.join(DATA_DIR, "api_keys.json")
FINDINGS_FILE = os.path.join(DATA_DIR, "findings.json")


def _default_users() -> List[Dict[str, Any]]:
    import bcrypt
    # Default admin user with bcrypt hash
    admin_pwd = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin123")
    pwd_hash = bcrypt.hashpw(admin_pwd.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")
    now_iso = datetime.utcnow().isoformat() + "Z"
    return [
        {
            "id": "usr-admin-01",
            "username": "admin",
            "password_hash": pwd_hash,
            "role": "ADMIN",
            "full_name": "Security Administrator",
            "created_at": now_iso,
            "active": True
        }
    ]


def get_all_users() -> List[Dict[str, Any]]:
    with _lock:
        return _read_json(USERS_FILE, _default_users())


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    users = get_all_users()
    for u in users:
        if u.get("username", "").lower() == username.lower():
            return u
    return None


def create_user(username: str, password_hash: str, role: str = "ANALYST", full_name: str = "") -> Dict[str, Any]:
    with _lock:
        users = _read_json(USERS_FILE, _default_users())
        for u in users:
            if u.get("username", "").lower() == username.lower():
                raise ValueError(f"Username '{username}' already exists.")
        
        user = {
            "id": f"usr-{uuid.uuid4().hex[:8]}",
            "username": username,
            "password_hash": password_hash,
            "role": role.upper(),
            "full_name": full_name or username,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "active": True
        }
        users.append(user)
        _write_json(USERS_FILE, users)
        return user


# ==============================================================================
# API Keys Store (for Desktop Agents / CI/CD)
# ==============================================================================

def get_all_api_keys() -> List[Dict[str, Any]]:
    with _lock:
        return _read_json(API_KEYS_FILE, [])


def create_api_key(name: str, key_hash: str, prefix: str, role: str = "AGENT") -> Dict[str, Any]:
    with _lock:
        keys = _read_json(API_KEYS_FILE, [])
        record = {
            "id": f"key-{uuid.uuid4().hex[:8]}",
            "name": name,
            "key_hash": key_hash,
            "prefix": prefix,
            "role": role.upper(),
            "created_at": datetime.utcnow().isoformat() + "Z",
            "last_used": None,
            "active": True
        }
        keys.append(record)
        _write_json(API_KEYS_FILE, keys)
        return record


def verify_api_key(raw_key: str) -> Optional[Dict[str, Any]]:
    import hashlib
    import secrets
    if not raw_key:
        return None
    raw_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    with _lock:
        keys = _read_json(API_KEYS_FILE, [])
        for k in keys:
            if secrets.compare_digest(k.get("key_hash", ""), raw_hash) and k.get("active", True):
                k["last_used"] = datetime.utcnow().isoformat() + "Z"
                _write_json(API_KEYS_FILE, keys)
                return k
    return None


# ==============================================================================
# Security Findings Store
# ==============================================================================

def get_all_findings(severity: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    with _lock:
        findings = _read_json(FINDINGS_FILE, [])
        if severity:
            findings = [f for f in findings if f.get("severity", "").upper() == severity.upper()]
        return findings[:limit]


def record_findings(scan_id: str, image: str, findings_list: List[Dict[str, Any]]):
    if not findings_list:
        return
    with _lock:
        findings = _read_json(FINDINGS_FILE, [])
        timestamp = datetime.utcnow().isoformat() + "Z"
        for item in findings_list:
            item_entry = {
                "id": f"fnd-{uuid.uuid4().hex[:8]}",
                "scan_id": scan_id,
                "image": image,
                "type": item.get("type", "VULNERABILITY"),
                "severity": (item.get("severity") or "MEDIUM").upper(),
                "message": item.get("message", ""),
                "timestamp": timestamp
            }
            findings.insert(0, item_entry)
        _write_json(FINDINGS_FILE, findings[:1000])  # keep recent 1000 findings

