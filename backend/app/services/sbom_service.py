import json
import logging
import os
import shutil
import subprocess

logger = logging.getLogger("chainproof.sbom")


def _find_syft_binary() -> str:
    """Locate syft binary across PATH or known installation directories."""
    found = shutil.which("syft")
    if found:
        return found
    
    candidates = [
        "/usr/local/bin/syft",
        "/usr/bin/syft",
        os.path.expanduser("~/.local/bin/syft"),
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WindowsApps\syft.exe"),
    ]
    for c in candidates:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return "syft"


def check_syft_health() -> dict:
    """Check if Syft is available natively or via Docker."""
    syft_bin = _find_syft_binary()
    try:
        res = subprocess.run(
            [syft_bin, "version"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10
        )
        if res.returncode == 0:
            return {"available": True, "binary": syft_bin, "version_output": res.stdout.strip().splitlines()[0] if res.stdout else "unknown"}
    except Exception:
        pass
    
    # Check if Docker is available to run Syft
    try:
        res = subprocess.run(["docker", "version"], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=5)
        if res.returncode == 0:
            return {"available": True, "binary": "docker:anchore/syft", "version_output": "anchore/syft:latest"}
    except Exception:
        pass

    return {"available": False, "binary": syft_bin, "error": "Syft CLI not available"}



def generate_sbom(image_name: str) -> dict:
    """
    Generate an SBOM for the container image using Syft.
    Runs native syft binary, with graceful containerized execution on Windows
    to overcome known Windows NTFS colon path issues in stereoscope.
    Never uses fake fallback packages.
    """
    syft_bin = _find_syft_binary()
    raw_json = None
    last_err = ""

    # Attempt 1: Native Syft binary
    try:
        result = subprocess.run(
            [syft_bin, image_name, "-o", "json"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=120
        )
        if result.returncode == 0 and result.stdout.strip().startswith("{"):
            raw_json = result.stdout
        else:
            last_err = result.stderr.strip()
    except Exception as exc:
        last_err = str(exc)

    # Attempt 2: If native syft failed (e.g. Windows NTFS path syntax error), run official anchore/syft in Docker
    if not raw_json:
        try:
            logger.info(f"Running Syft via Docker for '{image_name}'...")
            dock_res = subprocess.run(
                ["docker", "run", "--rm", "-v", "//var/run/docker.sock:/var/run/docker.sock", "anchore/syft:latest", image_name, "-o", "json"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=180
            )
            # Find JSON block in stdout
            first_brace = dock_res.stdout.find("{")
            last_brace = dock_res.stdout.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                raw_json = dock_res.stdout[first_brace:last_brace + 1]
            else:
                last_err = dock_res.stderr.strip() or last_err
        except Exception as dock_exc:
            last_err = f"{last_err} | Docker syft error: {str(dock_exc)}"

    if not raw_json:
        logger.error(f"Syft execution failed for {image_name}: {last_err}")
        return {
            "status": "ERROR",
            "package_count": 0,
            "packages": [],
            "error": last_err or "Syft SBOM generation failed."
        }

    try:
        data = json.loads(raw_json)
        artifacts = data.get("artifacts", [])
        packages_list = []
        for art in artifacts[:100]:
            packages_list.append({
                "name": art.get("name"),
                "version": art.get("version"),
                "type": art.get("type"),
                "foundBy": art.get("foundBy")
            })

        return {
            "status": "PASS",
            "package_count": len(artifacts),
            "packages": packages_list
        }
    except json.JSONDecodeError as jde:
        logger.error(f"Failed to decode Syft JSON output: {jde}")
        return {
            "status": "ERROR",
            "package_count": 0,
            "packages": [],
            "error": f"Invalid JSON received from Syft: {str(jde)}"
        }
