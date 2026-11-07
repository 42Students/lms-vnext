import { describe, expect, it, vi } from "vitest";
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

// SEC-09: production readiness fails closed when a required secret is missing (runtime wrapper).
describe("readiness with production secret validation", () => {
  it("is not ready in production when a required secret is missing, ready when configuration is valid, and ignores dev", async () => {
    vi.resetModules();
    vi.doMock("server-only", () => ({}));
    vi.doMock("@/db/client", () => ({ checkDatabaseConnection: async () => undefined }));
    vi.doMock("@/observability/logger", () => ({ logError: () => undefined }));
    const issues = [{ name: "AUTH_SECRET", code: "MISSING", message: "x" }];
    vi.doMock("@/security/secret-registry", () => ({ validateSecretConfig: () => issues }));
    const { getReadinessResultWithRuntime } = await import("@/modules/system/readiness-runtime");
    const previous = process.env["APP_ENV"];
    try {
      process.env["APP_ENV"] = "production";
      const bad = await getReadinessResultWithRuntime();
      expect(bad.httpStatus).toBe(503);
      expect(bad.payload.dependencies.configuration).toBe("invalid");
      expect(JSON.stringify(bad.payload)).not.toContain("AUTH_SECRET");
      issues.length = 0;
      expect((await getReadinessResultWithRuntime()).httpStatus).toBe(200);
      issues.push({ name: "AUTH_SECRET", code: "MISSING", message: "x" });
      process.env["APP_ENV"] = "development";
      expect((await getReadinessResultWithRuntime()).httpStatus).toBe(200);
    } finally {
      if (previous === undefined) delete process.env["APP_ENV"];
      else process.env["APP_ENV"] = previous;
      vi.resetModules();
    }
  });
});
