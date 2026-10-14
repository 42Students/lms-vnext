import {describe,expect,it} from "vitest";
import {DEFAULT_LEARNER_JOB_FILTERS as base} from "@/modules/placements/learner-jobs-browse-model";
import {learnerDrivesEmptyState} from "@/modules/placements/learner-drives-empty-state-model";
describe("learner Drives empty vs filtered state",()=>{
  it("never suggests clearing filters when no authorized published jobs exist",()=>{
    expect(learnerDrivesEmptyState(0,0,base)).toMatchObject({
      kind:"NO_PUBLISHED",showReset:false,
    });
  });
  it("distinguishes eligibility and deadline filters on otherwise published results",()=>{
    expect(learnerDrivesEmptyState(4,0,{...base,eligibleOnly:true})).toMatchObject({
      kind:"FILTERED_OUT",title:"No drives currently open to you",showReset:true,
    });
    expect(learnerDrivesEmptyState(4,0,{...base,closingSoon:true}).title)
      .toContain("seven days");
    expect(learnerDrivesEmptyState(4,2,base).kind).toBe("HAS_RESULTS");
  });
});