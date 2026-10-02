import { describe, expect, it } from "vitest";
import {
  createStructuredLogRecord,
  serializeError,
} from "@/observability/logger";

describe("structured logger", () => {
  it("creates Cloud Logging friendly JSON records", () => {
    const now = new Date("2026-10-03T00:00:00.000Z");

    expect(
      createStructuredLogRecord(
        "ERROR",
        "api.unhandled_error",
        { component: "api" },
        now,
      ),
    ).toEqual({
      severity: "ERROR",
      event: "api.unhandled_error",
      timestamp: "2026-10-03T00:00:00.000Z",
      component: "api",
    });
  });

  it("serializes errors without copying arbitrary object fields", () => {
    const error = new Error("database unavailable");
    (error as Error & { password?: string }).password =
      "do-not-log";

    const serialized = serializeError(error);

    expect(serialized.name).toBe("Error");
    expect(serialized.message).toBe(
      "database unavailable",
    );
    expect(serialized).not.toHaveProperty("password");
  });
});
