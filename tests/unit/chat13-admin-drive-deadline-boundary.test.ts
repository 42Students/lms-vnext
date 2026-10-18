import { describe, expect, it } from "vitest";
import { adminDriveStatus } from "@/modules/placements/admin-drive-directory-model";

describe("SA-ADMIN-DRIVE-04 Super Admin drive expiry boundary", () => {
  const cutoff = new Date("2026-10-19T18:30:00.000Z");
  it("treats an exact deadline as expired and preserves status before it", () => {
    expect(adminDriveStatus({
      status: "PUBLISHED",
      applicationDeadline: new Date(cutoff.getTime() - 1),
    }, cutoff)).toBe("Open · Expired");
    expect(adminDriveStatus({
      status: "PUBLISHED", applicationDeadline: cutoff,
    }, cutoff)).toBe("Open · Expired");
    expect(adminDriveStatus({
      status: "PUBLISHED",
      applicationDeadline: new Date(cutoff.getTime() + 1),
    }, cutoff)).toBe("Open");
  });
  it("does not conflate a missing deadline with expiration or alter nonpublished status", () => {
    expect(adminDriveStatus({ status: "PUBLISHED", applicationDeadline: null }, cutoff)).toBe("Open");
    expect(adminDriveStatus({ status: "CLOSED", applicationDeadline: cutoff }, cutoff)).toBe("Closed");
    expect(adminDriveStatus({ status: "DRAFT", applicationDeadline: cutoff }, cutoff)).toBe("Draft");
  });
});
