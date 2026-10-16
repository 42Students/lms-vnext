import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
describe("TPO-inbox-team-01/02 expired grant and readiness hardening",()=>{
 it("never lets an expired or pending recruiter grant authorize messaging",()=>{
  const service=readFileSync("src/modules/placements/tpo-messaging-service.ts","utf8");
  expect(service).toContain('eq(placementRecruiterCollegeGrants.verificationStatus, "VERIFIED")');
  expect(service).toContain("gt(placementRecruiterCollegeGrants.validUntil, new Date())");
 });
 it("renders a clear storage unavailability notice instead of false zero messages",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/messages/[threadId]/page.tsx","utf8");
  expect(page).toContain("Recruiter messaging tables are not registered");
  expect(page).toContain('role="alert"');
 });
});
