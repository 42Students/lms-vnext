import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {tpoTeamFormErrorMessage} from "@/modules/placements/tpo-team-form-feedback-model";
import {tpoNoticeFormErrorMessage} from "@/modules/announcements/tpo-notice-form-error-model";
const src=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
const messages=()=>src("src/app/(authenticated)/tpo/messages/page.tsx");
const team=()=>src("src/app/(authenticated)/tpo/team/page.tsx");
const announcements=()=>src("src/app/(authenticated)/tpo/announcements/page.tsx");
describe("Chat-2 TPO Inbox + Team legacy verification round 2",()=>{
 it("TPO-inbox-team-09 refreshes recruiter messages every four seconds and on focus without GET writes",()=>{
  expect(messages()).toContain("<TpoLiveRefresh intervalMs={4000}/>");
  const component=src("src/components/tpo/tpo-live-refresh.tsx");
  expect(component).toContain("document.visibilityState");
  expect(component).toContain('window.addEventListener("focus",refresh)');
  expect(component).toContain("router.refresh()");
  expect(component).not.toContain("fetch(");
 });
 it("TPO-inbox-team-11 never passes off own notification deliveries as recruiter messages",()=>{
  expect(messages()).toContain("if(!isRecruiterInbox)return");
  expect(messages()).toContain("Recruiter conversations are temporarily unavailable");
  expect(messages()).toContain('href="/tpo/notifications"');
 });
 it("TPO-inbox-team-13 provides phone-friendly conversation cards and All conversations back control",()=>{
  expect(messages()).toContain("md:hidden");
  expect(messages()).toContain("md:block");
  expect(messages()).toContain('aria-label="Recruiter conversations on phone"');
  expect(src("src/app/(authenticated)/tpo/messages/[threadId]/page.tsx")).toContain("All conversations");
 });
 it("TPO-inbox-team-14 redirects the duplicate read-state screen to the canonical notifications history",()=>{
  const route=src("src/app/(authenticated)/tpo/messages/notifications/page.tsx");
  expect(route).toContain('redirect("/tpo/notifications")');
  expect(route).not.toContain("listTpoOwnNotifications");
 });
 it("TPO-inbox-team-27 polls open Team conversations every 30 seconds and on focus",()=>{
  expect(src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx")).toContain("<TpoLiveRefresh intervalMs={30000}/>");
  expect(team()).toContain("<TpoLiveRefresh intervalMs={30000}/>");
 });
 it("TPO-inbox-team-39 maps API failures to inline feedback and retains unsent text",()=>{
  expect(tpoTeamFormErrorMessage("RECIPIENT_NOT_FOUND","CREATE")).toMatch(/no longer available/);
  expect(tpoTeamFormErrorMessage("INVALID_BODY","REPLY")).toMatch(/Write a message/);
  const forms=src("src/components/tpo/tpo-team-forms.tsx");
  expect(forms).toContain('role="alert"');
  expect(forms).toContain("setError(tpoTeamFormErrorMessage");
  expect(forms).toContain("value={body}");
  expect(forms).toContain("router.refresh()");
  expect(team()).toContain("<TpoTeamThreadCreate");
 });
 it("TPO-inbox-team-40 restores the exact legacy Team subtitle",()=>{
  expect(team()).toContain("Who does what, and what you decided. Recruiters and students never see this.");
 });
 it("TPO-inbox-team-48 shows scheduled and ended notices in the author list",()=>{
  const service=src("src/modules/announcements/tpo-placement-read-service.ts");
  expect(service).toContain('tab==="deleted"||tab==="yours"?[]');
  expect(announcements()).toContain("Scheduled for");
  expect(announcements()).toContain(">Ended</p>");
  expect(announcements()).toContain('name="sendAt"');
 });
 it("TPO-inbox-team-52 requires an explicit notice delete confirmation",()=>{
  const confirmation=src("src/components/tpo/tpo-notice-delete-confirm.tsx");
  expect(confirmation).toContain("Delete this announcement?");
  expect(confirmation).toContain("Students stop seeing it, and its notices are taken back.");
  expect(confirmation).toContain("event.preventDefault()");
  expect(announcements()).toContain("<TpoNoticeDeleteConfirm");
 });
 it("TPO-inbox-team-53 displays a post-save Undo notice and live countdown",()=>{
  expect(announcements()).toContain("<TpoNoticeUndoToast");
  expect(src("src/components/tpo/tpo-notice-undo-toast.tsx")).toContain("Undo send");
  expect(src("src/components/tpo/tpo-notice-undo-toast.tsx")).toContain("30000-");
 });
 it("TPO-inbox-team-56 displays exact To your students and From 42 legacy captions",()=>{
  expect(announcements()).toContain('["yours","To your students"]');
  expect(announcements()).toContain('["from-42","From 42"]');
  expect(announcements()).toContain("What you tell your students, to whom, and who has read it. They read it under Placements.");
  expect(announcements()).toContain("What 42 tells placement cells.");
 });
 it("TPO-inbox-team-58 rejects overlong announcement titles and bodies in create and edit forms",()=>{
  for(const file of ["src/modules/announcements/tpo-placement-write-service.ts",
    "src/modules/announcements/tpo-placement-edit-service.ts"]){
   expect(src(file)).toContain("max(200)");
   expect(src(file)).toContain("max(8000)");
  }
  expect(announcements()).toContain("maxLength={200}");
  expect(announcements()).toContain("maxLength={8000}");
 });
 it("TPO-inbox-team-65 restores the exact placement activity Notifications subtitle",()=>{
  expect(src("src/app/(authenticated)/tpo/notifications/page.tsx")).toContain(
   "A clean history of what happened across placements. Actionable work stays on Home under Needs you.");
 });
 it("TPO-inbox-team-66 marks all read without a blocking confirm and disables action at zero",()=>{
  const toolbar=src("src/components/activity/notification-toolbar.tsx");
  const bell=src("src/components/tpo/tpo-bell-panel.tsx");
  expect(toolbar).toContain("confirmMarkAll = false");
  expect(toolbar).toContain("unreadCount === 0");
  expect(bell).toContain("pending||unread===0");
  expect(bell).not.toContain("window.confirm(");
 });
 it("TPO-inbox-team-R03 accepts legacy from42 and students deep links",()=>{
  expect(announcements()).toContain('t==="from42"?"from-42":t==="students"?"yours":t');
 });
 it("TPO-inbox-team-R01 delivers recruiter message notifications to scoped TPO staff",()=>{
  const service=src("src/modules/placements/recruiter-message-tpo-notification-service.ts");
  expect(service).toContain("inAppNotifications");
  expect(service).toContain("recruiterMessageTpoPreview");
  expect(service).toContain("recruiterMessageTpoHref(input.threadId)");
  expect(service).toContain('eq(membershipRoles.role,"TPO")');
 });
 it("TPO-inbox-team-55 returns a user-facing error for invalid notice fields instead of JSON post navigation",()=>{
  expect(src("src/app/api/placements/tpo/announcements/route.ts")).toContain("noticePostError");
  expect(src("src/modules/announcements/tpo-notice-form-error-model.ts")).toContain("Give it a title.");
  expect(src("src/modules/announcements/tpo-notice-form-error-model.ts")).toContain("Write the announcement.");
  expect(announcements()).toContain('role="alert"');
  expect(tpoNoticeFormErrorMessage("BUTTON_URL_INVALID")).toBe("The link has to start with https://");
  expect(announcements()).toContain("formMinDateTime");
  expect(src("src/components/tpo/tpo-notice-schedule-controls.tsx")).toContain("min={minDateTime}");
 });
 it("TPO-inbox-team-64 makes bell rows clickable and includes New and relative date cues",()=>{
  const bell=src("src/components/tpo/tpo-bell-panel.tsx");
  expect(bell).toContain("w-full min-h-11");
  expect(bell).toContain("onClick={()=>void openItem(item)}");
  expect(bell).toContain('"New  →"');
 });
 it("TPO-inbox-team-R05 separates Team read positions from bell notification reads",()=>{
  const read=src("src/modules/placements/tpo-team-internal-read-service.ts");
  const ack=src("src/modules/placements/tpo-team-internal-ack-service.ts");
  const schema=src("src/db/schema/tpo-internal.ts");
  expect(read).toContain('placementTableExists("placement_tpo_internal_reads")');
  expect(read).toContain("m.created_at>coalesce");
  expect(read).toContain("unreadCount:row.following&&!row.muted?Number(row.unreadMessages):0");
  expect(read).toContain("m.author_membership_id<>");
  expect(read).toContain("and r.membership_id=");
  expect(ack).toContain("tx.insert(placementTpoInternalReads)");
  expect(ack).toContain("onConflictDoUpdate");
  expect(schema).toContain("placementTpoInternalReads=pgTable");
  expect(src("docs/proposed-migrations/tpo-inbox-team-read-receipts.sql")).toContain("tpo_internal_reads_pk");
 });
 it("TPO-inbox-team-49 displays a scoped notice CTA only when it is a safe HTTPS link",()=>{
  expect(announcements()).toContain('row.buttonUrl?.startsWith("https://")');
  expect(announcements()).toContain('rel="noopener noreferrer"');
  expect(src("src/modules/announcements/tpo-placement-read-service.ts")).toContain("buttonLabel:db10Announcements.buttonLabel");
 });
 it("TPO-inbox-team-50 restores optional HTTPS button and schedule modes",()=>{
  expect(announcements()).toContain("Button (optional)");
  expect(announcements()).toContain('name="buttonUrl"');
  expect(announcements()).toContain('maxLength={500}');
  expect(src("src/components/tpo/tpo-notice-schedule-controls.tsx")).toContain('mode==="LATER"');
  expect(src("src/modules/announcements/tpo-placement-write-service.ts")).toContain("buttonLabel:data.buttonLabel??null");
 });
 it("TPO-inbox-team-51 allows version-checked editing and clearing of optional CTA",()=>{
  const edit=src("src/modules/announcements/tpo-placement-edit-service.ts");
  expect(edit).toContain("buttonLabel:input.buttonLabel??null");
  expect(edit).toContain("buttonUrl:input.buttonUrl??null");
  expect(edit).toContain("eq(db10Announcements.version,input.expectedVersion)");
  expect(announcements()).toContain('defaultValue={row.buttonUrl??""}');
 });

 it("TPO-inbox-team-41 loads the latest five hundred messages and scrolls to the selected one",()=>{
  expect(src("src/modules/placements/tpo-team-conversation-service.ts")).toContain("const PAGE_SIZE = 500");
  const page=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  expect(page).toContain("<TpoTeamMessageScroll");
  expect(page).toContain('id={"team-message-"+message.id}');
  expect(page).toContain('role="log"');
  expect(src("src/components/tpo/tpo-team-message-scroll.tsx")).toContain("scrollIntoView");
 });
 it("TPO-inbox-team-30 accepts legacy ?c= and ?m= links and members tab without changing user scope",()=>{
  const page=team();
  expect(page).toContain("z.string().uuid().safeParse(threadId)");
  expect(page).toContain('redirect("/tpo/team/"+encodeURIComponent(threadId)+target)');
  expect(page).toContain('tabInput==="members"?"people":tabInput');
 });

 it("TPO-inbox-team-R07 gives native keyboard links, log landmarks, busy state and search hint",()=>{
  const message=src("src/app/(authenticated)/tpo/messages/[threadId]/page.tsx");
  const teamMessage=src("src/app/(authenticated)/tpo/team/[threadId]/page.tsx");
  expect(message).toContain('role="log" aria-live="polite" aria-busy={false}');
  expect(message).toContain("All conversations");
  expect(teamMessage).toContain('role="log" aria-live="polite" aria-busy={false}');
  expect(src("src/components/tpo/tpo-team-search.tsx")).toContain("Search (press /)");
  expect(messages()).toContain('aria-current={query.status===status?"page":undefined}');
 });

});
