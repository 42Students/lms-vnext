import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("G2-15-002-025/057 selected-student history scope",()=>{
 it("counts the same authorized company relationships as the paged history query",()=>{
  const source=readFileSync("src/modules/placements/college-placement-student-lookup-service.ts","utf8");
  const begin=source.indexOf("const [totalRow]=await db.select({total:count()}).from(placementApplications)");
  const end=source.indexOf("const [confirmedJoining]",begin);
  expect(begin).toBeGreaterThan(0);
  expect(end).toBeGreaterThan(begin);
  const countQuery=source.slice(begin,end);
  expect(countQuery).toContain("eq(placementJobs.collegeId,collegeId)");
  expect(countQuery).toContain("eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId)");
  expect(countQuery).toContain("eq(placementCompanyRelationships.collegeId,collegeId)");
  expect(countQuery).toContain(".where(appScope)");
 });
});
