import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

const read=(path:string)=>readFileSync(path,"utf8");

describe("application stage row-lock order",()=>{
  it("college stage moves lock job, application, stage, screening, then interview slots",()=>{
    const code=read("src/modules/placements/college-application-stage-service.ts");
    const job=code.indexOf('.for(input.saveAssessmentUrlToJob?"update":"share")');
    const application=code.indexOf('.for("update",{of:placementApplications})');
    const stage=code.indexOf('placementCollegeApplicationStages.applicationId,applicationId))).for("update")');
    const screening=code.indexOf('placementApplicationScreenings.applicationId,applicationId)).for("update")');
    const slots=code.indexOf(".for(\"update\").limit(100)");
    for(const position of [job,application,stage,screening,slots])expect(position).toBeGreaterThan(-1);
    expect(job).toBeLessThan(application);
    expect(application).toBeLessThan(stage);
    expect(stage).toBeLessThan(screening);
    expect(screening).toBeLessThan(slots);
  });
  it("the TPO bulk path locks the application before its stage and never locks the job",()=>{
    const code=read("src/modules/placements/tpo-bulk-application-stage-service.ts");
    const application=code.indexOf('.for("update",{of:placementApplications})');
    const stage=code.indexOf('placementTpoApplicationStages.jobId,jobId))).for("update")');
    expect(application).toBeGreaterThan(-1);
    expect(stage).toBeGreaterThan(application);
    expect(code).not.toContain('{of:placementJobs}');
  });
});
