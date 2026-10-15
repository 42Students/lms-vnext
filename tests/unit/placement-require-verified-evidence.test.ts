import { describe, expect, it } from "vitest";
import { evaluatePlacementEvidenceVerification } from "@/modules/placements/eligibility-service";

describe("P-S2-01 verified-evidence-only jobs", () => {
  it("does not treat self-reported marks as verified", () => {
    expect(evaluatePlacementEvidenceVerification("SELF", true)).toBe("MISSING");
    expect(evaluatePlacementEvidenceVerification(null, true)).toBe("MISSING");
  });
  it("fails closed before job INCLUDE overrides when verification is required", () => {
    expect(evaluatePlacementEvidenceVerification("SELF", true)).not.toBe("PASS");
  });
  it("accepts verified marks and respects optional verification mode", () => {
    expect(evaluatePlacementEvidenceVerification("VERIFIED", true)).toBe("PASS");
    expect(evaluatePlacementEvidenceVerification("SELF", false)).toBe("PASS");
  });
});
