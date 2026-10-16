import {describe,expect,it} from "vitest";
import {getLearnerPlacementAccess} from "@/modules/placements/batch-eligibility-policy";
describe("TPO-students-01 and TPO-students-R01/R02/R08 roster rules",()=>{
 it("does not treat not-decided participation as eligible",()=>{
  const none={status:"NOT_DECIDED" as const,source:"DEFAULT" as const,reason:null,note:null,decidedAt:null};
  const res=getLearnerPlacementAccess({
    collegeModuleEnabled:true,decision:none,batchFinished:false,
  });
  expect(res.showPlacements).toBe(false);
 });
});