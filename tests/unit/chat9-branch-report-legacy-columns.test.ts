import {describe,it,expect} from "vitest";
import {LEGACY_TPO_BRANCH_COLUMNS,legacyTpoBranchReportRow,branchPackageLpa} from "../../src/modules/placements/tpo-branch-report-view-model";
describe("TPO branch report legacy columns",()=>{
 it("TPO-calendar-reports-46 shows looking for a job, placed and LPA package values in the legacy order",()=>{
  expect(LEGACY_TPO_BRANCH_COLUMNS.slice(0,7)).toEqual([
   "Branch","Looking for a job","Placed","Placement rate","Offers","Average package","Highest package",
  ]);
  const row=legacyTpoBranchReportRow({departmentName:"CSE",registered:40,placed:11,
   placementRatePercent:27.5,offers:17,averagePackageInr:1200000,highestPackageInr:2500000,
   applicants:20,applications:35,acceptedOffers:12});
  expect(row.slice(0,7)).toEqual(["CSE",29,11,"27.5%",17,"12 LPA","25 LPA"]);
  expect(row.slice(7)).toEqual([40,20,35,12]);
  expect(branchPackageLpa(null)).toBe("—");
 });
});