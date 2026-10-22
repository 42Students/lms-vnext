import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
const src=(p:string)=>readFileSync(p,"utf8");
const list=()=>src("src/app/(authenticated)/hr/conversations/page.tsx");
const detail=()=>src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx");
describe("Final sprint recruiter conversations verification",()=>{
 it("REC-calendar-messages-profile-09 shows unread/threads toolbar and searches authorized message bodies",()=>{
  const page=list(),service=src("src/modules/placements/hr-conversation-inbox-service.ts");
  expect(page).toContain("result.unreadTotal");
  expect(page).toContain("with new messages on this page");
  expect(page).toContain("Search by drive or message");
  expect(service).toContain("inArray(placementTpoMessages.threadId,accessibleIds)");
  expect(service).toContain("messageMatches");
 });
 it("REC-calendar-messages-profile-10 renders Company · Job, General, n new and relative activity",()=>{
  const page=list();
  expect(page).toContain('context.recruiter?.companyName??"Company"');
  expect(page).toContain('"General"');
  expect(page).toContain("{row.unread} new");
  expect(page).toContain("timeAgo(row.lastMessageAt,displayNow)");
 });
 it("REC-calendar-messages-profile-11 keeps the General discussion in the inbox with reply and controlled open action",()=>{
  const page=list();
  expect(page).toContain("Talk to the placement cell");
  expect(page).toContain("Placement cell · General");
  expect(page).toContain("<RecruiterConversationReplyForm");
  expect(page).toContain('action="/api/placements/recruiter/conversations/open"');
 });
 it("REC-calendar-messages-profile-13 refreshes visible recruiter discussions at four seconds and on focus without GET writes",()=>{
  const refresh=src("src/components/hr/recruiter-conversation-live-refresh.tsx");
  expect(list()).toContain("<RecruiterConversationLiveRefresh");
  expect(detail()).toContain("<RecruiterConversationLiveRefresh");
  expect(refresh).toContain("window.setInterval(()=>{void update();},4000)");
  expect(refresh).toContain('document.visibilityState!=="visible"');
  expect(refresh).toContain('window.addEventListener("focus",refresh.current)');
  expect(refresh).toContain('window.removeEventListener("focus",refresh.current)');
  expect(refresh).not.toContain("fetch(");
 });
 it("REC-calendar-messages-profile-14 acknowledges incoming thread read state by explicit client POST on open",()=>{
  const ctrl=src("src/components/hr/recruiter-conversation-read-control.tsx");
  expect(detail()).toContain("<RecruiterConversationReadControl");
  expect(ctrl).toContain('method:"POST"');
  expect(ctrl).toContain('"/acknowledge"');
  expect(ctrl).toContain("acknowledgedOnOpen.current=true");
  expect(ctrl).toContain("router.refresh()");
 });
 it("REC-calendar-messages-profile-15 preserves precise message validation and true send-versus-refresh feedback",()=>{
  const form=src("src/components/hr/recruiter-conversation-reply-form.tsx");
  expect(form).toContain("Write a message first");
  expect(form).toContain("Message sent, but the conversation could not refresh");
  expect(form).toContain("Could not send.");
  expect(hrReplyErrorMessage(400)).toContain("under 4000 characters");
  expect(form).toContain("event.ctrlKey||event.metaKey");
 });
 it("REC-calendar-messages-profile-18 includes current drive change requests and recruiter/placement sender attribution",()=>{
  const page=detail();
  expect(page).toContain('label="Drive change request updates"');
  expect(page).toContain("Discussion replies:");
  expect(page).toContain("Placement-cell response:");
  expect(page).toContain('message.senderType==="RECRUITER"?"You"');
  expect(page).toContain('"?tab=requests"');
 });
 it("REC-calendar-messages-profile-20 identifies conversation pagination and both oldest/newest navigation",()=>{
  const page=detail();
  expect(page).toContain("Messages on this page are shown oldest to newest.");
  expect(page).toContain("Older and Newer");
  expect(page).toContain("Newest messages");
  expect(page).toContain("Oldest messages");
 });
 it("REC-calendar-messages-profile-R02 makes current authorized drive/General subject and scope evident in details",()=>{
  const page=detail();
  expect(page).toContain('const conversationSubject=result.thread.jobId');
  expect(page).toContain('title={conversationSubject}');
  expect(page).toContain("Open drive:");
  expect(page).toContain('"/hr/conversations?collegeId="+result.thread.collegeId');
 });
 it("REC-calendar-messages-profile-09 independent final-sprint acceptance regression",()=>{
  expect(src("src/modules/placements/hr-conversation-inbox-service.ts")).toContain("inArray(placementTpoMessages.threadId,accessibleIds)");
  expect(src("src/modules/placements/hr-conversation-inbox-service.ts")).toContain("messageMatches.map(row=>row.threadId)");
  expect(src("src/app/(authenticated)/hr/conversations/page.tsx")).toContain("Search by drive or message");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-09 |");
 });

 it("REC-calendar-messages-profile-10 independent final-sprint acceptance regression",()=>{
  expect(src("src/app/(authenticated)/hr/conversations/page.tsx")).toContain("context.recruiter?.companyName??\"Company\"");
  expect(src("src/app/(authenticated)/hr/conversations/page.tsx")).toContain("{row.unread} new");
  expect(src("src/app/(authenticated)/hr/conversations/page.tsx")).toContain("timeAgo(row.lastMessageAt,displayNow)");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-10 |");
 });

 it("REC-calendar-messages-profile-11 independent final-sprint acceptance regression",()=>{
  expect(src("src/app/(authenticated)/hr/conversations/page.tsx")).toContain("Talk to the placement cell");
  expect(src("src/app/(authenticated)/hr/conversations/page.tsx")).toContain("aria-label=\"General placement-cell messages\"");
  expect(src("src/components/hr/recruiter-conversation-reply-form.tsx")).toContain("event.ctrlKey||event.metaKey");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-11 |");
 });

 it("REC-calendar-messages-profile-13 independent final-sprint acceptance regression",()=>{
  expect(src("src/components/hr/recruiter-conversation-live-refresh.tsx")).toContain("document.visibilityState!==\"visible\"");
  expect(src("src/components/hr/recruiter-conversation-live-refresh.tsx")).toContain("current.closest(\"input,textarea,select,[contenteditable=true]\")");
  expect(src("src/components/hr/recruiter-conversation-live-refresh.tsx")).toContain("window.setInterval(()=>{void update();},4000)");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-13 |");
 });

 it("REC-calendar-messages-profile-14 independent final-sprint acceptance regression",()=>{
  expect(src("src/components/hr/recruiter-conversation-read-control.tsx")).toContain("acknowledgedOnOpen.current=true");
  expect(src("src/components/hr/recruiter-conversation-read-control.tsx")).toContain("method:\"POST\",credentials:\"same-origin\"");
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("<RecruiterConversationReadControl threadId={result.thread.id}");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-14 |");
 });

 it("REC-calendar-messages-profile-15 independent final-sprint acceptance regression",()=>{
  expect(src("src/components/hr/recruiter-conversation-reply-form.tsx")).toContain("\"Write a message first\"");
  expect(src("src/components/hr/recruiter-conversation-reply-form.tsx")).toContain("setNotice(\"Message was not sent. Could not send. \"+feedback)");
  expect(src("src/components/hr/recruiter-conversation-reply-form.tsx")).toContain("Message sent, but the conversation could not refresh. Retry to load the latest messages.");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-15 |");
 });

 it("REC-calendar-messages-profile-18 independent final-sprint acceptance regression",()=>{
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("getDriveChangeRequests(context,matchingDrive.job.id)");
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("Discussion replies: {request.messages.length}");
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("message.senderType===\"RECRUITER\"?\"You\"");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-18 |");
 });

 it("REC-calendar-messages-profile-20 independent final-sprint acceptance regression",()=>{
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("[...result.messages].reverse()");
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("Newest messages");
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("Oldest messages");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-20 |");
 });

 it("REC-calendar-messages-profile-R02 independent final-sprint acceptance regression",()=>{
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("const conversationSubject=result.thread.jobId");
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("title={conversationSubject}");
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("Open drive:");
  expect(src("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx")).toContain("\"/hr/conversations?collegeId=\"+result.thread.collegeId");
  expect(src("docs/audit/acceptance/recruiter-calendar-messages-profile-verification.md")).toContain("| REC-calendar-messages-profile-R02 |");
 });

});