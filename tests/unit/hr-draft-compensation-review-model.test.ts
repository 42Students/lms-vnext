import {describe,expect,it} from "vitest";
import {emptyHrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {hrDraftCompensationWarnings} from "@/modules/placements/hr-draft-compensation-review-model";
describe("HR local compensation preview review",()=>{
 it("flags a total below minimum without preventing an unsent draft",()=>{
  const draft={...emptyHrDriveDraft(),minimumAnnualCtcInr:"600000",
   fixedAnnualCtcInr:"300000",variableAnnualCtcInr:"200000"};
  expect(hrDraftCompensationWarnings(draft).join(" ")).toContain("below");
  expect(draft.fixedAnnualCtcInr).toBe("300000");
 });
 it("flags a total above maximum",()=>{
  const draft={...emptyHrDriveDraft(),maximumAnnualCtcInr:"800000",
   fixedAnnualCtcInr:"700000",variableAnnualCtcInr:"200000"};
  expect(hrDraftCompensationWarnings(draft).join(" ")).toContain("exceeds");
 });
 it("does not speculate about incomplete amounts, but flags incomplete bonds",()=>{
  expect(hrDraftCompensationWarnings({...emptyHrDriveDraft(),fixedAnnualCtcInr:"400000"})).toEqual([]);
  expect(hrDraftCompensationWarnings({...emptyHrDriveDraft(),bondMonths:"12"})[0]).toContain("Bond duration");
 });
});
