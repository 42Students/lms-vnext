import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("SA-RETENTION-STALENESS-08 consistent last-activity cutoff and first-200 ordering",()=>{
 it("uses the same most-recent stage/application activity for both staleness and sorting",()=>{
  const source=readFileSync("src/modules/admin-ui/super-admin-placement-retention-service.ts","utf8");
  expect(source).toContain("const lastActivity=sql<Date>");
  expect(source).toContain("greatest(${placementApplications.updatedAt}");
  expect(source).toContain("coalesce(${placementCollegeApplicationStages.updatedAt}");
  expect(source).toContain("stage:placementCollegeApplicationStages.stage,lastUpdated:lastActivity");
  expect(source).toContain("lte(lastActivity,cutoff)");
  expect(source).toContain(".orderBy(asc(lastActivity),asc(placementApplications.id)).limit(201)");
  expect(source).not.toContain(".orderBy(asc(placementApplications.updatedAt)");
  expect(source).toContain("rows:rows.slice(0,200),truncated:rows.length>200");
 });
 it("does not leak another college's candidate or use a foreign job identifier as access",()=>{
  const source=readFileSync("src/modules/admin-ui/super-admin-placement-retention-service.ts","utf8");
  expect(source).toContain('requireSuperAdminSelectedCollege(context,"placements.read")');
  expect(source).toContain("eq(placementJobs.collegeId,selected.collegeId)");
  expect(source).toContain("eq(collegeMemberships.collegeId,selected.collegeId)");
  expect(source).toContain("eq(placementCollegeApplicationStages.jobId,placementJobs.id)");
 });
});
