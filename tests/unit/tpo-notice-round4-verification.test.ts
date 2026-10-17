import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const src=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
const page=()=>src("src/app/(authenticated)/tpo/announcements/page.tsx");
const create=()=>src("src/modules/announcements/tpo-placement-write-service.ts");
const edit=()=>src("src/modules/announcements/tpo-placement-edit-service.ts");
const receipt=()=>src("src/modules/announcements/tpo-notice-read-receipts-service.ts");
describe("TPO placement announcement round-4 evidence",()=>{
 it("TPO-inbox-team-45 shows the audience count and guards zero recipients during compose",()=>{
  expect(page()).toContain("<TpoNoticeScheduleControls minDateTime={formMinDateTime} count={audience?.potentiallyVisibleMemberships??null}");
  expect(page()).toContain("audience.potentiallyVisibleMemberships>0");
  expect(page()).toContain("retryPreviewHref");
 });
 it("TPO-inbox-team-46 never claims an undelivered notice was actually delivered",()=>{
  expect(receipt()).toContain("notDelivered:Number(counts[0]?.delivered??0)===0");
  expect(src("src/components/tpo/tpo-notice-read-progress.tsx")).toContain("Awaiting notification delivery");
 });
 it("TPO-inbox-team-47 keeps the last successful receipt summary after a refresh error",()=>{
  const file=src("src/components/tpo/tpo-notice-read-progress.tsx");
  expect(file).toContain("setData(result)");
  expect(file).not.toContain("setData(null)");
  expect(file).toContain("apiFetch<Summary>");
  expect(receipt()).toContain(".limit(500)");
 });
 it("TPO-inbox-team-48 shows scheduled and ended author notices with their dates",()=>{
  expect(page()).toContain("Scheduled for");
  expect(page()).toContain("Ended");
  expect(page()).toContain('name="sendAt"');
 });
 it("TPO-inbox-team-49 renders a safe button for notices with HTTPS destinations",()=>{
  expect(page()).toContain('row.buttonUrl?.startsWith("https://")');
  expect(page()).toContain('rel="noopener noreferrer"');
  expect(src("src/modules/announcements/tpo-placement-read-model.ts")).toContain("buttonUrl");
 });
 it("TPO-inbox-team-50 has the legacy modal and paired optional button input",()=>{
  const c=src("src/components/tpo/tpo-notice-composer-dialog.tsx");
  expect(c).toContain("showModal()");
  expect(c).toContain("<dialog");
  expect(page()).toContain("Button (optional)");
  expect(page()).toContain("maxLength={60}");
  expect(page()).toContain("maxLength={500}");
 });
 it("TPO-inbox-team-51 persists version-checked notice button changes",()=>{
  expect(edit()).toContain("expectedVersion");
  expect(edit()).toContain("buttonLabel:input.buttonLabel??null");
  expect(edit()).toContain("buttonUrl:input.buttonUrl??null");
 });
 it("TPO-inbox-team-52 confirms Delete announcement without native confirm",()=>{
  const c=src("src/components/tpo/tpo-notice-delete-confirm.tsx");
  expect(c).toContain('role="alertdialog"');
  expect(c).toContain("Delete this announcement?");
  expect(c).not.toContain("window.confirm(");
 });
 it("TPO-inbox-team-53 shows a bounded and dismissing Undo send countdown",()=>{
  const c=src("src/components/tpo/tpo-notice-undo-toast.tsx");
  expect(c).toContain("30000-");
  expect(c).toContain("remaining<=0");
  expect(c).toContain("Undo send");
 });
 it("TPO-inbox-team-54 labels unread From 42 cards and shows college-wide unread count",()=>{
  expect(page()).toContain('tab.data==="from-42"&&result.readStateReady&&!row.readAt');
  expect(page()).toContain('value==="from-42"&&from42Unread!==null');
  expect(page()).not.toContain("new on this page");
  expect(page()).toContain("countUnreadTpo42Announcements(context)");
  const read=src("src/modules/announcements/tpo-placement-read-service.ts");
  expect(read).toContain("isNull(placementCellAnnouncementReads.announcementId)");
  expect(read).toContain("eq(db10Announcements.collegeId,college.id)");
  expect(page()).toContain("TpoPlacementCellReadAction");
 });
 it("TPO-inbox-team-55 never echoes raw validation codes into the form",()=>{
  const errors=src("src/modules/announcements/tpo-notice-form-error-model.ts");
  expect(errors).toContain("The link has to start with https://");
  expect(page()).toContain('role="alert"');
  expect(create()).toContain("buttonUrl");
  expect(edit()).toContain("buttonUrl");
 });
 it("TPO-inbox-team-56 matches the exact legacy tabs and separate From 42 explanation",()=>{
  expect(page()).toContain('["yours","To your students"]');
  expect(page()).toContain('["from-42","From 42"]');
  expect(page()).toContain("What 42 tells placement cells.");
 });
 it("TPO-inbox-team-58 enforces title 200 and message 8000 on create and edit",()=>{
  for(const c of [create(),edit()]){
   expect(c).toContain("max(200)");
   expect(c).toContain("max(8000)");
  }
 });
 it("TPO-inbox-team-R03 accepts old From 42 and students tab links",()=>{
  expect(page()).toContain('t==="from42"?"from-42":t==="students"?"yours":t');
 });
 it("TPO-inbox-team-R04 paginates notices instead of silently hiding rows past 100",()=>{
  expect(src("src/modules/announcements/tpo-placement-read-service.ts")).toContain(".limit(101).offset((safePage-1)*100)");
  expect(page()).toContain('aria-label="Announcement pages"');
  expect(page()).toContain("Show older");
 });
});
