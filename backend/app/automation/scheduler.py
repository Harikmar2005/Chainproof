"""
ChainProof Background Automation Scheduler
Periodically checks active automation rules, schedules automated container scans,
and monitors image registries without blocking the main event loop.
"""

import asyncio
import logging
from datetime import datetime
from app.storage.db import get_all_automations
from app.automation.engine import execute_automation

logger = logging.getLogger("chainproof.scheduler")

_running = False
_scheduler_task = None
_last_run_timestamps = {}


async def start_scheduler():
    """Starts the background scheduler loop."""
    global _running, _scheduler_task
    if _running:
        return
    _running = True
    _scheduler_task = asyncio.create_task(_scheduler_loop())
    logger.info("[Scheduler] ChainProof Automation Scheduler started.")


async def stop_scheduler():
    """Stops the background scheduler loop."""
    global _running, _scheduler_task
    _running = False
    if _scheduler_task:
        _scheduler_task.cancel()
        try:
            await _scheduler_task
        except asyncio.CancelledError:
            pass
    logger.info("[Scheduler] ChainProof Automation Scheduler stopped.")


async def _scheduler_loop():
    while _running:
        try:
            await asyncio.sleep(30)  # Check every 30 seconds
            if not _running:
                break
            await _check_and_run_scheduled_automations()
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"[Scheduler] Error in scheduler loop: {e}")


async def _check_and_run_scheduled_automations():
    now = datetime.utcnow()
    current_time_str = now.strftime("%H:%M")
    current_date_minute = now.strftime("%Y-%m-%d %H:%M")

    automations = get_all_automations()
    for auto in automations:
        if not auto.get("enabled", False):
            continue

        trigger = auto.get("trigger", "").upper()
        auto_id = auto.get("id")

        if trigger == "SCHEDULE":
            schedule_time = auto.get("schedule", "")
            
            # Prevent duplicate execution within same minute
            if _last_run_timestamps.get(auto_id) == current_date_minute:
                continue

            # Exact HH:MM match
            if schedule_time == current_time_str:
                _last_run_timestamps[auto_id] = current_date_minute
                logger.info(f"[Scheduler] Triggering scheduled automation '{auto.get('name')}' ({auto_id})")
                # Run in separate thread to not block async event loop
                asyncio.create_task(
                    asyncio.to_thread(execute_automation, auto_id, trigger_type="SCHEDULE")
                )
