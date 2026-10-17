import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Final sprint recruiter conversation parity — group B",()=>{
 it("REC-calendar-messages-profile-10 shows drive/job subject, General label, n new and relative last update",()=>{
  const inbox=read("src/app/(authenticated)/hr/conversations/page.tsx");
  expect(inbox).toContain('context.recruiter?.companyName??"Company"');
  expect(inbox).toContain(' : "General"');
  expect(inbox).toContain("{row.unread} new");
  expect(inbox).toContain("timeAgo(row.lastMessageAt,displayNow)");
 });
 it("REC-calendar-messages-profile-11 exposes in-place general conversation with history and reply",()=>{
  const inbox=read("src/app/(authenticated)/hr/conversations/page.tsx");
  const composer=read("src/components/hr/recruiter-conversation-reply-form.tsx");
  expect(inbox).toContain("Message the placement cell · General");
  expect(inbox).toContain("Placement cell · General");
  expect(inbox).toContain('aria-label="General placement-cell messages"');
  expect(inbox).toContain("<RecruiterConversationReplyForm");
  expect(composer).toContain("event.ctrlKey||event.metaKey");
  expect(inbox).toContain("Open general conversation");
 });
 it("REC-calendar-messages-profile-13 refreshes recruiter inbox and detail every four seconds while visible",()=>{
  const refresh=read("src/components/hr/recruiter-conversation-live-refresh.tsx");
  const inbox=read("src/app/(authenticated)/hr/conversations/page.tsx");
  const thread=read("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx");
  expect(refresh).toContain("window.setInterval(update,4000)");
  expect(refresh).toContain("router.refresh()");
  expect(inbox).toContain("<RecruiterConversationLiveRefresh");
  expect(thread).toContain("<RecruiterConversationLiveRefresh");
 });
 it("REC-calendar-messages-profile-14 acknowledges only incoming thread messages through client POST on open",()=>{
  const control=read("src/components/hr/recruiter-conversation-read-control.tsx");
  const detail=read("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx");
  expect(control).toContain("useEffect(");
  expect(control).toContain('"/api/placements/recruiter/conversations/"+encodeURIComponent(threadId)+"/acknowledge"');
  expect(control).toContain('method:"POST"');
  expect(detail).toContain("<RecruiterConversationReadControl");
 });
 it("REC-calendar-messages-profile-15 preserves legacy empty, length and send/refresh error wording",()=>{
  const form=read("src/components/hr/recruiter-conversation-reply-form.tsx");
  for(const phrase of ["Write a message first","Keep a message under 4000 characters",
   "Could not send.","Message sent, but the conversation could not refresh. Retry to load the latest messages."])
   expect(form).toContain(phrase);
  expect(form).toContain("message.length>4000");
  expect(form).toContain("Press Ctrl or Cmd+Enter to send.");
 });
});