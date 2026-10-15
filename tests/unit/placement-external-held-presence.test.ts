import { describe, expect, it } from "vitest";
import { verifiedExternalCtcInr } from "@/modules/placements/held-offer-facts-service";

describe("DB08-C external holds degraded state", () => {
  it("keeps null and malformed external values fail-closed when table becomes present", () => {
    expect(verifiedExternalCtcInr(null)).toBeNull();
    expect(verifiedExternalCtcInr("NaN")).toBeNull();
    expect(verifiedExternalCtcInr("1.25")).toBe(125000);
  });
});
