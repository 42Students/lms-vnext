import { describe, expect, it } from "vitest";
import { placementPercentageThroughout } from "@/modules/placements/eligibility-service";

const sample = {
  tenthPctBasisPoints: 8500,
  twelfthPctBasisPoints: 7900,
  diplomaPctBasisPoints: null,
  undergraduatePctBasisPoints: 7200,
  isLateralEntry: false,
};
describe("P-S2-02 minimum percentage throughout",()=>{
  it("compares the lowest of 10th, 12th and undergraduate percentages",()=>{
    expect(placementPercentageThroughout(sample)).toBe(7200);
    expect(placementPercentageThroughout({...sample,twelfthPctBasisPoints:6400})).toBe(6400);
  });
  it("uses diploma instead of 12th for lateral entry",()=>{
    expect(placementPercentageThroughout({
      ...sample,twelfthPctBasisPoints:null,diplomaPctBasisPoints:6950,
    })).toBe(6950);
  });
  it("never treats missing required evidence as zero percent",()=>{
    expect(placementPercentageThroughout({...sample,tenthPctBasisPoints:null})).toBeNull();
    expect(placementPercentageThroughout({...sample,undergraduatePctBasisPoints:null})).toBeNull();
    expect(placementPercentageThroughout({...sample,twelfthPctBasisPoints:null})).toBeNull();
  });
});
