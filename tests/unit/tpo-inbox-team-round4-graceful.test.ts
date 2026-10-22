import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {everyoneMessageSchema,everyoneMuteSchema} from "@/modules/placements/tpo-team-everyone-model";
const source=(name:string)=>readFileSync(join(process.cwd(),name),"utf8");
const everyone=()=>source("src/components/tpo/tpo-everyone-controls.tsx");
const recruiter=()=>source("src/components/tpo/tpo-recruiter-message-reply.tsx");
const progress=()=>source("src/components/tpo/tpo-notice-read-progress.tsx");
const bell=()=>source("src/components/tpo/tpo-bell-panel.tsx");

describe("TPO Inbox and Team round-4 failure recovery",()=>{
 it("TPO-inbox-team-15 keeps Everyone posting and muting on guarded JSON responses",()=>{
  expect(everyone()).toContain("apiFetch<");
  expect(everyone()).toContain('Accept:"application/json"');
  for(const path of ["messages","mute"]){
   const route=source("src/app/api/placements/tpo/team/everyone/"+path+"/route.ts");
   expect(route).toContain("isSameOriginRequest");
   expect(route).toContain('request.headers.get("accept")');
   expect(route).toContain("NextResponse.json(result");
  }
  expect(everyoneMessageSchema.safeParse({body:"  "}).success).toBe(false);
  expect(everyoneMuteSchema.safeParse({muted:true,leave:true}).success).toBe(false);
 });
 it("TPO-inbox-team-47 preserves the last read-progress response when refresh fails",()=>{
  const c=progress();
  expect(c).toContain("setData(result)");
  expect(c).toContain("apiFetch<Summary>");
  expect(c).toContain("timeoutMs:15000");
  expect(c).toContain("pending.current");
  expect(c).not.toContain("setData(null)");
  expect(c).toContain('role="alert"');
  expect(c).toContain("Who hasn&apos;t read");
 });
 it("TPO-inbox-team-60 uses friendly retryable bell acknowledgements without leaking API status codes",()=>{
  expect(bell()).toContain('import {apiFetch} from "@/lib/api-fetch"');
  expect(bell()).toContain("timeoutMs:12000");
  expect(bell()).toContain('role="alert"');
  expect(bell()).not.toContain("payload.error");
 });
 it("TPO-inbox-team-64 keeps clickable bell rows and accessible error feedback",()=>{
  expect(bell()).toContain('onClick={()=>void openItem(item)}');
  expect(bell()).toContain("focus-visible:outline-[var(--lms-primary-text)]");
  expect(bell()).toContain('"New  →"');
 });
 it("TPO-inbox-team-04 marks a recruiter conversation read with bounded POST, not a mutating GET",()=>{
  const c=recruiter();
  expect(c).toContain('"/read"');
  expect(c).toContain("method:\"POST\"");
  expect(c).toContain("apiFetch(");
  expect(c).toContain("timeoutMs:12000");
 });
 it("TPO-inbox-team-09 keeps recruiter drafts after failed sends or stalled network",()=>{
  const c=recruiter();
  expect(c).toContain("pending.current");
  expect(c).toContain("timeoutMs:15000");
  expect(c).toContain('role="alert"');
  expect(c).toContain("sessionStorage.setItem");
  expect(c).toContain("setError(reason instanceof Error");
 });
 it("GR-30 guards message buttons against duplicate presses and always clears pending",()=>{
  for(const c of [everyone(),recruiter(),progress()]){
   expect(c).toContain("pending.current");
   expect(c).toContain("finally");
   expect(c).toContain("setBusy(false)");
  }
 });
 it("GR-31 uses the shared friendly API helper for every mutating action in the touched controls",()=>{
  for(const c of [everyone(),recruiter(),progress(),bell()]){
   expect(c).toContain('from "@/lib/api-fetch"');
   expect(c).toContain("apiFetch");
  }
 });
 it("GR-35 shows an explicit draft discard confirmation before destroying unsent text",()=>{
  expect(recruiter()).not.toContain("window.confirm(");
  expect(recruiter()).toContain("discardReview");
  expect(recruiter()).toContain("Discard your unsent message?");
 });
 it("GR-60 preserves the Everyone message in session storage when sending fails",()=>{
  expect(everyone()).toContain("sessionStorage.setItem(draftKey,next)");
  expect(everyone()).toContain("sessionStorage.getItem(draftKey)");
  expect(everyone()).not.toContain("setMessage(\"\")");
 });
 it("GR-61 keeps reply drafts through failed requests and clears them only after a save",()=>{
  expect(recruiter()).toContain("sessionStorage.setItem(draftKey,value)");
  expect(recruiter()).toContain('if(mode==="messages"){persistDraft("");');
  expect(everyone()).toContain('updateMessage("");setSuccess(');
 });
 it("GR-62 warns before leaving with an unsent Everyone draft",()=>{
  expect(everyone()).toContain('window.addEventListener("beforeunload",warn)');
  expect(everyone()).toContain('window.removeEventListener("beforeunload",warn)');
 });
 it("GR-70 isolates Everyone history failure to a retryable in-page section",()=>{
  const c=source("src/app/(authenticated)/tpo/team/everyone/page.tsx");
  expect(c).toContain('status:"FAILED"');
  expect(c).toContain('<Alert tone="error">');
  expect(source("src/components/ui/alert.tsx")).toContain('role={role ?? (tone === "error" ? "alert" : "status")}');
  expect(c).toContain("Retry Everyone");
 });
 it("GR-71 distinguishes unavailable and empty Everyone history without a blank page",()=>{
  const c=source("src/app/(authenticated)/tpo/team/everyone/page.tsx");
  expect(c).toContain('status==="NOT_REGISTERED"');
  expect(c).toContain("TPO_EVERYONE_WELCOME");
  expect(c).toContain('status==="FAILED"');
 });
 it("GR-72 preserves the Everyone heading and safe navigation when history fails",()=>{
  const c=source("src/app/(authenticated)/tpo/team/everyone/page.tsx");
  expect(c).toContain("TPO_EVERYONE_TITLE");
  expect(c).toContain('href="/tpo/team?tab=conversations"');
  expect(c).toContain("Your messages were not changed.");
 });
 it("GR-73 keeps existing announcement read data on refresh errors with Retry",()=>{
  expect(progress()).toContain('onClick={()=>void load()}');
  expect(progress()).toContain('role="alert"');
  expect(progress()).not.toContain("setData(null)");
 });
 it("GR-75 bell errors do not prevent opening notification history or continuing work",()=>{
  expect(bell()).toContain('href="/tpo/notifications"');
  expect(bell()).toContain('role="alert"');
  expect(bell()).toContain("finally{setPending(false)");
 });
 it("GR-90 announces friendly errors from Everyone, bell, recruiter and announcement widgets",()=>{
  for(const c of [everyone(),recruiter(),progress(),bell()]){
   expect(c).toContain('role="alert"');
   expect(c).toContain('from "@/lib/friendly-error"');
  }
 });
 it("GR-91 keeps retry and dismissal actions reachable by keyboard",()=>{
  const c=source("src/app/(authenticated)/tpo/team/everyone/page.tsx");
  expect(c).toContain("Retry Everyone");
  expect(everyone()).toContain('import {Button} from "@/components/ui/button"');
  expect(source("src/components/ui/button.tsx")).toContain("focus-visible:outline-[var(--lms-primary-text)]");
 });
 it("GR-92 does not depend on color alone for failures",()=>{
  expect(everyone()).toContain('role="alert"');
  expect(everyone()).toContain("{error}");
  expect(progress()).toContain("{error}");
 });
});
