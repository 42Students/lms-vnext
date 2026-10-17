import {describe,it,expect} from "vitest";
import {canIssueRecruiterInvite} from "@/modules/placements/tpo-recruiter-invite-policy";
import {readFileSync} from "node:fs";
describe("TPO-recruiters-13 row/board invitation",()=>{
 const ready={inviteTokenHash:null,inviteSentAt:null,unsubscribedAt:null,
  manualStage:"NEW",recruiterUserId:null};
 it("refuses joined and unsubscribed leads; Not-now leads may still be invited manually",()=>{
  expect(canIssueRecruiterInvite(ready)).toBe(true);
  expect(canIssueRecruiterInvite({...ready,recruiterUserId:"recruiter"})).toBe(false);
  expect(canIssueRecruiterInvite({...ready,unsubscribedAt:new Date()})).toBe(false);
  expect(canIssueRecruiterInvite({...ready,manualStage:"NOT_NOW"})).toBe(true);
 });
 it("reveals a one-time link, never claims invitation email delivery",()=>{
  const s=readFileSync("src/components/tpo/recruiter-leads-workspace.tsx","utf8");
  expect(s).toContain("No email has been sent.");
  expect(s).toContain("sendEmail:false");
  expect(s).toContain("Fresh recruiter invite link");
 });
});
