import { describe, expect, it } from "vitest";
import { trustedClientErrorIp } from "@/modules/log-alerts/client-error-ip";

function request(
  forwarded?: string,
  realIp?: string,
): Request {
  const headers = new Headers();
  if (forwarded !== undefined) headers.set("x-forwarded-for", forwarded);
  if (realIp !== undefined) headers.set("x-real-ip", realIp);
  return new Request("https://lms.example.test/api/client-errors", { headers });
}

describe("authenticated client error telemetry IP trust boundary", () => {
  it("ignores all client-claimed IP headers unless the deployment enables trusted ingress", () => {
    expect(trustedClientErrorIp(request("198.51.100.7, 130.211.0.1", "8.8.8.8"), false))
      .toBeNull();
  });

  it("uses the second-to-last appended hop, not any spoofed leading value", () => {
    expect(trustedClientErrorIp(
      request("6.6.6.6, 7.7.7.7, 198.51.100.7, 130.211.0.1", "1.1.1.1"),
      true,
    )).toBe("198.51.100.7");
    expect(trustedClientErrorIp(
      request("9.9.9.9, 198.51.100.7, 130.211.0.1", "2.2.2.2"),
      true,
    )).toBe("198.51.100.7");
  });

  it("cannot use a forged X-Real-IP or a single XFF hop to bypass the quota", () => {
    expect(trustedClientErrorIp(request(undefined, "4.4.4.4"), true)).toBeNull();
    expect(trustedClientErrorIp(request("4.4.4.4", "5.5.5.5"), true)).toBeNull();
  });

  it("does not shift a malformed proxy hop into the trusted client slot", () => {
    expect(trustedClientErrorIp(
      request("6.6.6.6, 198.51.100.7, invalid-proxy"),
      true,
    )).toBeNull();
    expect(trustedClientErrorIp(
      request("6.6.6.6, , 130.211.0.1"),
      true,
    )).toBeNull();
  });

  it("normalizes IPv6 instead of minting separate rate-limit buckets", () => {
    expect(trustedClientErrorIp(
      request("2001:0DB8:0:0:0:0:0:1, 2001:db8::2"),
      true,
    )).toBe("2001:db8::1");
  });

  it("rejects unbounded forwarded chains rather than allocating a spoofed quota", () => {
    expect(trustedClientErrorIp(
      request("6.6.6.6, " + "1".repeat(4096)),
      true,
    )).toBeNull();
  });
});
