import { beforeEach, describe, expect, it } from "vitest";
import {
  allowRequest,
  clientIp,
  resetIpRateLimitForTests,
} from "@/auth/ip-rate-limit";
import {
  AuthRequestBodyTooLarge,
  MAX_AUTH_JSON_BYTES,
  readBoundedAuthJson,
} from "@/modules/auth/bounded-json";

function request(body: string, headers: Record<string, string> = {}) {
  return new Request("https://college.example.edu/api/auth/login/start", {
    method: "POST", headers, body,
  });
}

beforeEach(() => resetIpRateLimitForTests());

describe("auth OTP rate limits and bounded unauthenticated request bodies", () => {
  it("AUTH-RATE-01 partitions IP, route and time windows without refreshing the throttle on retries", () => {
    expect(allowRequest("start:198.51.100.1", 2, 60_000, 100_000)).toBe(true);
    expect(allowRequest("start:198.51.100.1", 2, 60_000, 100_001)).toBe(true);
    expect(allowRequest("start:198.51.100.1", 2, 60_000, 100_002)).toBe(false);
    expect(allowRequest("verify:198.51.100.1", 2, 60_000, 100_002)).toBe(true);
    expect(allowRequest("start:198.51.100.2", 2, 60_000, 100_002)).toBe(true);
    expect(allowRequest("start:198.51.100.1", 2, 60_000, 159_999)).toBe(false);
    expect(allowRequest("start:198.51.100.1", 2, 60_000, 160_000)).toBe(true);
  });

  it("AUTH-RATE-02 selects the load-balancer-attested forwarded address rather than the leftmost attacker header", () => {
    const req = new Request("https://college.example.edu", {
      headers: { "x-forwarded-for": "203.0.113.99, 192.0.2.4, 198.51.100.1" },
    });
    expect(clientIp(req)).toBe("192.0.2.4");
    expect(clientIp(new Request("https://college.example.edu", {
      headers: { "x-forwarded-for": "192.0.2.9" },
    }))).toBe("192.0.2.9");
    expect(clientIp(new Request("https://college.example.edu"))).toBe("unknown");
  });

  it("AUTH-RATE-03 rejects forged oversized Content-Length before consuming a body", async () => {
    await expect(readBoundedAuthJson(request('{"contact":"test"}', {
      "content-length": String(MAX_AUTH_JSON_BYTES + 1),
    }))).rejects.toBeInstanceOf(AuthRequestBodyTooLarge);
    await expect(readBoundedAuthJson(request('{"contact":"test"}', {
      "content-length": "1",
    }))).resolves.toEqual({contact:"test"});
  });

  it("AUTH-RATE-04 enforces the streaming byte cap even without Content-Length", async () => {
    const oversized = request(JSON.stringify({contact:"x".repeat(MAX_AUTH_JSON_BYTES)}));
    await expect(readBoundedAuthJson(oversized)).rejects.toBeInstanceOf(AuthRequestBodyTooLarge);
    const exact = JSON.stringify({ a:"x".repeat(26) });
    expect(await readBoundedAuthJson(request(exact), exact.length)).toEqual({a:"x".repeat(26)});
    await expect(readBoundedAuthJson(request("{"))).rejects.toBeInstanceOf(SyntaxError);
  });

  it("AUTH-RATE-05 fails closed on absent bodies and malformed UTF-8", async () => {
    await expect(readBoundedAuthJson(new Request("https://college.example.edu",{
      method:"POST",
    }))).rejects.toBeInstanceOf(SyntaxError);
    const bytes = new Uint8Array([0x7b,0x22,0x78,0x22,0x3a,0x22,0xc3,0x28,0x22,0x7d]);
    await expect(readBoundedAuthJson(new Request("https://college.example.edu",{
      method:"POST",body:bytes,
    }))).rejects.toThrow();
  });
});
