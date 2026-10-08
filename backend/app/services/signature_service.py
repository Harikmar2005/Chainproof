import subprocess

def verify_signature(image_name: str) -> dict:
    try:
        result = subprocess.run(
            ["cosign", "verify", image_name],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        if result.returncode == 0:
            return {"signed": True, "verified": True}
    except (FileNotFoundError, Exception):
        pass

    # Fallback for demo mode
    return {"signed": False, "verified": False}