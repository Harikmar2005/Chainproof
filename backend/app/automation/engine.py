"""
ChainProof Automation Engine
Executes automated security workflows (Image Scans, Notifications, CI/CD Policy Gates).
Supports Triggers: SCHEDULE, NEW_IMAGE_VERSION, MANUAL, WEBHOOK, CI/CD
Supports Actions: SCAN_IMAGE, GENERATE_REPORT, SEND_NOTIFICATION, BLOCK_DEPLOYMENT, WEBHOOK
"""

import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

from app.services.scan_orchestrator import perform_scan
from app.api.reports import save_report, make_json_safe
from app.storage.db import (
    create_job,
    update_job,
    record_automation_run,
    get_automation_by_id,
    get_all_automations,
    update_monitored_image,
    record_findings
)
from app.notifications.dispatcher import dispatch_notification

logger = logging.getLogger("chainproof.automation")


class AutomationEngine:
    """Core engine responsible for executing automation pipelines and policy evaluations."""

    def evaluate_risk_decision(self, severity: str, risk_score: int) -> Dict[str, str]:
        """
        Deterministic Risk Action Mapping:
        LOW -> TRUST
        MEDIUM -> REVIEW
        HIGH -> REVIEW / ALERT
        CRITICAL -> BLOCK / ALERT
        """
        sev = (severity or "LOW").upper()
        if sev == "CRITICAL" or risk_score >= 75:
            return {"decision": "BLOCK", "action": "BLOCK / ALERT", "level": "CRITICAL"}
        elif sev == "HIGH" or risk_score >= 50:
            return {"decision": "REVIEW", "action": "REVIEW / ALERT", "level": "HIGH"}
        elif sev == "MEDIUM" or risk_score >= 25:
            return {"decision": "REVIEW", "action": "REVIEW", "level": "MEDIUM"}
        else:
            return {"decision": "TRUST", "action": "TRUST", "level": "LOW"}

    async def trigger_automations(
        self,
        trigger_type: str,
        target_override: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Triggers all automations matching the specified trigger type, or executes
        an ad-hoc scan if no matching rules exist and target_override is provided.
        """
        trigger_upper = trigger_type.upper()
        all_rules = get_all_automations()
        
        # Find matching rules
        matching_rules = []
        for rule in all_rules:
            if not rule.get("enabled", True):
                continue
            rule_trig = rule.get("trigger", "").upper()
            if rule_trig == trigger_upper:
                # If target override is specified, check if rule matches or is generic
                rule_targets = rule.get("targets", [])
                if rule.get("target"):
                    rule_targets.append(rule.get("target"))
                
                if target_override:
                    if not rule_targets or any(target_override in t or t in target_override for t in rule_targets):
                        matching_rules.append(rule)
                else:
                    matching_rules.append(rule)

        results = []
        if matching_rules:
            for rule in matching_rules:
                res = self.execute_rule(rule.get("id"), trigger_type=trigger_upper, target_override=target_override)
                results.extend(res)
        elif target_override:
            # Ad-hoc execution for target
            res = self.execute_rule(automation_id=None, trigger_type=trigger_upper, target_override=target_override)
            results.extend(res)

        return results

    def execute_rule(
        self,
        automation_id: Optional[str],
        trigger_type: str,
        target_override: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Synchronously executes an automation rule across its designated targets.
        """
        automation = get_automation_by_id(automation_id) if automation_id else None
        auto_name = automation.get("name", "On-Demand Security Scan") if automation else f"Ad-Hoc {trigger_type} Scan"
        action = automation.get("action", "SCAN_IMAGE").upper() if automation else "SCAN_IMAGE"

        # Determine target images
        if target_override:
            targets = [target_override]
        elif automation:
            targets = automation.get("targets", [])
            if not targets and automation.get("target"):
                targets = [automation.get("target")]
        else:
            targets = ["alpine:latest"]

        if not targets:
            targets = ["alpine:latest"]

        results = []

        for target in targets:
            job = create_job(
                automation_id=automation_id,
                automation_name=auto_name,
                trigger=trigger_type,
                target=target
            )
            job_id = job["id"]

            try:
                logger.info(f"[Automation] Starting job {job_id} for '{target}' (trigger: {trigger_type}, action: {action})")

                # 1. Execute full ChainProof scan
                scan_data = perform_scan(target)
                scan_data = make_json_safe(scan_data)

                # 2. Persist to central reports ledger
                save_report(scan_data)

                # 3. Calculate risk decision
                risk_score = scan_data.get("risk_score", 0)
                severity = (scan_data.get("severity") or "LOW").upper()
                risk_eval = self.evaluate_risk_decision(severity, risk_score)
                decision = risk_eval["decision"]
                action_decision = risk_eval["action"]

                # 4. Record findings into persistent store
                if scan_data.get("findings"):
                    record_findings(scan_data.get("scan_id"), target, scan_data.get("findings"))

                # 5. Update monitored image if monitored
                update_monitored_image(target, {
                    "last_scanned": datetime.utcnow().isoformat() + "Z",
                    "risk_score": risk_score,
                    "severity": severity,
                    "decision": decision,
                    "total_cves": scan_data.get("vulnerabilities", {}).get("total", 0)
                })

                summary = (
                    f"Scanned '{target}' - Score: {risk_score}/100 ({severity}). "
                    f"Policy Decision: {action_decision}. "
                    f"CVEs: {scan_data.get('vulnerabilities', {}).get('total', 0)}, "
                    f"Packages: {scan_data.get('sbom', {}).get('package_count', 0)}."
                )

                # 6. Dispatch notifications according to risk action
                if action in ("SEND_NOTIFICATION", "SCAN_IMAGE", "BLOCK_DEPLOYMENT"):
                    if decision == "BLOCK":
                        dispatch_notification(
                            title=f"🚨 CRITICAL BLOCK: {target}",
                            message=f"Automated audit detected CRITICAL supply-chain risk. Score: {risk_score}/100. Action: {action_decision}",
                            severity="CRITICAL",
                            payload={"image": target, "risk_score": risk_score, "decision": decision, "action": action_decision, "job_id": job_id}
                        )
                    elif severity in ("HIGH", "MEDIUM"):
                        dispatch_notification(
                            title=f"⚠️ Security Warning: {target}",
                            message=f"Automated audit detected findings requiring review. Score: {risk_score}/100. Action: {action_decision}",
                            severity=severity,
                            payload={"image": target, "risk_score": risk_score, "decision": decision, "action": action_decision, "job_id": job_id}
                        )
                    else:
                        dispatch_notification(
                            title=f"✓ Verified Clean: {target}",
                            message=f"Automated audit passed. Policy: TRUST. Score: {risk_score}/100.",
                            severity="LOW",
                            payload={"image": target, "risk_score": risk_score, "decision": decision, "action": action_decision, "job_id": job_id}
                        )

                # 7. Update Job Status
                updated_job = update_job(job_id, {
                    "status": "SUCCESS",
                    "completed_at": datetime.utcnow().isoformat() + "Z",
                    "risk_score": risk_score,
                    "severity": severity,
                    "decision": action_decision,
                    "scan_id": scan_data.get("scan_id"),
                    "summary": summary,
                    "results": {
                        "risk_decision": {
                            "risk_level": severity,
                            "action": action_decision,
                            "decision": decision
                        },
                        "scan_id": scan_data.get("scan_id")
                    }
                })

                results.append(updated_job or job)

            except Exception as e:
                logger.error(f"[Automation] Job {job_id} failed on target '{target}': {e}")
                failed_job = update_job(job_id, {
                    "status": "FAILED",
                    "completed_at": datetime.utcnow().isoformat() + "Z",
                    "error": str(e),
                    "summary": f"Failed to execute scan on target '{target}': {str(e)}"
                })
                results.append(failed_job or job)

        if automation_id:
            record_automation_run(automation_id)

        return results


# Global singleton instance
automation_engine = AutomationEngine()


def execute_automation(automation_id: Optional[str], trigger_type: str, target_override: Optional[str] = None) -> List[Dict[str, Any]]:
    """Backward compatible helper function."""
    return automation_engine.execute_rule(automation_id, trigger_type, target_override)
