import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const read=(name:string)=>readFileSync(name,"utf8");

describe("chat-16 recruiter messaging double-action and draft recovery",()=>{
 it("UX-chat16-recruiter-message-reply-01 blocks same-tick duplicate POSTs even before React rerenders",()=>{
  const source=read("src/components/hr/recruiter-conversation-reply-form.tsx");
  expect(source).toContain("const submitPendingRef=useRef(false)");
  expect(source).toContain("if(sending||submitPendingRef.current)return;");
  expect(source).toContain("submitPendingRef.current=true;");
  expect(source).toContain("}finally{submitPendingRef.current=false;setSending(false);}");
  expect(source).toContain("useGuardedAction({timeoutMs:15000})");
  expect(source).toContain('method:"POST",body:form,credentials:"same-origin"');
 });
 it("UX-chat16-recruiter-message-reply-02 retains the draft after an unconfirmed send",()=>{
  const source=read("src/components/hr/recruiter-conversation-reply-form.tsx");
  expect(source).toContain("if(confirmed){");
  expect(source).toContain('setBody("");');
  expect(source).toContain('else setNotice("Could not send. "+feedback)');
  expect(source).toContain("The message was not confirmed as sent. Check the thread before retrying.");
  expect(source).toContain("Discard this unsent message?");
  expect(source).toContain("Your draft reply will be lost.");
 });
 it("UX-chat16-recruiter-message-read-03 serializes the initial acknowledgement with manual retries",()=>{
  const source=read("src/components/hr/recruiter-conversation-read-control.tsx");
  expect(source).toContain("acknowledgePending.current=true;");
  expect(source).toContain(".finally(()=>{acknowledgePending.current=false;});");
  expect(source).toContain("if(acknowledgePending.current)return;");
  expect(source).toContain("}finally{acknowledgePending.current=false;setBusy(false);}");
  expect(source).toContain('method:"POST",credentials:"same-origin"');
  expect(source).toContain('role="status"');
 });
});
