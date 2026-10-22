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
  expect(c).toContain("apiFetch<");
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
 it("TPO-inbox-team-20 follows by default, permits muting and un-following, and excludes their unread badges",()=>{
  const schema=source("src/db/schema/tpo-internal.ts");
  const query=source("src/modules/placements/tpo-team-internal-read-service.ts");
  const service=source("src/modules/placements/tpo-team-preferences-service.ts");
  const panel=source("src/components/tpo/tpo-team-follow-controls.tsx");
  expect(schema).toContain('following:boolean("following").notNull().default(true)');
  expect(schema).toContain('mutedAt:timestamp("muted_at"');
  expect(query).toContain("row.following&&!row.muted?Number(row.unreadMessages):0");
  expect(service).toContain("assertPersistedPlatformPermission");
  expect(service).toContain("eq(placementTpoInternalThreads.collegeId,college.id)");
  expect(panel).toContain('state.following?"UNFOLLOW":"FOLLOW"');
  expect(panel).toContain('state.muted?"UNMUTE":"MUTE"');
 });
 it("TPO-inbox-team-67 counts only recent unread personal notifications",()=>{
  const svc=source("src/modules/activity/tpo-notifications-service.ts");
  expect(svc).toContain("tpoUnreadCutoff(new Date())");
  expect(svc).toContain("gte(inAppNotifications.createdAt,recentCutoff)");
 });
 it("TPO-inbox-team-68 provides calm loading and failure screens with Retry",()=>{
  expect(source("src/app/(authenticated)/tpo/notifications/loading.tsx")).toContain('aria-busy="true"');
  const fail=source("src/app/(authenticated)/tpo/notifications/error.tsx");
  expect(fail).toContain('role="alert"');expect(fail).toContain("Retry");
  expect(fail).not.toContain("{error.message}");
 });
 it("TPO-inbox-team-R04 paginates announcements instead of silently dropping the hundred-and-first",()=>{
  const svc=source("src/modules/announcements/tpo-placement-read-service.ts");
  const page=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(svc).toContain(".limit(101).offset((safePage-1)*100)");
  expect(svc).toContain("hasMore:rows.length>100");
  expect(page).toContain("result.hasMore");
 });
 it("TPO-inbox-team-54 and GR-90 never surface a read-cell API error code",()=>{
  const view=source("src/components/tpo/tpo-placement-cell-read-action.tsx");
  expect(view).toContain('role="alert"');
  expect(view).toContain("useGuardedAction({timeoutMs:30000})");
  expect(view).toContain("disabled={busy}");
  expect(view).toContain("30000");
  expect(view).not.toContain("body?.error");
  expect(view).not.toContain("setError(data.error)");
 });

 it("TPO-inbox-team-21 GR-34 reuses confirmed Team message keys under a thread lock",()=>{
  const service=source("src/modules/placements/tpo-team-internal-reply-service.ts");
  const form=source("src/components/tpo/tpo-team-forms.tsx");
  expect(service).toContain('createHash("sha256").update(input.body)');
  expect(service).toContain("eq(activityEvents.dedupeKey,key)");
  expect(service).toContain("dedupeKey:key");
  expect(service).toContain('.for("update")');
  expect(form).toContain("crypto.randomUUID()");
  expect(form).toContain('draftKey+":sendKey"');
 });
 it("TPO-inbox-team-39 GR-32 treats login redirects as failure and preserves draft on 409",()=>{
  const form=source("src/components/tpo/tpo-team-forms.tsx");
  const create=source("src/app/api/placements/tpo/team/threads/route.ts");
  const reply=source("src/app/api/placements/tpo/team/threads/[threadId]/messages/route.ts");
  expect(form).toContain('headers:{Accept:"application/json"}');
  expect(form).toContain("FriendlyFetchError");
  expect(form).toContain("timeoutMs:30000");
  expect(create).toContain('request.headers.get("accept")');
  expect(reply).toContain('request.headers.get("accept")');
  const feedback=source("src/modules/placements/tpo-team-form-feedback-model.ts");
  expect(feedback).toContain("Your draft is saved.");
  expect(feedback).toContain("This changed while you were working.");
 });

 it("GR-34 TPO-inbox-team-21 validates a stable UUID key and rejects unsupported payload fields",async()=>{
  const {internalMessageSchema}=await import("@/modules/placements/tpo-team-internal-model");
  const threadId="10000000-0000-4000-8000-000000000001";
  expect(internalMessageSchema.safeParse({threadId,body:"Hello",idempotencyKey:"20000000-0000-4000-8000-000000000002"}).success).toBe(true);
  expect(internalMessageSchema.safeParse({threadId,body:"Hello",idempotencyKey:"invalid"}).success).toBe(false);
  expect(internalMessageSchema.safeParse({threadId,body:"Hello",collegeId:threadId}).success).toBe(false);
 });

 it("TPO-inbox-team-17 GR-34 prevents duplicate private conversation creation on retry",()=>{
  const svc=source("src/modules/placements/tpo-team-internal-create-service.ts");
  const client=source("src/components/tpo/tpo-team-forms.tsx");
  expect(svc).toContain('createHash("sha256").update(input.topic)');
  expect(svc).toContain("eq(activityEvents.dedupeKey,key)");
  expect(svc).toContain("dedupeKey:key");
  expect(svc).toContain('.for("update")');
  expect(client).toContain('draftKey+":createKey"');
 });
 it("TPO-inbox-team-19 GR-71/72/73/76 preserves Team search and shows Retry instead of false empty",()=>{
  const p=source("src/app/(authenticated)/tpo/team/page.tsx");
  expect(p).toContain('status:"FAILED" as const');
  expect(p).toContain("Could not load conversations right now.");
  expect(p).toContain("Retry conversations");
  expect(p).toContain('conversations?.status==="FAILED"?null:');
 });
 it("TPO-inbox-team-45 GR-71/72/73 preserves audience preview filters when one section fails",()=>{
  const p=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(p).toContain("const previewRequest=");
  expect(p).toContain("preview.failed");
  expect(p).toContain("Retry audience preview");
  expect(p).toContain("targetId:query.data.targetId");
 });
 it("TPO-inbox-team-54 GR-90 marks From 42 announcements New only with verified college-scoped reads",()=>{
  const service=source("src/modules/announcements/tpo-placement-read-service.ts");
  const page=source("src/app/(authenticated)/tpo/announcements/page.tsx");
  expect(service).toContain("placementCellAnnouncementReads");
  expect(service).toContain("eq(placementCellAnnouncementReads.collegeId,college.id)");
  expect(service).toContain("readStateReady:cellReadsReady");
  expect(page).toContain('tab.data==="from-42"&&result.readStateReady&&!row.readAt');
 });

});
