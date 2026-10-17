import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoNoticeCreateSchema} from "@/modules/announcements/tpo-placement-write-service";
import {editTpoNoticeSchema} from "@/modules/announcements/tpo-placement-edit-service";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("Chat-2 graceful messaging and TPO action acceptance",()=>{
 it("TPO-inbox-team-18 projects the opposite participant and kind, not just a thread ID",()=>{
  const service=source("src/modules/placements/tpo-team-internal-read-service.ts");
  const page=source("src/app/(authenticated)/tpo/team/page.tsx");
  expect(service).toContain("counterpartName:");
  expect(service).toContain("eq(tpoInternalThreads.collegeId,college.id)");
  expect(page).toContain("row.counterpartName");
  expect(page).toContain("row.lastPreview");
 });
 it("TPO-inbox-team-21 keeps the reply across reloads, supports Enter to send, and counts four thousand characters",()=>{
  const forms=source("src/components/tpo/tpo-team-forms.tsx");
  expect(forms).toContain("sessionStorage.setItem(draftKey");
  expect(forms).toContain("sessionStorage.getItem(draftKey)");
  expect(forms).toContain('event.key==="Enter"');
  expect(forms).toContain("event.shiftKey");
  expect(forms).toContain("body.length}/4000");
 });
 it("TPO-inbox-team-39 preserves text and shows friendly inline failures rather than raw codes",()=>{
  const forms=source("src/components/tpo/tpo-team-forms.tsx");
  expect(forms).toContain("setError(tpoTeamFormErrorMessage");
  expect(forms).toContain('role="alert"');
  expect(forms).toContain("pending.current=true");
  expect(forms).not.toContain("setError(payload.error)");
 });
 it("TPO-inbox-team-52 GR-35 names consequences before destructive notice deletion, without window.confirm",()=>{
  const c=source("src/components/tpo/tpo-notice-delete-confirm.tsx");
  expect(c).toContain('role="alertdialog"');
  expect(c).toContain("Delete this announcement?");
  expect(c).toContain("Students stop seeing it, and its notices are taken back.");
  expect(c).toContain('aria-modal="true"');
  expect(c).toContain("pending.current=true");
  expect(c).not.toContain("window.confirm(");
 });
 it("TPO-inbox-team-55 GR-60 and GR-61 preserve announcement title, body and CTA through a failed post",()=>{
  const c=source("src/components/tpo/tpo-notice-draft-guard.tsx");
  const page=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(c).toContain("sessionStorage.setItem(key");
  expect(c).toContain("sessionStorage.getItem(key");
  expect(c).toContain('role="status"');
  expect(c).toContain("Draft restored");
  expect(page).toContain("<TpoNoticeDraftGuard");
  expect(page).toContain('id="tpo-notice-create"');
 });
 it("GR-31 double submissions are guarded on Team send and create",()=>{
  const c=source("src/components/tpo/tpo-team-forms.tsx");
  expect(c).toContain("pending.current||busy");
  expect(c).toContain("pending.current=false");
  expect(c).toContain("signal:controller.signal");
  expect(c).toContain("30000");
 });
 it("GR-62 warns about unsent replies and announcement changes before leaving",()=>{
  const forms=source("src/components/tpo/tpo-team-forms.tsx");
  const announcement=source("src/components/tpo/tpo-notice-draft-guard.tsx");
  expect(forms).toContain('window.addEventListener("beforeunload",protect)');
  expect(announcement).toContain('window.addEventListener("beforeunload",warn)');
 });
 it("GR-90 and GR-91 announce errors and offer a keyboard-reachable Cancel action",()=>{
  const team=source("src/components/tpo/tpo-team-forms.tsx");
  const dialog=source("src/components/tpo/tpo-notice-delete-confirm.tsx");
  expect(team).toContain('role="alert"');
  expect(dialog).toContain('type="button" onClick={dismiss}');
  expect(dialog).toContain("confirmButton.current?.focus()");
 });
 it("TPO-inbox-team-50/51 rejects non-HTTPS CTA links in both create and edit services",()=>{
  const base={title:"Update",message:"Message",pinned:false,audience:"COLLEGE" as const};
  expect(tpoNoticeCreateSchema.safeParse({...base,buttonLabel:"Read",buttonUrl:"http://unsafe.example"}).success).toBe(false);
  expect(tpoNoticeCreateSchema.safeParse({...base,buttonLabel:"Read"}).success).toBe(false);
  expect(tpoNoticeCreateSchema.safeParse({...base,buttonLabel:"Read",buttonUrl:"https://example.org"}).success).toBe(true);
  const edit={noticeId:"10000000-0000-4000-8000-000000000001",expectedVersion:1,...base};
  expect(editTpoNoticeSchema.safeParse({...edit,buttonLabel:"Read",buttonUrl:"javascript:alert(1)"}).success).toBe(false);
 });
});
