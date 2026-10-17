import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO announcement delivery retraction and edit notifications",()=>{
 it("TPO-inbox-team-52 retracts delivered alerts atomically on delete and undo",()=>{
  const lifecycle=src("src/modules/announcements/tpo-placement-notice-lifecycle.ts");
  expect(lifecycle).toContain("if(deleting){");
  expect(lifecycle).toContain("placements.tpo_notice.created");
  expect(lifecycle).toContain("tx.delete(inAppNotifications)");
  expect(lifecycle).toContain('eq(activityEvents.collegeId,college.id)');
  const ui=src("src/components/tpo/tpo-notice-delete-confirm.tsx");
  expect(ui).toContain("Students stop seeing it, and its notices are taken back.");
  expect(ui).toContain("Delete this announcement?");
 });
 it("TPO-inbox-team-51 supports versioned edits and optional scoped re-notification",()=>{
  const edit=src("src/modules/announcements/tpo-placement-edit-service.ts");
  const route=src("src/app/api/placements/tpo/announcements/[noticeId]/edit/route.ts");
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(edit).toContain("notifyChanged:z.boolean().default(false)");
  expect(edit).toContain("if(input.notifyChanged && editEvent)");
  expect(edit).toContain("eq(inAppNotifications.eventId,original[0].id)");
  expect(edit).toContain("Announcement updated:");
  expect(route).toContain('form?.get("notifyChanged")==="on"');
  expect(page).toContain("Tell them it changed");
 });
});
