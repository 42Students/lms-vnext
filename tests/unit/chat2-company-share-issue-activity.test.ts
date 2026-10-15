import {describe,it,expect} from "vitest";
import {companyShareLifecycleActivity} from "../../src/modules/placements/company-share/activity-model";
describe("company-share issuance immutable lifecycle audit",()=>{
 const scope={organizationId:"org",collegeId:"college",actorUserId:"user",
 actorMembershipId:"membership",jobId:"job",shareId:"share"};
 it("creates a tenant and actor scoped event without sensitive bearer token material",()=>{
  const row=companyShareLifecycleActivity("ISSUED",scope);
  expect(row.eventType).toBe("placements.company_share.issued");
  expect(row.subjectId).toBe("share");
  expect(row.metadata).toEqual({jobId:"job"});
  expect(JSON.stringify(row)).not.toMatch(/token|digest|email|resume|score/i);
 });
});
