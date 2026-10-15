import {describe,expect,it} from "vitest";
import {isPlacementJobTargetSection} from "@/modules/placements/eligibility-service";

describe("P-S2-04 learner job discovery section gating",()=>{
  it("hides another section's jobs while keeping unrestricted jobs discoverable",()=>{
    expect(isPlacementJobTargetSection(["allowed"],["other"])).toBe(false);
    expect(isPlacementJobTargetSection(["allowed"],["allowed"])).toBe(true);
    expect(isPlacementJobTargetSection([],["other"])).toBe(true);
  });
});
