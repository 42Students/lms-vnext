import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("clientIp untrusted forwarding chains", () => {
  it("rejects missing, empty, malformed and untrusted final proxy hops", () => {
    for (const chain of [
      "",
      "198.51.100.9, ",
      "198.51.100.9, not-an-ip",
      "198.51.100.9, , 130.211.0.1",
      "198.51.100.9:4567, 130.211.0.1",
      "198.51.100.9, 130.211.0.1:443",
      "198.51.100.9, 999.999.999.999",
    ]) {
      expect(clientIp(request(chain))).toBe("unknown");
    }
    expect(clientIp(request("198.51.100.9, 130.211.0.1,"))).toBe("unknown");
    expect(clientIp(request("198.51.100.9, 130.211.0.1, ".repeat(150)))).toBe("unknown");
  });

  it("canonicalizes equivalent IPv6 spellings before allocating a throttle bucket", () => {
    const canonical = "2001:db8::1";
    expect(clientIp(request("2001:0DB8:0000:0:0:0:0:1, 130.211.0.1"))).toBe(canonical);
    expect(clientIp(request("2001:db8::1, 130.211.0.1"))).toBe(canonical);
    expect(clientIp(request("2001:DB8::1"))).toBe(canonical);
    expect(clientIp(request("::ffff:203.0.113.9, 130.211.0.1"))).toBe("::ffff:cb00:7109");
  });

  it("ignores a single untrusted forwarding value in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    try {
      expect(clientIp(request("198.51.100.4"))).toBe("unknown");
      expect(clientIp(request("192.0.2.44"))).toBe("unknown");
      expect(clientIp(request("203.0.113.9, 130.211.0.1"))).toBe("203.0.113.9");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("shares a bounded unknown-address budget rather than allowing malformed key rotation", () => {
    resetIpRateLimitForTests();
    const key = (forwarded: string) => `login-start:${clientIp(request(forwarded))}`;
    expect(allowRequest(key("not-an-ip"), 2, 60_000, 1_000)).toBe(true);
    expect(allowRequest(key("198.51.100.9, invalid-proxy"), 2, 60_000, 1_001)).toBe(true);
    expect(allowRequest(key("198.51.100.8, invalid-proxy"), 2, 60_000, 1_002)).toBe(false);
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
