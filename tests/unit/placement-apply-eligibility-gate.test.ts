import { describe, expect, it } from "vitest";
import { placementApplyEligibilityDenial } from "@/modules/placements/eligibility-service";

describe("D3 tx-bound application eligibility decision", () => {
  it("maps ineligible and missing-required-data to the same stable API errors", () => {
    expect(placementApplyEligibilityDenial("INELIGIBLE")).toBe("PLACEMENT_APPLICATION_INELIGIBLE");
    expect(placementApplyEligibilityDenial("NEEDS_DATA")).toBe("PLACEMENT_APPLICATION_NEEDS_DATA");
  });
  it("allows complete and explicitly flagged incomplete evidence", () => {
    expect(placementApplyEligibilityDenial("ELIGIBLE")).toBeNull();
    expect(placementApplyEligibilityDenial("ELIGIBLE_WITH_MISSING_EVIDENCE")).toBeNull();
  });
});
