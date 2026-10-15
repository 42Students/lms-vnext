import { describe, expect, it } from "vitest";
import { publicMetricRelease } from "@/modules/placements/public-metric-release";
import { publicIndependentPlacementCount } from "@/modules/placements/public-page/independent-count-model";
describe("T-S2-08 public aggregate disclosure safety", () => {
  const scope = { enabled: true, collegeActive: true, population: 100 };
  it("suppresses placed students with fewer than five and respects opt-in", () => {
    expect(publicMetricRelease({ ...scope, count: 4 })).toBeNull();
    expect(publicMetricRelease({ ...scope, count: 5 })).toBe(5);
    expect(publicMetricRelease({ ...scope, enabled: false, count: 50 })).toBeNull();
  });
  it("lets offer/employer counts exceed student population but hides small counts", () => {
    expect(publicIndependentPlacementCount(4, 100)).toBeNull();
    expect(publicIndependentPlacementCount(120, 100)).toBe(120);
  });
});
