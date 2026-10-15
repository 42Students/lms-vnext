/**
 * Runtime gate for the announcements HTTP routes and notice surfaces.
 *
 * Tables: `announcements` is registered by drizzle/0076_db10_announcements_bug_tracker.sql.
 * The gate stays a synchronous operator flag (many sync call sites) and must
 * only be turned on in an environment AFTER migration 0076 has been applied:
 *   DB10_ANNOUNCEMENTS_READY=DB10_VERIFIED
 * The TPO placement notice services additionally check real table existence
 * (placementTableExists) and report NOT_REGISTERED when the table is absent.
 */
export function announcementsRuntimeEnabled() {
  return process.env.DB10_ANNOUNCEMENTS_READY === "DB10_VERIFIED";
}
