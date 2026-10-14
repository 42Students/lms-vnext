import {describe,expect,it} from "vitest";
import {learnerPlacementOnboardingSteps} from "@/modules/placements/learner-onboarding-steps-model";
describe("first-run learner placements guidance",()=>{
  it("only displays real existing learner destinations when emptiness is known",()=>{
    expect(learnerPlacementOnboardingSteps(null,true)).toEqual([]);
    expect(learnerPlacementOnboardingSteps(false,true)).toEqual([]);
    expect(learnerPlacementOnboardingSteps(true,true).map(x=>x.href)).toEqual([
      "/learn/my-placements/rules","/learn/my-placements/jobs","/learn/my-placements#placement-job-preferences",
    ]);
  });
  it("does not offer a preferences editor when that source is unavailable",()=>{
    expect(learnerPlacementOnboardingSteps(true,false).map(x=>x.href)).toEqual([
      "/learn/my-placements/rules","/learn/my-placements/jobs",
    ]);
  });
});
