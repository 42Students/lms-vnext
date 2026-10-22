import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";

describe("recruiter digest legacy tenant link",()=>{
 it("uses a verified primary college host and safe platform fallback",()=>{
  const source=readFileSync("src/modules/placements/recruiter-message-email-provider.ts","utf8");
  expect(source).toContain("eq(tenantDomains.collegeId,collegeId)");
  expect(source).toContain("eq(tenantDomains.isVerified,true)");
  expect(source).toContain("eq(tenantDomains.isPrimary,true)");
  expect(source).toContain("isNull(tenantDomains.deletedAt)");
  expect(source).toContain("verifiedCollegeEmailHost(collegeId,[primary])");
  expect(source).toContain("recruiterDigestWorkspaceUrl(env,digest.collegeId)");
  expect(source).toContain('digest.collegeName+" Campus Recruitment"');
  expect(source).toContain("safeRecruiterHeaderName");
 });
});
