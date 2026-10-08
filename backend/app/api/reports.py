from datetime import datetime
import json
import os

from fastapi import APIRouter, HTTPException


router = APIRouter(tags=["Reports"])


from app.ai.analyst import analyze_scan

REPORTS_FILE = os.path.join(
    "data",
    "reports.json"
)



def make_json_safe(value):
    """
    Convert values returned by Docker / ML / NumPy
    into standard JSON-compatible Python values.
    """

    # None / normal JSON values
    if value is None:
        return None

    if isinstance(value, (str, int, float, bool)):
        return value

    # Dictionaries
    if isinstance(value, dict):
        return {
            str(key): make_json_safe(val)
            for key, val in value.items()
        }

    # Lists / tuples / sets
    if isinstance(value, (list, tuple, set)):
        return [
            make_json_safe(item)
            for item in value
        ]

    # NumPy values such as:
    # numpy.bool_
    # numpy.int64
    # numpy.float64
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            pass

    # Fallback for unexpected objects
    return str(value)


def get_all_reports():
    """
    Reads scan history from reports.json.
    Enriches with ai_analysis if missing.
    """

    if not os.path.exists(REPORTS_FILE):
        return []

    try:

        with open(
            REPORTS_FILE,
            "r",
            encoding="utf-8"
        ) as f:

            reports = json.load(f)

        if not isinstance(reports, list):
            return []

        # Enrich legacy reports if needed
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
    Appends a new scan result to reports.json.
    """

    os.makedirs(
        "data",
        exist_ok=True
    )

    # Convert all ML / Docker / scanner values
    # into JSON-compatible Python values.
    scan_data = make_json_safe(scan_data)

    reports = get_all_reports()

    # Add ID
    scan_data["id"] = len(reports) + 1

    # Add timestamp
    scan_data["timestamp"] = datetime.utcnow().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    # Newest scan first
    reports.insert(
        0,
        scan_data
    )

    with open(
        REPORTS_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            reports,
            f,
            indent=2,
            ensure_ascii=False
        )


def clear_all_reports():
    """
    Clears all scan history.
    """

    os.makedirs(
        "data",
        exist_ok=True
    )

    with open(
        REPORTS_FILE,
        "w",
        encoding="utf-8"
    ) as f:

        json.dump(
            [],
            f,
            indent=2
        )


@router.get("/reports")
def list_reports():

    return get_all_reports()


@router.delete("/reports")
def clear_reports():

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