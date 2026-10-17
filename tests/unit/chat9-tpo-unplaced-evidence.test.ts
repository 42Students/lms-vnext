import {describe,it,expect} from "vitest";
import {projectTpoUnplacedAcademic,formatUnplacedPercentage} from "../../src/modules/placements/tpo-unplaced-academic-evidence-model";
describe("TPO unplaced academic evidence",()=>{
 it("TPO-calendar-reports-43 reports verified UG and lowest actual mark but never invents missing marks",()=>{
  const row=projectTpoUnplacedAcademic({tenthPctBasisPoints:9500,twelfthPctBasisPoints:8100,
   diplomaPctBasisPoints:null,undergraduatePctBasisPoints:7400,
   source:"VERIFIED",verifiedAt:new Date("2099-06-01T00:00:00Z")});
  expect(row).toEqual({lowestRecordedPercent:74,undergraduatePercent:74,verification:"Verified"});
  expect(formatUnplacedPercentage(row.undergraduatePercent)).toBe("74%");
  expect(projectTpoUnplacedAcademic(null).lowestRecordedPercent).toBeNull();
  expect(formatUnplacedPercentage(null)).toBe("Not recorded");
 });
});