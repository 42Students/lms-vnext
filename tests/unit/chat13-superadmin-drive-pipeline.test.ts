import {describe, expect, it} from "vitest";
import {readFileSync} from "node:fs";
import {projectSuperAdminDrivePipeline} from "@/modules/placements/super-admin-drive-pipeline-model";

describe("Super Admin per-drive pipeline", () => {
  it("SA-placements-projects-18 maps six persisted stages to a snapshot without counting rejected as applied", () => {
    const snapshot=projectSuperAdminDrivePipeline([
      {stage:"APPLIED",total:9},{stage:"SHORTLISTED",total:8},
      {stage:"ASSESSMENT",total:7},{stage:"INTERVIEW",total:6},
      {stage:"OFFERED",total:5},{stage:"HIRED",total:4},
      {stage:"REJECTED",total:2},{stage:"WAITLISTED",total:1},
    ]);
    expect(snapshot.counts).toEqual({
      applied:9,shortlisted:8,assessment:7,interview:6,offered:5,hired:4,
    });
    expect(snapshot.total).toBe(42);
    expect(snapshot.rejected).toBe(2);
    expect(snapshot.funnel.map(x=>x.label)).toEqual([
      "Applied","Shortlisted","Assessment","Interview","Offered","Hired",
    ]);
  });
  it("SA-placements-projects-18 keeps all counts at zero for a draft without applications", () => {
    expect(projectSuperAdminDrivePipeline([]).total).toBe(0);
  });
  it("SA-placements-projects-18 rejects corrupted numeric stage counts", () => {
    expect(()=>projectSuperAdminDrivePipeline([{stage:"APPLIED",total:-1}])).toThrow();
  });
  it("SA-placements-projects-18 binds every read to an authorized job and submitted applications", () => {
    const service=readFileSync("src/modules/placements/super-admin-drive-pipeline-service.ts","utf8");
    const page=readFileSync("src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx","utf8");
    expect(service).toContain("await getPlacementJob(context, jobId)");
    expect(service).toContain('eq(placementApplications.status, "SUBMITTED")');
    expect(page).toContain("<SuperAdminDrivePipeline rows={pipeline} />");
  });
});
