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

/** Separate an operator-disabled module from a ready module whose database
 * list query failed. Failed loads must never be rendered as empty success.
 * This helper handles presentation only; it cannot swallow authorization
 * errors or replace the permission-checked announcement service.
 */
export function announcementReadPresentation(input:{
 enabled:boolean;readFailed:boolean;availableCount:number;
}):{status:"DISABLED"|"RETRY"|"READY";message:string}{
 if(!input.enabled)return {status:"DISABLED",message:"College-wide announcements are unavailable."};
 if(input.readFailed)return {status:"RETRY",message:"Could not load announcements. Retry."};
 return {status:"READY",message:input.availableCount===0?"No announcements yet.":"Announcements loaded."};
}
