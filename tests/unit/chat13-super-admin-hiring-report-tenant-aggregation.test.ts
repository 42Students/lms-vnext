import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read=()=>readFileSync("src/modules/admin-ui/super-admin-hiring-report-service.ts","utf8");

describe("SA-HIRING-REPORT-SCOPE-03 tenant-safe job pipeline analytics",()=>{
  it("filters candidate memberships on the joined application, before COUNT DISTINCT aggregation",()=>{
    const service=read();
    const applicationJoin=service.slice(service.indexOf(".leftJoin(placementApplications,"),service.indexOf(".leftJoin(placementCollegeApplicationStages,"));
    expect(applicationJoin).toContain("eq(placementApplications.jobId,placementJobs.id)");
    expect(applicationJoin).toContain("applicationFilters");
    expect(applicationJoin).toContain("exists(db.select({id:collegeMemberships.id}).from(collegeMemberships)");
    expect(applicationJoin).toContain("eq(collegeMemberships.id,placementApplications.membershipId)");
    expect(applicationJoin).toContain("eq(collegeMemberships.collegeId,selected.collegeId)");
    expect(applicationJoin).not.toContain(".leftJoin(collegeMemberships");
    expect(service).toContain("count(distinct ${placementApplications.id})");
    expect(service.indexOf(".leftJoin(placementApplications,")).toBeLessThan(service.indexOf(".groupBy("));
  });

  it("preserves zero-application jobs while keeping selected organization and employer relationship boundaries",()=>{
    const source=read();
    expect(source).toContain(".from(placementJobs)");
    expect(source).toContain(".leftJoin(placementApplications,");
    expect(source).not.toContain(".innerJoin(placementApplications,");
    expect(source).toContain("eq(placementCompanyRelationships.collegeId,selected.collegeId)");
    expect(source).toContain("eq(colleges.id,selected.collegeId)");
    expect(source).toContain("eq(colleges.organizationId,selected.organizationId)");
    expect(source).toContain("requireSuperAdminSelectedCollege(context,\"placements.read\")");
    expect(source).toContain(".limit(SUPER_ADMIN_HIRING_EXPORT_CAP+1)");
    expect(source).toContain("truncated:result.length>SUPER_ADMIN_HIRING_EXPORT_CAP");
  });

  it("SA-HIRING-ACADEMIC-04 cannot match a forged cohort unrelated to the enrollment program",()=>{
    const s=read();
    expect(s).toContain("eq(learnerProgramEnrollments.membershipId,placementApplications.membershipId)");
    expect(s).toContain("eq(learnerProgramEnrollments.status,\"ACTIVE\")");
    expect(s).toContain("eq(departments.collegeId,selected.collegeId)");
    expect(s).toContain("eq(cohorts.id,learnerProgramEnrollments.cohortId)");
    expect(s).toContain("eq(cohorts.programId,learnerProgramEnrollments.programId)");
    expect(s).toContain("query.cohortId?eq(cohorts.id,query.cohortId):undefined");
  });
});
