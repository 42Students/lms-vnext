import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO inbox/team outstanding legacy contracts",()=>{
 it("TPO-inbox-team-30 routes the authenticated legacy c/m deep link and members alias",()=>{
  const team=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(team).toContain('z.string().uuid().safeParse(threadId)');
  expect(team).toContain('redirect("/tpo/team/"+encodeURIComponent(threadId)+target)');
  expect(team).toContain('tabInput==="members"?"people":tabInput');
 });
 it("TPO-inbox-team-37 hides temporary coordinator assignments from permanent team roles",()=>{
  const team=src("src/app/(authenticated)/tpo/team/page.tsx");
  expect(team).toContain('const activeTeam=team.members.filter(member=>member.roles.includes("TPO")');
  expect(team).toContain('member.roles.includes("TPO_ADMIN")');
  expect(team).toContain("Everyone in it can do everything in placements.");
 });
 it("TPO-inbox-team-44 keeps explicit college-scoped audience picker empty states",()=>{
  const picker=src("src/components/tpo/tpo-notice-audience-picker.tsx");
  expect(picker).toContain("No batch is in placements");
  expect(picker).toContain("No student in placements has a branch yet");
  expect(picker).toContain("No published drive yet");
 });
 it("TPO-inbox-team-51 edits announcement CTA, schedule and expiry with a version token",()=>{
  const edit=src("src/modules/announcements/tpo-placement-edit-service.ts");
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(edit).toContain("expectedVersion");
  expect(edit).toContain("buttonLabel:input.buttonLabel??null");
  expect(edit).toContain("buttonUrl:input.buttonUrl??null");
  expect(edit).toContain("expiresAt:schedule.expiresAt");
  expect(page).toContain('name="sendAt"');
  expect(page).toContain('name="showUntil"');
 });
 it("TPO-inbox-team-52 protects notice deletion with named confirmation and successful feedback",()=>{
  const confirm=src("src/components/tpo/tpo-notice-delete-confirm.tsx");
  const lifecycle=src("src/app/api/placements/tpo/announcements/[noticeId]/lifecycle/route.ts");
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(confirm).toContain("Delete this announcement?");
  expect(confirm).toContain("Students stop seeing it, and its notices are taken back.");
  expect(confirm).toContain("event.preventDefault()");
  expect(lifecycle).toContain('destination.searchParams.set("noticeSuccess","DELETED")');
  expect(page).toContain("Deleted. Its notices were taken back.");
 });
 it("TPO-inbox-team-R04 permits reaching more than one hundred notices, without cross-college scans",()=>{
  const read=src("src/modules/announcements/tpo-placement-read-service.ts");
  const page=src("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(read).toContain(".limit(101).offset((safePage-1)*100)");
  expect(read).toContain("eq(db10Announcements.collegeId,college.id)");
  expect(page).toContain('aria-label="Announcement pages"');
  expect(page).toContain("Show older");
 });
 it("TPO-inbox-team-60 keeps the readable bell actions distinct from missing event-producer coverage",()=>{
  const bell=src("src/components/tpo/tpo-bell-panel.tsx");
  expect(bell).toContain("await apiFetch(");
  expect(bell).toContain("displayedItems.slice(0,20)");
  expect(bell).toContain("Mark all read");
 });
});
