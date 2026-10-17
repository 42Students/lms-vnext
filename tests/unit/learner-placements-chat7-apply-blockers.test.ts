import {describe,expect,it} from "vitest";
import {learnerJobApplyBlockers} from "@/modules/placements/learner-job-apply-blockers-model";
import {readFileSync} from "node:fs";
const base={
 registrationState:"CAN_APPLY" as const,debarred:false,canSelfApply:true,
 hasApplication:false,deadlinePassed:false,heldOfferEligible:true,
 eligibilityStatus:"ELIGIBLE",
};
describe("learner eligibility deny-state explanations",()=>{
 it("LEARNER-placements-R01 names real registration and academic evidence blockers",()=>{
  expect(learnerJobApplyBlockers({...base,registrationState:"REGISTER_FIRST"})).toEqual([
   "Register for placements to participate in campus drives.",
  ]);
  expect(learnerJobApplyBlockers({...base,registrationState:"CHOSE_OTHER"})[0]).toContain("does not include campus placements");
  expect(learnerJobApplyBlockers({...base,eligibilityStatus:"NEEDS_DATA"})[0]).toContain("academic evidence");
 });
 it("LEARNER-placements-R01 explains held-offer and expiry without claiming recruiter rejection",()=>{
  const reasons=learnerJobApplyBlockers({...base,deadlinePassed:true,heldOfferEligible:false});
  expect(reasons).toHaveLength(2);
  expect(reasons.join(" ")).toContain("held-offer");
  expect(reasons.join(" ")).toContain("deadline");
  expect(reasons.join(" ")).not.toContain("rejected by");
 });
 it("LEARNER-placements-R01 is wired to server-evaluated denial and both learner surfaces",()=>{
  const read=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
  expect(read("src/modules/placements/learner-job-service.ts")).toContain("applicationBlockers: learnerJobApplyBlockers(applyContext)");
  expect(read("src/components/placements/learner-placement-job-detail.tsx")).toContain('aria-label="Application blockers"');
  expect(read("src/components/placements/learner-placement-jobs.tsx")).toContain('aria-label="Why this role is not open to you"');
 });
});
