import { describe, expect, it } from "vitest";
import { displayDriveMetric, describeDriveMetric } from "@/modules/placements/college-drive-overview-model";
describe("College drive metric semantics", () => {
  it("distinguishes unknown selection data from observed zero", () => {
    expect(displayDriveMetric(null)).toBe("Not available");
    expect(displayDriveMetric(0)).toBe("0");
    expect(describeDriveMetric("selected")).toContain("No authoritative");
    expect(describeDriveMetric("shortlisted")).toContain("SHORTLISTED");
  });
});
