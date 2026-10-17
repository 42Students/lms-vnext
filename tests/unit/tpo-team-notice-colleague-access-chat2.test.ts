import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
describe("TPO announcement management matches college-wide team permissions",()=>{
 it("TPO-inbox-team-57 enforces organization, college, TPO sender, and persisted manage permission for colleague edits",()=>{
  const edit=src("src/modules/announcements/tpo-placement-edit-service.ts");
  expect(edit).toContain("assertPersistedPlatformPermission(tx,context,\"placements.manage\"");
  expect(edit).toContain('eq(db10Announcements.collegeId,college.id)');
  expect(edit).toContain('eq(db10Announcements.organizationId,college.organizationId)');
  expect(edit).toContain('eq(db10Announcements.senderType,"TPO")');
  expect(edit).not.toContain('eq(db10Announcements.senderUserId,context.user.id)');
  expect(edit).toContain("eq(db10Announcements.version,input.expectedVersion)");
 });
 it("TPO-inbox-team-57 permits a replacement TPO member to delete or restore a colleague notice without weakening CAS",()=>{
  const lifecycle=src("src/modules/announcements/tpo-placement-notice-lifecycle.ts");
  expect(lifecycle).toContain('eq(db10Announcements.collegeId,college.id)');
  expect(lifecycle).toContain('eq(db10Announcements.senderType,"TPO")');
  expect(lifecycle).not.toContain('eq(db10Announcements.senderUserId,context.user.id)');
  expect(lifecycle).toContain("eq(db10Announcements.version,input.expectedVersion)");
 });
 it("TPO-inbox-team-57 makes colleague notices manageable in To your students and Recently removed",()=>{
  const list=src("src/modules/announcements/tpo-placement-read-service.ts");
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(list).toContain('[isNotNull(db10Announcements.deletedAt)]');
  expect(list).not.toContain('eq(db10Announcements.senderUserId,context.user.id)');
  expect(page).toContain('tab.data==="yours" ?');
  expect(page).toContain('tab.data==="yours"?<TpoNoticeDeleteConfirm');
  expect(page).not.toContain('row.senderUserId===context.user.id?<TpoNoticeDeleteConfirm');
 });
});
