import { describe, expect, it } from "vitest";
import { scaleHundredths } from "@/modules/placements/eligibility-service";

describe("D4 placement decimal to basis-point rounding", () => {
  it("rounds decimal halves away from zero consistently", () => {
    expect(scaleHundredths(1.005)).toBe(101);
    expect(scaleHundredths(2.675)).toBe(268);
    expect(scaleHundredths(7.995)).toBe(800);
  });
  it("preserves exact percentage precision and nulls", () => {
    expect(scaleHundredths(79.25)).toBe(7925);
    expect(scaleHundredths(0)).toBe(0);
    expect(scaleHundredths(null)).toBeNull();
  });
  it("rejects invalid non-finite or negative marks", () => {
    for (const input of [-1, Infinity, NaN]) {
      expect(() => scaleHundredths(input)).toThrow(RangeError);
    }
  });
});
