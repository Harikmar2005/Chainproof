"""
ChainProof Notification Dispatcher
Delivers security alerts across Desktop, Mobile Push, Webhooks, and Email channels.
All provider credentials and endpoints are securely loaded from environment variables.
"""

import json
import logging
import os
import smtplib
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from app.storage.db import create_notification, get_all_devices

logger = logging.getLogger("chainproof.notifications")


def dispatch_notification(
    title: str,
    message: str,
    severity: str = "INFO",
    channels: Optional[List[str]] = None,
    payload: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Dispatches a security notification to configured channels and persists in ledger with delivery status.
    Channels: DESKTOP, MOBILE, WEBHOOK, EMAIL
    """
    if channels is None:
        channels = ["DESKTOP", "MOBILE", "WEBHOOK", "EMAIL"]

    payload = payload or {}
    delivery_status: Dict[str, str] = {
        "desktop_ledger": "DELIVERED"
    }

    # 1. Dispatch to Webhook (Slack, Discord, Teams, or Custom SIEM)
    webhook_url = os.getenv("CHAINPROOF_WEBHOOK_URL", "").strip()
    if "WEBHOOK" in channels:
        if webhook_url:
            delivery_status["webhook"] = _send_webhook(webhook_url, {
                "event": "security_alert",
                "title": title,
                "message": message,
                "severity": severity,
                "payload": payload
            })
        else:
            delivery_status["webhook"] = "SKIPPED_NOT_CONFIGURED"

    # 2. Dispatch to Mobile Push (Expo Push / FCM / APNS gateway)
    push_gateway = os.getenv("EXPO_PUSH_GATEWAY_URL", "https://exp.host/--/api/v2/push/send").strip()
    if "MOBILE" in channels:
        devices = get_all_devices()
        mobile_tokens = [d["token"] for d in devices if d.get("platform") in ("MOBILE", "ANDROID", "IOS") and d.get("token")]
        if mobile_tokens and push_gateway:
            delivery_status["mobile_push"] = _send_mobile_push(push_gateway, mobile_tokens, title, message, severity, payload)
        elif not mobile_tokens:
            delivery_status["mobile_push"] = "SKIPPED_NO_DEVICES"
        else:
            delivery_status["mobile_push"] = "SKIPPED_NOT_CONFIGURED"

    # 3. Dispatch to Email via SMTP if configured
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    if "EMAIL" in channels:
        if smtp_host:
            delivery_status["email"] = _send_email(title, message, severity, payload)
        else:
            delivery_status["email"] = "SKIPPED_NOT_CONFIGURED"

    # 4. Record in persistent notification ledger (always accessible by Desktop, Mobile, and Web)
    saved_record = create_notification(
        title=title,
        message=message,
        severity=severity,
        channel=",".join(channels),
        payload={**payload, "delivery_status": delivery_status}
    )
    saved_record["delivery_status"] = delivery_status

    logger.info(f"[Notification] Dispatched '{title}' ({severity}) across {channels}: {delivery_status}")
    return saved_record


def _send_webhook(url: str, data: Dict[str, Any]) -> str:
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "ChainProof-Notifier/2.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            logger.info(f"Webhook delivered to {url} with status {res.status}")
            return f"DELIVERED_HTTP_{res.status}"
    except Exception as e:
        logger.warning(f"Failed to deliver webhook notification to {url}: {e}")
        return f"FAILED_{type(e).__name__}"


def _send_mobile_push(gateway_url: str, tokens: List[str], title: str, message: str, severity: str, payload: Dict[str, Any]) -> str:
    try:
        messages = [
            {
                "to": token,
                "sound": "default",
                "title": f"🛡️ ChainProof: {title}",
                "body": message,
                "data": {"severity": severity, **payload}
            }
            for token in tokens
        ]
        req = urllib.request.Request(
            gateway_url,
            data=json.dumps(messages).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "ChainProof-MobileNotifier/2.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as res:
            logger.info(f"Mobile push batch sent to {len(tokens)} devices: status {res.status}")
            return f"DELIVERED_HTTP_{res.status}"
    except Exception as e:
        logger.warning(f"Failed to dispatch mobile push: {e}")
        return f"FAILED_{type(e).__name__}"


def _send_email(title: str, message: str, severity: str, payload: Dict[str, Any]) -> str:
    try:
        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        smtp_from = os.getenv("SMTP_FROM", smtp_user or "alerts@chainproof.io")
        alert_to = os.getenv("ALERT_EMAIL_TO")

        if not alert_to:
            return "SKIPPED_NO_RECIPIENT"

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[ChainProof Alert - {severity}] {title}"
        msg["From"] = smtp_from
        msg["To"] = alert_to

        text_content = f"{title}\n\nSeverity: {severity}\n\n{message}\n\nPayload: {json.dumps(payload, indent=2)}"
        msg.attach(MIMEText(text_content, "plain"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            if os.getenv("SMTP_USE_TLS", "true").lower() == "true":
                server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_from, [alert_to], msg.as_string())
            logger.info(f"Email alert sent successfully to {alert_to}")
            return "DELIVERED"
    except Exception as e:
        logger.warning(f"Failed to send email alert: {e}")
        return f"FAILED_{type(e).__name__}"
