import {describe,expect,it} from "vitest";
import {learnerRuleChangeApplicability} from "@/modules/placements/learner-placement-rules-model";
describe("learner rule-change applicability from own saved application status",()=>{
  it("references only truly submitted applications without a fake retroactive verdict",()=>{
    const result=learnerRuleChangeApplicability([
      {applicationStatus:"SUBMITTED"},{applicationStatus:"WITHDRAWN"},
      {applicationStatus:"SUBMITTED"},
    ]);
    expect(result.submittedCount).toBe(2);
    expect(result.message).toContain("cannot determine");
    expect(result.message).toContain("2 currently submitted applications");
    expect(result.message).not.toContain("applies retroactively.");
  });
  it("never claims an unconfigured effective date for first-time applicants",()=>{
    const state=learnerRuleChangeApplicability([]);
    expect(state.submittedCount).toBe(0);
    expect(state.message).toContain("No versioned College-wide policy");
  });
});
