from datetime import datetime, timezone
import json
import os
import threading

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.api.auth import require_admin, require_analyst_or_admin
from app.services.sanitizer import sanitize_raw_string
from app.storage.db import DATA_DIR
from app.ai.analyst import analyze_scan

router = APIRouter(tags=["Reports"])

REPORTS_FILE = os.path.join(DATA_DIR, "reports.json")
_reports_lock = threading.Lock()


def make_json_safe(value):
    """
    Convert values returned by Docker / ML / NumPy
    into standard JSON-compatible Python values.
    """
    if value is None:
        return None

    if isinstance(value, (str, int, float, bool)):
        return value

    if isinstance(value, dict):
        return {
            str(key): make_json_safe(val)
            for key, val in value.items()
        }

    if isinstance(value, (list, tuple, set)):
        return [
            make_json_safe(item)
            for item in value
        ]

    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass

    return str(value)


def get_all_reports():
    """
    Reads scan history from reports.json.
    Enriches with ai_analysis if missing.
    """
    with _reports_lock:
        if not os.path.exists(REPORTS_FILE):
            return []

        try:
            with open(REPORTS_FILE, "r", encoding="utf-8") as f:
                reports = json.load(f)

            if not isinstance(reports, list):
                return []

            for report in reports:
                if isinstance(report, dict):
                    ai = report.get("ai_analysis")
                    if not ai or not isinstance(ai, dict) or "correlated_risks" not in ai or not ai.get("correlated_risks"):
                        try:
                            report["ai_analysis"] = analyze_scan(report)
                        except Exception:
                            pass

            return reports

        except Exception:
            return []


def save_report(scan_data: dict):
    """
    Appends a new scan result to reports.json using atomic file write.
    """
    scan_data = make_json_safe(scan_data)

    with _reports_lock:
        reports = []
        if os.path.exists(REPORTS_FILE):
            try:
                with open(REPORTS_FILE, "r", encoding="utf-8") as f:
                    reports = json.load(f)
            except Exception:
                reports = []

        scan_data["id"] = len(reports) + 1
        now_dt = datetime.now(timezone.utc)
        scan_data["timestamp"] = now_dt.strftime("%Y-%m-%d %H:%M:%S")

        reports.insert(0, scan_data)

        tmp_file = f"{REPORTS_FILE}.tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump(reports, f, indent=2, ensure_ascii=False)

        try:
            os.chmod(tmp_file, 0o600)
        except Exception:
            pass

        if os.path.exists(REPORTS_FILE):
            os.replace(tmp_file, REPORTS_FILE)
        else:
            os.rename(tmp_file, REPORTS_FILE)


def clear_all_reports():
    """
    Clears all scan history.
    """
    with _reports_lock:
        tmp_file = f"{REPORTS_FILE}.tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            json.dump([], f, indent=2)

        try:
            os.chmod(tmp_file, 0o600)
        except Exception:
            pass

        if os.path.exists(REPORTS_FILE):
            os.replace(tmp_file, REPORTS_FILE)
        else:
            os.rename(tmp_file, REPORTS_FILE)


@router.get("/reports")
def list_reports(user: Dict[str, Any] = Depends(require_analyst_or_admin)):
    """List historical container security scan reports (Analyst & Admin)."""
    return get_all_reports()


@router.get("/reports/{report_id}")
def get_report(report_id: str, user: Dict[str, Any] = Depends(require_analyst_or_admin)):
    """Retrieve details for an individual scan report by ID or scan_id (Analyst & Admin)."""
    clean_id = sanitize_raw_string(str(report_id), max_length=100)
    reports = get_all_reports()
    for r in reports:
        if str(r.get("id")) == clean_id or str(r.get("scan_id")) == clean_id:
            return r
    raise HTTPException(status_code=404, detail="Scan report not found")


@router.delete("/reports")
def clear_reports(admin: Dict[str, Any] = Depends(require_admin)):
    """Clear all historical scan reports (Admin only)."""
    try:
        clear_all_reports()
        return {
            "status": "success",
            "message": "Scan history cleared successfully."
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )