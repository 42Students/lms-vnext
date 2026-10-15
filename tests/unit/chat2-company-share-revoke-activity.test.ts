import {describe,it,expect} from "vitest";
import {companyShareLifecycleActivity} from "../../src/modules/placements/company-share/activity-model";
describe("company-share revocation event",()=>{
 it("is distinguishable from link issuance and cannot disclose bearer credentials",()=>{
  const event=companyShareLifecycleActivity("REVOKED",{
   organizationId:"org",collegeId:"college",actorUserId:"user",
   actorMembershipId:"membership",jobId:"job",shareId:"id",
  });
  expect(event.eventType).toBe("placements.company_share.revoked");
  expect(event.actorMembershipId).toBe("membership");
  expect(event.metadata).toEqual({jobId:"job"});
  expect(Object.keys(event.metadata)).toEqual(["jobId"]);
 });
});
