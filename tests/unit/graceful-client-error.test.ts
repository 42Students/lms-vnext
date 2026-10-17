import { describe, it, expect } from "vitest";
import { browserErrorSchema, acceptClientErrorRate, safeBrowserComponent } from "@/modules/log-alerts/client-report";

describe("browser client error reporting", () => {
  it("GR-117 rejects extra fields, oversized messages and forged identity", () => {
    expect(browserErrorSchema.safeParse({ message: "Error", userId: "admin" }).success).toBe(false);
    expect(browserErrorSchema.safeParse({ message: "x".repeat(301) }).success).toBe(false);
    expect(browserErrorSchema.safeParse({ message: "Error", requestId: "not-a-uuid" }).success).toBe(false);
    expect(browserErrorSchema.safeParse({ message: "Error", path: "/learner" }).success).toBe(true);
    expect(browserErrorSchema.safeParse({ kind: "render", requestId: "abcd1234" }).success).toBe(true);
    expect(browserErrorSchema.safeParse({ kind: "stale_chunk", requestId: "abcd1234" }).success).toBe(true);
    expect(browserErrorSchema.safeParse({ kind: "render", requestId: "not-an-id" }).success).toBe(false);
    expect(browserErrorSchema.safeParse({ kind: "untrusted" }).success).toBe(false);
    expect(browserErrorSchema.safeParse({}).success).toBe(false);
  });
  it("GR-113 GR-117 strips untrusted browser component names from alert categories", () => {
    expect(safeBrowserComponent({ component: "Jane Smith" })).toBe("browser");
    expect(safeBrowserComponent({ component: "root" })).toBe("root");
    expect(safeBrowserComponent({ name: "TypeError" })).toBe("typeerror");
  });
  it("GR-117 rate limits each session and resets after a minute", () => {
    const key = "GR-117-fixture";
    expect(acceptClientErrorRate(key, 10, 2)).toBe(true);
    expect(acceptClientErrorRate(key, 11, 2)).toBe(true);
    expect(acceptClientErrorRate(key, 12, 2)).toBe(false);
    expect(acceptClientErrorRate(key, 60_012, 2)).toBe(true);
  });
});
