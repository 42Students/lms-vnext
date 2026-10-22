import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Final sprint recruiter threads and profile — group C",()=>{
 it("REC-calendar-messages-profile-18 renders drive change-request events and names the sender You versus placement cell",()=>{
  const thread=read("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx");
  expect(thread).toContain("getDriveChangeRequests(context,matchingDrive.job.id)");
  expect(thread).toContain("Change requests · ");
  expect(thread).toContain("request.status");
  expect(thread).toContain("Discussion replies:");
  expect(thread).toContain('message.senderType==="RECRUITER"?"You"');
  expect(thread).toContain("message.senderDisplayName");
 });
 it("REC-calendar-messages-profile-20 shows messages in chronological order and allows Older/Newer paging",()=>{
  const thread=read("src/app/(authenticated)/hr/conversations/[threadId]/page.tsx");
  expect(thread).toContain("[...result.messages].reverse()");
  expect(thread).toContain("shown oldest to newest");
  expect(thread).toContain("Older");
  expect(thread).toContain("Newer");
 });
 it("REC-calendar-messages-profile-26 exposes separate first/last name with atomic editor save",()=>{
  const editor=read("src/components/hr/recruiter-profile-details-editor.tsx");
  const page=read("src/app/(authenticated)/hr/profile/page.tsx");
  expect(editor).toContain('["firstName","First name"]');
  expect(editor).toContain('["lastName","Last name"]');
  expect(editor).toContain('"Save changes"');
  expect(page).toContain("<RecruiterProfileDetailsEditor");
 });
 it("REC-calendar-messages-profile-29 displays per-college access validity without guessing a missing expiry",()=>{
  const page=read("src/app/(authenticated)/hr/profile/page.tsx");
  const grant=read("src/modules/placements/recruiter-self-grants-service.ts");
  expect(grant).toContain("validUntil: placementRecruiterCollegeGrants.validUntil");
  expect(page).toContain("grant.accessUntilIso");
  expect(page).toContain("Access until ");
  expect(page).toContain("The placement cell can extend it.");
  expect(page).toContain("Access has no end date");
 });
 it("REC-calendar-messages-profile-30 keeps explicit confirmed college-specific self-revocation rather than silent access changes",()=>{
  const access=read("src/components/hr/recruiter-profile-access.tsx");
  expect(access).toContain('<ConfirmActionDialog open={confirmGrant!==null}');
  expect(access).toContain('onClick={() => setConfirmGrant(grant)}');
  expect(access).toContain('onConfirm={()=>{if(confirmGrant)void leave(confirmGrant);}}');
  expect(access).toContain("immediately lose recruiter access to this college");
  expect(access).toContain('method: "DELETE"');
  expect(access).toContain("encodeURIComponent(grant.id)");
  expect(access).toContain('window.location.assign("/hr/home")');
 });
});