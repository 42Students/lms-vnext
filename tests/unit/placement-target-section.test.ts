import { describe, expect, it } from "vitest";
import { isPlacementJobTargetSection } from "@/modules/placements/eligibility-service";

describe("P-S2-04 restricted class sections", () => {
  it("keeps unrestricted jobs open regardless of section enrollment", () => {
    expect(isPlacementJobTargetSection([], [])).toBe(true);
  });
  it("permits only an allowed active class", () => {
    expect(isPlacementJobTargetSection(["s1","s2"],["s2"])).toBe(true);
    expect(isPlacementJobTargetSection(["s1"],["s2"])).toBe(false);
    expect(isPlacementJobTargetSection(["s1"],[])).toBe(false);
  });
});
