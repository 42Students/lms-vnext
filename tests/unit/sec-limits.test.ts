import { describe, expect, it } from "vitest";
import { RATE_LIMITS, TIMEOUT_MS } from "@/security/limits";

describe("limits", () => {
  it("names every tier once, with positive whole numbers, in increasing order of patience", () => {
    for (const rate of Object.values(RATE_LIMITS)) {
      expect(Number.isInteger(rate.limit) && rate.limit > 0).toBe(true);
      expect(Number.isInteger(rate.windowMs) && rate.windowMs > 0).toBe(true);
    }
    const values = Object.values(TIMEOUT_MS);
    expect(new Set(values).size).toBe(values.length);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
  it("is frozen", () => {
    expect(Object.isFrozen(TIMEOUT_MS)).toBe(true);
    expect(Object.isFrozen(RATE_LIMITS)).toBe(true);
  });
});
