/**
 * Runtime gate for the bug-tracker / audit-findings admin surfaces.
 *
 * Tables (bug_tracker_access, bug_tracker_sessions, bug_reports,
 * bug_report_activities, bug_report_attachments) are registered by
 * drizzle/0076_db10_announcements_bug_tracker.sql. Enable per environment
 * only after that migration is applied:
 * Log alert persistence is a distinct system: its readiness is guarded by
 * src/modules/log-alerts/readiness.ts and DB10_LOG_ALERTS_READY, not by
 * DB10_TRACKER_READY. A tracker issue gate must never suppress a live
 * Cloud Logging alert, and a ready log alert cannot enable bug-report writes.
 *   DB10_TRACKER_READY=DB10_VERIFIED
 */
export function trackerAdminRuntimeEnabled() {
  return process.env.DB10_TRACKER_READY === "DB10_VERIFIED";
}
