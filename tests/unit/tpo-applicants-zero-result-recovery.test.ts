import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoApplicantPipelineHasFilters} from "@/modules/placements/tpo-applicant-pipeline-model";
describe("TPO empty applicant grid recovery",()=>{
 it("keeps filters and spreadsheet mounted even without matching records",()=>{
  const page=readFileSync("src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx","utf8");
  const grid=readFileSync("src/components/tpo/tpo-applications-spreadsheet.tsx","utf8");
  expect(page).toContain("TpoApplicationsSpreadsheet");
  expect(page).toContain("Loading applicant grid");
  expect(page).toContain("Clear applicant filters");
  expect(grid).toContain("<GridWorkspace rows={rows} columns={columns}");
  expect(grid).toContain("filters={filters}");
  expect(grid).toContain("<TpoGrid integratedWorkspace");
 });
 it("offers reset for genuine filter misses but not an unfiltered empty drive",()=>{
  const defaults={stage:"ALL",search:"",channel:"ALL",eligibility:"ALL",submittedWithin:"ALL"};
  expect(tpoApplicantPipelineHasFilters(defaults)).toBe(false);
  expect(tpoApplicantPipelineHasFilters({...defaults,stage:"HOLD"})).toBe(true);
 });
});
