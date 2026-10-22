import {describe,expect,it} from "vitest";
import {LEGACY_NOTIFICATION_OPERATION_CROSSWALK,getLegacyNotificationMigration}
  from "@/modules/activity/legacy-notification-contract";

describe("Legacy notification controller migration contract",()=>{
 it("documents every old operation without falsely exposing old integer-ID aliases",()=>{
   const entries=Object.values(LEGACY_NOTIFICATION_OPERATION_CROSSWALK);
   expect(entries).toHaveLength(10);
   expect(new Set(entries.map(entry=>entry.old)).size).toBe(entries.length);
   expect(entries.every(entry=>entry.old.includes("/api/v1/notification/"))).toBe(true);
   expect(entries.every(entry=>entry.status==="RETIRED" ||
     (entry.replacement!==null && !entry.replacement.startsWith("GET /api/v1/")))).toBe(true);
   expect(getLegacyNotificationMigration("fetchById")).toMatchObject({
     status:"RETIRED",replacement:null,
     scope:"LEGACY_NUMERIC_ID_NOT_AN_AUTHORIZATION_KEY",
   });
 });
 it("keeps recipient access self-only and staff writes scoped",()=>{
   expect(getLegacyNotificationMigration("getNotificationsForRecipient").scope)
     .toBe("SELF_ONLY_NO_RECIPIENT_ID");
   expect(getLegacyNotificationMigration("createNotification").replacement)
     .toBe("POST /api/notifications/staff");
   expect(getLegacyNotificationMigration("subscribe").replacement)
     .toBe("GET /api/notifications/stream");
   expect(getLegacyNotificationMigration("update").scope)
     .toBe("STAFF_OWNS_EXISTING_AND_TARGET_SCOPE");
 });
});
