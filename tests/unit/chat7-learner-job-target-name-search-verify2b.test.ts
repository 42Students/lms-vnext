import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";

describe("legacy learner drive search wiring",()=>{
 it("matches target Program and Department names from tenant-scoped targets",()=>{
  const service=readFileSync("src/modules/placements/learner-job-service.ts","utf8");
  const page=readFileSync("src/app/(authenticated)/learn/my-placements/jobs/page.tsx","utf8");
  const model=readFileSync("src/modules/placements/learner-jobs-browse-model.ts","utf8");
  expect(service).toContain("eq(departments.collegeId,membership.collegeId)");
  expect(service).toContain("targetNamesByJobId");
  expect(page).toContain("targetDepartmentName:row.job.targetDepartmentName");
  expect(page).toContain("targetProgramName:row.job.targetProgramName");
  expect(model).toContain("row.job?.targetDepartmentName");
  expect(model).toContain("row.job?.targetProgramName");
 });
});
