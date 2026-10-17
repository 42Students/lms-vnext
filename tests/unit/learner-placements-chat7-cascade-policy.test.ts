import { describe, expect, it } from "vitest";
import { isPlacementInternship, shouldKeepPlacementCascadeSibling } from "@/modules/placements/placement-cascade-policy";
const base = {
  acceptedCountsAsPlaced: true, siblingIsInternship: false, siblingIsDream: false,
  siblingAnnualCtcInr: 700000, acceptedAnnualCtcInr: 1000000,
  maxHeldOffers: 1, upliftPct: 40,
};
describe("Learner placement offer cascade policy",()=>{
  it("LEARNER-placements-R03 never cascades other applications on internship acceptance",()=>{
    expect(isPlacementInternship("INTERNSHIP")).toBe(true);
    expect(isPlacementInternship("FULL_TIME")).toBe(false);
    expect(shouldKeepPlacementCascadeSibling({...base,acceptedCountsAsPlaced:false})).toBe(true);
    expect(shouldKeepPlacementCascadeSibling({...base,siblingIsInternship:true})).toBe(true);
  });
  it("LEARNER-placements-R03 preserves Dream, held slots and salary-uplift eligibility",()=>{
    expect(shouldKeepPlacementCascadeSibling({...base,siblingIsDream:true})).toBe(true);
    expect(shouldKeepPlacementCascadeSibling({...base,maxHeldOffers:2})).toBe(true);
    expect(shouldKeepPlacementCascadeSibling({...base,siblingAnnualCtcInr:1400000})).toBe(true);
    expect(shouldKeepPlacementCascadeSibling({...base,siblingAnnualCtcInr:null})).toBe(false);
    expect(shouldKeepPlacementCascadeSibling(base)).toBe(false);
  });
});
