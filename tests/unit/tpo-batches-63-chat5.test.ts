import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("TPO batch notification and audit side effects",()=>{
 it("TPO-batches-63 creates real invite and remind notices plus audited bulk runs",()=>{
  const invite=read("src/modules/placements/batch-participation-service.ts");
  const remind=read("src/modules/placements/tpo-batch-reminder-service.ts");
  const bulk=read("src/modules/placements/tpo-bulk-action-confirm-service.ts");
  expect(invite).toContain('eventType: "BATCH_INVITED"');
  expect(invite).toContain("tx.insert(inAppNotifications)");
  expect(invite).toContain('actionHref: "/learn/my-placements/placement#registration"');
  expect(remind).toContain('eventType:"BATCH_REMINDED"');
  expect(remind).toContain("tpoBatchReminderDayKey(now)");
  expect(remind).toContain("tx.insert(inAppNotifications)");
  expect(remind).toContain("dedupeKey");
  expect(bulk).toContain("recordActivityEvent(context,");
  expect(bulk).toContain("ACTIVITY_EVENT_TYPES.PLACEMENTS_BULK_RUN");
  expect(bulk).toContain("updated,skipped,failed");
 });
});
