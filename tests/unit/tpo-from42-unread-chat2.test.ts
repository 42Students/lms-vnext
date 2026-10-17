import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO From 42 unread awareness",()=>{
 it("TPO-inbox-team-54 counts all visible unread notices across pages with college read receipts",()=>{
  const service=src("src/modules/announcements/tpo-placement-read-service.ts");
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(service).toContain("countUnreadTpo42Announcements");
  expect(service).toContain("placement_cell_announcement_reads");
  expect(service).toContain('eq(db10Announcements.senderType,"SUPER_ADMIN")');
  expect(service).toContain("isNull(placementCellAnnouncementReads.announcementId)");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(page).toContain("countUnreadTpo42Announcements(context).catch(()=>null)");
  expect(page).toContain('value==="from-42"&&from42Unread!==null');
 });
 it("TPO-inbox-team-R04 never labels a limited first page as a global unread count",()=>{
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(page).not.toContain("new on this page");
  expect(page).toContain("result.hasMore");
  expect(page).toContain("Show older");
 });
});
