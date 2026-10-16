import {describe,it,expect} from "vitest";
import {deriveTpoRecruiterInviteStatus} from "@/modules/placements/tpo-recruiter-lead-policy";
import {readFileSync} from "node:fs";
describe("TPO-recruiters-09 detail invite and stage fields",()=>{
 const base={recruiterUserId:null,inviteSentAt:null,inviteClickedAt:null,inviteBouncedAt:null};
 it("distinguishes sent, opened, bounced and joined",()=>{
  expect(deriveTpoRecruiterInviteStatus(base)).toBe("NOT_SENT");
  const t=new Date("2026-10-16T00:00:00Z");
  expect(deriveTpoRecruiterInviteStatus({...base,inviteSentAt:t})).toBe("SENT");
  expect(deriveTpoRecruiterInviteStatus({...base,inviteSentAt:t,inviteClickedAt:t})).toBe("CLICKED");
  expect(deriveTpoRecruiterInviteStatus({...base,inviteBouncedAt:t})).toBe("BOUNCED");
  expect(deriveTpoRecruiterInviteStatus({...base,recruiterUserId:"user"})).toBe("JOINED");
 });
 it("keeps owner scoped and derives last login from session creation",()=>{
  const source=readFileSync("src/modules/placements/tpo-crm-service.ts","utf8");
  expect(source).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(source).toContain("max(identityDeviceSessions.createdAt)");
  expect(source).toContain("stages.get(lead.id)");
 });
});
