import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("W1-1 Super Admin module impact must count the owning learner college",()=>{
 it("includes in-progress learner applications beyond initial submitted stage",()=>{
  const source=readFileSync("src/modules/module-access/admin-module-impact-service.ts","utf8");
  expect(source).toContain("notInArray(placementApplications.status");
  expect(source).toContain('"HIRED","REJECTED","WITHDRAWN"');
  expect(source).toContain("placementApplications.legacyWasDeleted");
  expect(source).toContain("eq(collegeMemberships.collegeId,collegeId)");
  expect(source).not.toContain('eq(placementApplications.status,"SUBMITTED")');
 });
 it("counts distinct future bookings only when attached to a real application and college member",()=>{
  const source=readFileSync("src/modules/module-access/admin-module-impact-service.ts","utf8");
  expect(source).toContain("countDistinct(placementRoundCandidateSlots.id)");
  expect(source).toContain("placementRoundCandidateSlots.applicationId");
  expect(source).toContain('eq(placementRoundCandidateSlots.status,"BOOKED")');
  expect(source).toContain("gt(placementRoundCandidateSlots.startsAt,new Date())");
  expect(source).toContain("assertCurrentImpactScope(ctx,collegeId,college.organizationId)");
 });
});
