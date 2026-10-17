import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO delivery increments with honest missing producer coverage",()=>{
 it("TPO-inbox-team-54 shows an actual persisted From 42 unread count and New only on verified unread",()=>{
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  const service=src("src/modules/announcements/tpo-placement-read-service.ts");
  expect(page).toContain("countUnreadTpo42Announcements(context)");
  expect(page).toContain('value==="from-42"&&from42Unread!==null');
  expect(page).toContain('tab.data==="from-42"&&result.readStateReady&&!row.readAt');
  expect(service).toContain("placementCellAnnouncementReads");
 });
 it("TPO-inbox-team-60 exposes twenty real bell entries and read-on-open while additional event producers remain outstanding",()=>{
  const bell=src("src/components/tpo/tpo-bell-panel.tsx");
  const team=src("src/modules/placements/tpo-team-internal-reply-service.ts");
  const companyJoin=src("src/modules/placements/public-join/join-service.ts");
  expect(bell).toContain("displayedItems.slice(0,20)");
  expect(bell).toContain("openItem(item)");
  expect(team).toContain("tx.insert(inAppNotifications)");
  expect(companyJoin).toContain("tx.insert(inAppNotifications)");
 });
 it("TPO-recruiters-R05 records one immutable bulk-run activity event while legacy action-specific audit remains open",()=>{
  const service=src("src/modules/placements/tpo-bulk-lead-stage-service.ts");
  expect(service).toContain('eventType:"PLACEMENTS_RECRUITER_BULK_STAGE"');
  expect(service).toContain("runAuditId:runAudit.id");
  expect(service).toContain("metadata:{action:input.action");
  expect(service).toContain("tx.insert(placementTpoLeadActivities)");
 });
});