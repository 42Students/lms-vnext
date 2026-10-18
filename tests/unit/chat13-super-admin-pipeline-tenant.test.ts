import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {projectSuperAdminDrivePipeline} from "@/modules/placements/super-admin-drive-pipeline-model";

describe("SA-PIPELINE-TENANT-02 selected-college application stage isolation",()=>{
  it("requires persisted membership-college equality before stage aggregation",()=>{
    const service=readFileSync("src/modules/placements/super-admin-drive-pipeline-service.ts","utf8");
    expect(service.indexOf("const job = await getPlacementJob(context, jobId)"))
      .toBeLessThan(service.indexOf("const counts = await getDb().select("));
    expect(service).toContain(".innerJoin(collegeMemberships,and(");
    expect(service).toContain("eq(collegeMemberships.id,placementApplications.membershipId)");
    expect(service).toContain("eq(collegeMemberships.collegeId,job.collegeId)");
    expect(service.indexOf(".innerJoin(collegeMemberships,and("))
      .toBeLessThan(service.indexOf(".groupBy(stage)"));
    expect(service).toContain('eq(placementApplications.status, "SUBMITTED")');
    expect(service).toContain("eq(placementCollegeApplicationStages.jobId, job.id)");
  });
  it("keeps zero activity and distinct status bucket totals honest after tenant filtering",()=>{
    const blank=projectSuperAdminDrivePipeline([]);
    expect(blank.total).toBe(0);
    expect(blank.rejected).toBe(0);
    const counts=projectSuperAdminDrivePipeline([
      {stage:"APPLIED",total:3},{stage:"SHORTLISTED",total:2},
      {stage:"REJECTED",total:1},{stage:"WAITLISTED",total:2},
    ]);
    expect(counts.counts.applied).toBe(3);
    expect(counts.counts.shortlisted).toBe(2);
    expect(counts.rejected).toBe(1);
    expect(counts.waitlisted).toBe(2);
    expect(counts.total).toBe(8);
  });
});
