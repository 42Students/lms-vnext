import { describe, expect, it } from "vitest";
import { publicPlacementDisclosure } from "@/modules/placements/public-placement-disclosure-model";

describe("public placement statistics privacy threshold", () => {
  it("suppresses every small cohort including zero rather than publishing identifiable counts", () => {
    expect(publicPlacementDisclosure([
      { label: "Placed", count: 0 },
      { label: "Interviews", count: 4 },
      { label: "Offers", count: 5 },
    ])).toEqual([
      { label: "Placed", display: "Not publicly available", suppressed: true },
      { label: "Interviews", display: "Not publicly available", suppressed: true },
      { label: "Offers", display: "5", suppressed: false },
    ]);
  });
  it("treats missing and invalid evidence as unavailable", () => {
    for (const count of [null, -1, 1.5, Number.NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(publicPlacementDisclosure([{ label: "Count", count }])[0].suppressed).toBe(true);
    }
  });
  it("never permits weakening the public threshold below five", () => {
    expect(() => publicPlacementDisclosure([], 4)).toThrow("PUBLIC_DISCLOSURE_MINIMUM_INVALID");
    expect(() => publicPlacementDisclosure([], 5.5)).toThrow("PUBLIC_DISCLOSURE_MINIMUM_INVALID");
  });
  it("does not mutate the source metrics", () => {
    const source = Object.freeze([{ label: "Offers", count: 8 }]);
    expect(publicPlacementDisclosure(source)[0].display).toBe("8");
    expect(source[0].count).toBe(8);
  });
});
