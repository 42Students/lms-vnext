import { describe, it, expect } from "vitest";
import { browserErrorSchema, acceptClientErrorRate } from "@/modules/log-alerts/client-report";

describe("browser client error reporting", () => {
  it("GR-117 rejects extra fields, oversized messages and forged identity", () => {
    expect(browserErrorSchema.safeParse({ message: "Error", userId: "admin" }).success).toBe(false);
    expect(browserErrorSchema.safeParse({ message: "x".repeat(301) }).success).toBe(false);
    expect(browserErrorSchema.safeParse({ message: "Error", requestId: "not-a-uuid" }).success).toBe(false);
    expect(browserErrorSchema.safeParse({ message: "Error", path: "/learner" }).success).toBe(true);
  });
  it("GR-117 rate limits each session and resets after a minute", () => {
    const key = "GR-117-fixture";
    expect(acceptClientErrorRate(key, 10, 2)).toBe(true);
    expect(acceptClientErrorRate(key, 11, 2)).toBe(true);
    expect(acceptClientErrorRate(key, 12, 2)).toBe(false);
    expect(acceptClientErrorRate(key, 60_012, 2)).toBe(true);
  });
});
