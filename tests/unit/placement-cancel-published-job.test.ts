import {describe,expect,it} from "vitest";
import {canCancelPublishedPlacementJob} from "@/modules/placements/job-service";

describe("P-S2-12 registered cancellation state",()=>{
  it("only cancels currently published jobs",()=>{
    expect(canCancelPublishedPlacementJob("PUBLISHED")).toBe(true);
    for(const s of ["DRAFT","CLOSED","ARCHIVED","CANCELLED"]){
      expect(canCancelPublishedPlacementJob(s)).toBe(false);
    }
  });
});
