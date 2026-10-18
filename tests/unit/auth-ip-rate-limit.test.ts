import { beforeEach, describe, expect, it } from "vitest";
import {
  allowRequest,
  clientIp,
  resetIpRateLimitForTests,
} from "@/auth/ip-rate-limit";

const request = (forwarded?: string) =>
  new Request("http://example.test/", {
    headers: forwarded ? { "x-forwarded-for": forwarded } : {},
  });

describe("clientIp", () => {
  it("uses the address the load balancer appended, not caller-supplied ones", () => {
    expect(clientIp(request("1.1.1.1, 203.0.113.9, 130.211.0.1"))).toBe(
      "203.0.113.9",
    );
    expect(
      clientIp(request("6.6.6.6, 7.7.7.7, 203.0.113.9, 130.211.0.1")),
    ).toBe("203.0.113.9");
  });

  it("falls back to the only entry or unknown", () => {
    expect(clientIp(request("198.51.100.4"))).toBe("198.51.100.4");
    expect(clientIp(request())).toBe("unknown");
  });
});

describe("allowRequest", () => {
  beforeEach(() => resetIpRateLimitForTests());

  it("allows the limit then blocks until the window passes", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(allowRequest("k", 3, 60_000, 1_000)).toBe(true);
    }
    expect(allowRequest("k", 3, 60_000, 2_000)).toBe(false);
    expect(allowRequest("k", 3, 60_000, 62_000)).toBe(true);
  });

  it("keeps separate budgets per key", () => {
    expect(allowRequest("a", 1, 60_000, 0)).toBe(true);
    expect(allowRequest("a", 1, 60_000, 1)).toBe(false);
    expect(allowRequest("b", 1, 60_000, 1)).toBe(true);
  });

  it("AUTH-rate-limits-01 never resets existing quotas when 50,000 distinct keys fill memory", () => {
    expect(allowRequest("protected-client", 1, 60_000, 1_000)).toBe(true);
    for (let i = 0; i < 49_999; i += 1) {
      expect(allowRequest("spray-" + i, 1, 60_000, 1_000)).toBe(true);
    }
    expect(allowRequest("new-spoofed-client", 1, 60_000, 1_001)).toBe(false);
    expect(allowRequest("protected-client", 1, 60_000, 1_002)).toBe(false);
    // Cleanup is expiry-bound, not a reset of still-active buckets.
    expect(allowRequest("new-spoofed-client", 1, 60_000, 61_001)).toBe(true);
  });
});
