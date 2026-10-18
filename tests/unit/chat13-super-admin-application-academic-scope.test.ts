import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("SA-APPLICATIONS-ACADEMIC-05 Super Admin application facet correctness",()=>{
 it("filters only a current learner enrollment consistently paired to its cohort's program",()=>{
  const source=readFileSync("src/modules/admin-ui/super-admin-placement-applications-service.ts","utf8");
  expect(source).toContain("requireSuperAdminSelectedCollege(context,\"placements.read\")");
  expect(source).toContain("eq(placementJobs.collegeId,selected.collegeId)");
  expect(source).toContain("eq(collegeMemberships.collegeId,selected.collegeId)");
  expect(source).toContain("eq(departments.collegeId,selected.collegeId)");
  expect(source).toContain("eq(cohorts.id,learnerProgramEnrollments.cohortId)");
  expect(source).toContain("eq(cohorts.programId,learnerProgramEnrollments.programId)");
  expect(source).toContain('eq(learnerProgramEnrollments.status,"ACTIVE")');
  expect(source).toContain("query.cohortId?eq(cohorts.id,query.cohortId):undefined");
  expect(source).toContain("query.departmentId?eq(departments.id,query.departmentId):undefined");
  expect(source).toContain("query.programId?eq(programs.id,query.programId):undefined");
  // The facets qualify a correlated EXISTS. No cross-college program
  // should create extra application rows or alter the page denominator.
  expect(source).toContain("exists(db.select({id:learnerProgramEnrollments.id})");
  expect(source).toContain("eq(learnerProgramEnrollments.membershipId,placementApplications.membershipId)");
 });
});
