import logging
import os
import shutil
import subprocess

logger = logging.getLogger("chainproof.signature")


def _find_cosign_binary() -> str:
    """Locate cosign binary across PATH or known installation directories."""
    found = shutil.which("cosign")
    if found:
        return found
    
    candidates = [
        "/usr/local/bin/cosign",
        "/usr/bin/cosign",
        os.path.expanduser("~/.local/bin/cosign"),
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WindowsApps\cosign.exe"),
    ]
    for c in candidates:
        if os.path.isfile(c) and os.access(c, os.X_OK):
            return c
    return "cosign"


def check_cosign_health() -> dict:
    """Check if Cosign binary is available and return version info."""
    cosign_bin = _find_cosign_binary()
    try:
        res = subprocess.run(
            [cosign_bin, "version"],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=10
        )
        if res.returncode == 0:
            lines = [line.strip() for line in res.stdout.splitlines() if line.strip() and not line.startswith("/")]
            return {
                "available": True,
                "binary": cosign_bin,
                "version_info": lines[-1] if lines else "cosign"
            }
        return {"available": False, "binary": cosign_bin, "error": res.stderr.strip()}
    except Exception as e:
        return {"available": False, "binary": cosign_bin, "error": str(e)}



def verify_signature(image_name: str) -> dict:
    """
    Verify container signature with Sigstore Cosign.
    Executes actual Cosign binary without shell injection.
    Distinguishes tool execution errors from valid negative security findings (unsigned image).
    """
    cosign_bin = _find_cosign_binary()
    try:
        cmd = [cosign_bin, "verify"]
        public_key = os.getenv("COSIGN_PUBLIC_KEY")
        if public_key and os.path.isfile(public_key):
            cmd.extend(["--key", public_key])
        else:
            # Keyless verification mode in Cosign v2+ requires identity regex
            cert_id = os.getenv("COSIGN_CERTIFICATE_IDENTITY_REGEXP", ".*")
            cert_issuer = os.getenv("COSIGN_CERTIFICATE_OIDC_ISSUER_REGEXP", ".*")
            cmd.extend([
                f"--certificate-identity-regexp={cert_id}",
                f"--certificate-oidc-issuer-regexp={cert_issuer}",
            ])
        cmd.append(image_name)

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            timeout=45
        )

        if result.returncode == 0:
            logger.info(f"Cosign verified valid signature for '{image_name}'")
            return {
                "tool_executed": True,
                "signed": True,
                "verified": True,
                "status": "VERIFIED",
                "details": "Cryptographic signature verified successfully via Sigstore Cosign."
            }
        else:
            stderr_msg = result.stderr.strip()
            stderr_lower = stderr_msg.lower()
            # Distinguish valid negative finding (unsigned image) from tool/flag error
            is_unsigned = any(phrase in stderr_lower for phrase in [
                "no signatures found",
                "no matching signatures",
                "none of the signatures were verified",
                "entity not found"
            ])

            if is_unsigned:
                return {
                    "tool_executed": True,
                    "signed": False,
                    "verified": False,
                    "status": "UNSIGNED",
                    "details": "Image lacks a cryptographic Sigstore Cosign signature."
                }
            else:
                return {
                    "tool_executed": True,
                    "signed": False,
                    "verified": False,
                    "status": "FAIL",
                    "details": stderr_msg if stderr_msg else "Cosign signature verification failed."
                }

    except FileNotFoundError:
        logger.warning("Cosign executable not found on host system.")
        return {
            "tool_executed": False,
            "signed": False,
            "verified": False,
            "status": "UNAVAILABLE",
            "details": "Cosign CLI is not available in system PATH."
        }
    except subprocess.TimeoutExpired:
        logger.warning(f"Cosign verification timed out for {image_name}")
        return {
            "tool_executed": False,
            "signed": False,
            "verified": False,
            "status": "TIMEOUT",
            "details": "Cosign verification timed out after 45 seconds."
        }
    except Exception as exc:
        logger.error(f"Error during Cosign verification: {exc}")
        return {
            "tool_executed": False,
            "signed": False,
            "verified": False,
            "status": "ERROR",
            "details": str(exc)
        }

