import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterVisibleDriveFunnel} from "@/modules/placements/recruiter-drive-funnel-model";
describe("Final sprint recruiter shared-candidate pipeline",()=>{
 it("REC-home-drives-37 shared-candidate funnel protects privacy and computes stage percentages",()=>{
  const result=recruiterVisibleDriveFunnel({
   shared:100,shortlisted:40,rounds:[],offered:10,hired:2,
  });
  expect(result.map(stage=>stage.label)).toEqual([
    "Shared applicants","Shortlisted","Assessment","Interview","Offered","Hired",
  ]);
  expect(result[0]?.ofApplied).toBe(100);
  expect(result[1]?.ofApplied).toBe(40);
  expect(result[2]?.count).toBeNull();
  expect(result[3]?.count).toBeNull();
  expect(result[4]?.ofPrevious).toBe(25);
  expect(result[5]?.ofPrevious).toBe(20);
  expect(result[5]?.ofApplied).toBe(2);
  const page=readFileSync("src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx","utf8");
  expect(page).toContain('aria-label="Employer-visible stage funnel"');
  expect(page).toContain("recruiterVisibleDriveFunnel({");
  expect(page).toContain("stage.ofApplied");
  expect(page).toContain("of shared applicants");
 });
});
