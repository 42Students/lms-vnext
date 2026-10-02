import { describe, expect, it } from "vitest";
import { getReadinessResult } from "@/modules/system/readiness";

describe("readiness", () => {
  const now = new Date("2026-10-02T09:00:00.000Z");

  it("reports ready only after the database responds", async () => {
    await expect(
      getReadinessResult(async () => undefined, now),
    ).resolves.toEqual({
      httpStatus: 200,
      payload: {
        status: "ready",
        service: "lms-vnext",
        timestamp: "2026-10-02T09:00:00.000Z",
        dependencies: {
          database: "ok",
        },
      },
    });
  });

  it("fails readiness without exposing database error details", async () => {
    await expect(
      getReadinessResult(async () => {
        throw new Error("password=do-not-leak");
      }, now),
    ).resolves.toEqual({
      httpStatus: 503,
      payload: {
        status: "not_ready",
        service: "lms-vnext",
        timestamp: "2026-10-02T09:00:00.000Z",
        dependencies: {
          database: "unavailable",
        },
      },
    });
  });
});
