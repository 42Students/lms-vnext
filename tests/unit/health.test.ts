import { describe, expect, it } from "vitest";
import { getHealthPayload } from "@/modules/system/health";

describe("getHealthPayload", () => {
  it("returns service identity and the supplied timestamp", () => {
    const now = new Date("2026-10-02T09:00:00.000Z");

    expect(getHealthPayload(now)).toEqual({
      status: "ok",
      service: "lms-vnext",
      timestamp: "2026-10-02T09:00:00.000Z",
    });
  });
});
