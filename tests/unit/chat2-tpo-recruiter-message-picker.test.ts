import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-inbox-team-02 recruiter message picker",()=>{
 it("does not accept a client-supplied college scope",()=>{
  const route=readFileSync("src/app/api/placements/tpo/messages/threads/route.ts","utf8");
  expect(route).toContain("const input=z.strictObject({");
  expect(route).toContain("recruiterUserId:z.string().uuid()");
  expect(route).toContain("collegeId:membership.collegeId");
  expect(route).toContain("collegeId:membership.collegeId");
  expect(route).toContain("isSameOriginRequest");
 });
 it("requires verified non-expired access when listing recipients",()=>{
  const source=readFileSync("src/modules/placements/tpo-recruiter-message-recipients-service.ts","utf8");
  expect(source).toContain('eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED")');
  expect(source).toContain("gt(placementRecruiterCollegeGrants.validUntil,new Date())");
 });
});
