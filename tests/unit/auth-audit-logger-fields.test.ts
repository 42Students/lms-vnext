import { describe, expect, it } from "vitest";
import { privacySafeAuthInfoLogFields } from "@/observability/auth-info-field-policy";
import { privacySafeInfoLogFields } from "@/observability/logger";

describe("auth security INFO log redaction and utility", () => {
  it("retains only valid pseudonymous authentication forensic fields", () => {
    const fields = {
      component: "auth-audit", route: "login-verify", requestId: "req-42",
      ipTag: "a".repeat(24), userTag: "b".repeat(24),
      channel: "EMAIL", requiresSecondFactor: true,
      isSuperAdmin: false, accepted: true, elapsedMs: 250,
      extra: "private information", userId: "user-id", code: "999999",
      authorization: "private-value",
    };
    const expected = {
      component: "auth-audit", route: "login-verify", requestId: "req-42",
      ipTag: "a".repeat(24), userTag: "b".repeat(24),
      channel: "EMAIL", requiresSecondFactor: true,
      isSuperAdmin: false, accepted: true, elapsedMs: 250,
    };
    expect(privacySafeAuthInfoLogFields(fields)).toEqual(expected);
    expect(privacySafeInfoLogFields(fields)).toEqual(expected);
    expect(JSON.stringify(privacySafeInfoLogFields(fields))).not.toContain("private information");
  });

  it("rejects route queries, malformed hashes and invalid field types", () => {
    expect(privacySafeInfoLogFields({
      component: "auth-audit", route: "login-verify?code=abc",
      ipTag: "not-verified", channel: "ADMIN", elapsedMs: Infinity,
      requests: -4, accepted: "true",
    })).toEqual({ component: "auth-audit" });
  });

  it("never widens the generic INFO policy to accept authentication identifiers", () => {
    const fields = {
      component: "api", route: "/api/auth/start", ipTag: "a".repeat(24),
      userTag: "b".repeat(24), channel: "PHONE",
    };
    expect(privacySafeInfoLogFields(fields)).toEqual({
      component: "api", route: "/api/auth/start",
    });
  });

  it("preserves the safe no-config diagnosis but not raw addresses", () => {
    expect(privacySafeInfoLogFields({
      component: "auth-audit", route: "/api/auth/start",
      ipTag: "unavailable", userTag: "unavailable", ip: "198.51.100.7",
    })).toEqual({
      component: "auth-audit", route: "/api/auth/start",
      ipTag: "unavailable", userTag: "unavailable",
    });
  });
});
