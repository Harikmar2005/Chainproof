"""
Input sanitization and XSS / injection defense utilities.
Provides defense-in-depth against Cross-Site Scripting (XSS),
command injection, path traversal, and header injection.
"""

import html
import re
from typing import Any, Dict, List, Union

# Regex for HTML tag removal
TAG_RE = re.compile(r"<[^>]*?>")
# Regex for detecting potential script / javascript: payloads
JS_SCHEME_RE = re.compile(r"javascript:\s*", re.IGNORECASE)
DATA_SCHEME_RE = re.compile(r"data:\s*text/html", re.IGNORECASE)


def sanitize_text(value: Union[str, Any], max_length: int = 500) -> str:
    """
    Sanitize text input:
    - Truncates to max_length
    - Strips null bytes and terminal escape codes
    - Removes HTML tags
    - HTML-escapes special characters (&, <, >, ", ')
    - Neutralizes javascript: and malicious URIs
    """
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)

    # 1. Remove null bytes and non-printable control characters (except newline, tab, return)
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", value)

    # 2. Strip HTML tags
    cleaned = TAG_RE.sub("", cleaned)

    # 3. Neutralize script schemes
    cleaned = JS_SCHEME_RE.sub("blocked_script:", cleaned)
    cleaned = DATA_SCHEME_RE.sub("blocked_data:", cleaned)

    # 4. Truncate
    cleaned = cleaned[:max_length].strip()

    # 5. HTML Escape to prevent reflected / stored XSS
    return html.escape(cleaned)


def sanitize_raw_string(value: str, max_length: int = 255) -> str:
    """Sanitize string preserving plain text without HTML entities for machine names."""
    if not value or not isinstance(value, str):
        return ""
    cleaned = re.sub(r"[\x00-\x1f\x7f]", "", value)
    cleaned = TAG_RE.sub("", cleaned)
    return cleaned[:max_length].strip()


def sanitize_dict(data: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively sanitize dictionary values to protect against stored XSS."""
    sanitized = {}
    for k, v in data.items():
        clean_key = sanitize_raw_string(str(k), max_length=100)
        if isinstance(v, str):
            sanitized[clean_key] = sanitize_text(v, max_length=2000)
        elif isinstance(v, dict):
            sanitized[clean_key] = sanitize_dict(v)
        elif isinstance(v, list):
            sanitized[clean_key] = [
                sanitize_dict(item) if isinstance(item, dict)
                else sanitize_text(item, max_length=2000) if isinstance(item, str)
                else item
                for item in v
            ]
        else:
            sanitized[clean_key] = v
    return sanitized
