import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {buildTpoRecruiterInviteMessage} from "@/modules/placements/tpo-recruiter-invite-message-model";
describe("TPO-recruiters-12 seven-day recruiter invitation message",()=>{
 it("builds a safely copyable message with optional note and expiry",()=>{
  const text=buildTpoRecruiterInviteMessage({
    recruiterName:"Jane",companyName:"Example Co",
    inviteUrl:"https://example.org/recruiter-invite/code",
    expiresAt:"2026-10-23T12:00:00.000Z",personalNote:"We would love to collaborate.",
  });
  expect(text).toContain("Hello Jane");
  expect(text).toContain("Example Co");
  expect(text).toContain("valid for seven days");
  expect(text).toContain("We would love to collaborate.");
  expect(text).toContain("https://example.org/recruiter-invite/code");
 });
 it("rejects javascript links and excessive personal notes",()=>{
  const args={
   recruiterName:"Jane",companyName:null,inviteUrl:"javascript:alert(1)",
   expiresAt:"2026-10-23T12:00:00.000Z",personalNote:"",
  };
  expect(()=>buildTpoRecruiterInviteMessage(args)).toThrow();
  expect(()=>buildTpoRecruiterInviteMessage({...args,inviteUrl:"https://example.org/a",personalNote:"x".repeat(501)})).toThrow();
 });
 it("shows preview, manual email draft, copy and guarded close",()=>{
  const source=readFileSync("src/components/tpo/recruiter-lead-detail-workspace.tsx","utf8");
  for(const text of ["Personal note","Invite link","Invitation preview","Copy message","Copy link","Also email it (open draft)","Close preview"])
   expect(source).toContain(text);
  expect(source).not.toContain("window.confirm");
  expect(source).toContain('<ConfirmDialog open={confirmation!==null}');
  expect(source).toContain('confirmation==="CLOSE_INVITE"');
 });
});
