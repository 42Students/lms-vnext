import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {RecruiterConversationReplyForm} from "@/components/hr/recruiter-conversation-reply-form";
import {RecruiterConversationReadControl} from "@/components/hr/recruiter-conversation-read-control";
import {readFileSync} from "node:fs";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn(),push:vi.fn()})}));
const threadA="11111111-1111-4111-8111-111111111111";
const threadB="22222222-2222-4222-8222-222222222222";
describe("HR-BREAK-CONVO-THREAD-SCOPE-37 private reply and read state isolation",()=>{
 it("a different recruiter thread gets a new private reply draft instance",()=>{
  const first=RecruiterConversationReplyForm({threadId:threadA});
  const second=RecruiterConversationReplyForm({threadId:threadB});
  expect(first.key).toBe(threadA);
  expect(second.key).toBe(threadB);
  expect(first.key).not.toBe(second.key);
 });
 it("on-open acknowledge gate also belongs to each thread and not shared state",()=>{
  const first=RecruiterConversationReadControl({threadId:threadA});
  const second=RecruiterConversationReadControl({threadId:threadB});
  expect(first.key).toBe(threadA);
  expect(second.key).toBe(threadB);
 });
 it("new reply renders a blank message, guarded send, and discard protection",()=>{
  const html=renderToStaticMarkup(<RecruiterConversationReplyForm threadId={threadB}/>);
  expect(html).toContain("Reply to placement cell");
  expect(html).toContain('value=""');
  expect(html).toContain("Send reply");
  expect(html).not.toContain("Message sent");
 });
 it("a new thread acknowledgement starts in the unconfirmed state",()=>{
  const html=renderToStaticMarkup(<RecruiterConversationReadControl threadId={threadB}/>);
  expect(html).toContain("Mark placement cell messages as read");
  expect(html).not.toContain("Read status updated.");
 });
 it("keeps per-thread receipt URL and removes old browser listeners when remounted",()=>{
  const reply=readFileSync("src/components/hr/recruiter-conversation-reply-form.tsx","utf8");
  const read=readFileSync("src/components/hr/recruiter-conversation-read-control.tsx","utf8");
  expect(reply).toContain("key={threadId} threadId={threadId}");
  expect(read).toContain("key={threadId} threadId={threadId}");
  expect(reply).toContain('window.removeEventListener("beforeunload",warn)');
  expect(read).toContain("acknowledgedOnOpen.current=true");
  expect(read).toContain('"/api/placements/recruiter/conversations/"+encodeURIComponent(threadId)');
 });
});
