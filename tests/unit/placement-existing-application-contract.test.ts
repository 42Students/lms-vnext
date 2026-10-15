import { describe, expect, it } from "vitest";
import { resolveExistingApplication } from "@/modules/placements/application-service";

describe("D2 deterministic existing application handling", () => {
  const row = {
    id: "application-1", status: "SUBMITTED", channel: "INTERNAL",
  } as Parameters<typeof resolveExistingApplication>[0];
  it("returns a previous submission idempotently when channel matches", () => {
    expect(resolveExistingApplication(row, "INTERNAL")).toBe(row);
  });
  it("refuses accidental channel switching", () => {
    expect(() => resolveExistingApplication(row, "EXTERNAL"))
      .toThrow("PLACEMENT_APPLICATION_CHANNEL_CONFLICT");
  });
  it("does not silently revive withdrawn rows without audited reapply", () => {
    expect(() => resolveExistingApplication({ ...row, status: "WITHDRAWN" }, "INTERNAL"))
      .toThrow("PLACEMENT_APPLICATION_ALREADY_WITHDRAWN");
  });
});
