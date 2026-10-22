import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("legacy learner job academic targeting search",()=>{
 it("resolves permitted department and program names without global lookup",()=>{
  const service=readFileSync("src/modules/placements/learner-job-service.ts","utf8");
  const page=readFileSync("src/app/(authenticated)/learn/my-placements/jobs/page.tsx","utf8");
  expect(service).toContain("eq(departments.collegeId,membership.collegeId)");
  expect(service).toContain("targetProgramName:[...new Set(labels.map(row=>row.name))]");
  expect(service).toContain("targetDepartmentName:[...new Set(labels.map(row=>row.departmentName))]");
  expect(page).toContain("targetProgramName:row.job.targetProgramName");
  expect(page).toContain("targetDepartmentName:row.job.targetDepartmentName");
 });
});
