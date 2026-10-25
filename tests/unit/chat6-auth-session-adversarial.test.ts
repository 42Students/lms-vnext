import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import {
  codeMac, contactFingerprint, safeEqualHex, generateToken, sessionDigest,
} from "@/modules/auth/crypto";
import {
  allowRequest, clientIp, resetIpRateLimitForTests,
} from "@/auth/ip-rate-limit";
import {
  ATTEMPT_LIFETIME_SECONDS, MAX_SENDS_PER_CONTACT,
  MAX_SENDS_PER_CONTACT_TOTAL, MAX_SENDS_PER_ADDRESS,
  MAX_EMAIL_RESENDS,
} from "@/modules/auth/login-service";

const source = (name: string) => readFileSync(name, "utf8");
const secret = "x".repeat(40);
const attemptA = "11111111-1111-4111-8111-111111111111";
const attemptB = "22222222-2222-4222-8222-222222222222";

describe("Chat-6 adversarial OTP, handoff and session lifecycle", () => {
  beforeEach(() => resetIpRateLimitForTests());

  it("AUTH-OTP-01 isolates keyed codes by attempt and delivery channel", () => {
    const original = codeMac(secret, "sms", attemptA, "123456");
    expect(original).toMatch(/^[0-9a-f]{64}$/);
    expect(safeEqualHex(original, original)).toBe(true);
    for (const mismatch of [
      codeMac(secret, "email", attemptA, "123456"),
      codeMac(secret, "sms", attemptB, "123456"),
      codeMac(secret, "sms", attemptA, "123457"),
    ]) expect(safeEqualHex(original, mismatch)).toBe(false);
    for (const malformed of ["", "zz", "00", "A".repeat(64), original.slice(0, 63)]) {
      expect(safeEqualHex(original, malformed)).toBe(false);
    }
    expect(contactFingerprint(secret, "phone", "+919100060001"))
      .not.toBe(contactFingerprint(secret, "email", "+919100060001"));
  });

  it("AUTH-OTP-02 rates per contact, address and verification challenge", () => {
    expect(ATTEMPT_LIFETIME_SECONDS).toBe(300);
    expect(MAX_SENDS_PER_CONTACT).toBeLessThanOrEqual(MAX_SENDS_PER_CONTACT_TOTAL);
    expect(MAX_SENDS_PER_CONTACT_TOTAL).toBeLessThan(MAX_SENDS_PER_ADDRESS);
    expect(MAX_EMAIL_RESENDS).toBeLessThanOrEqual(5);
    const login = source("src/modules/auth/login-service.ts");
    expect(login).toContain("deps.repository.reserveVerification(attempt.id)");
    expect(login).toContain('throw new LoginError("SECOND_FACTOR_REQUIRED")');
    expect(login).toContain('throw new LoginError("OTP_ATTEMPTS_EXCEEDED")');
    const repository = source("src/modules/auth/login-repository.ts");
    expect(repository).toContain("verification_attempts = verification_attempts + 1");
    expect(repository).toContain("AND verification_attempts < 5");
    expect(repository).toContain("AND used_at IS NULL");
    expect(repository).toContain("AND expires_at > now()");
    expect(repository).toContain("SET verified_at = now()");
    expect(repository).toContain("sms_code_mac = NULL");
    expect(repository).toContain("email_code_mac = NULL");
  });

  it("AUTH-rate-limits-02 rejects bursts while keeping IP buckets independent", () => {
    const untrusted = new Request("https://lms.test", {
      headers:{"x-forwarded-for":"spoofed, 203.0.113.10, 130.211.0.1"},
    });
    expect(clientIp(untrusted)).toBe("203.0.113.10");
    for(let i=0;i<10;i++)expect(allowRequest("login-verify:203.0.113.10",10,60_000,1_000)).toBe(true);
    expect(allowRequest("login-verify:203.0.113.10",10,60_000,1_001)).toBe(false);
    expect(allowRequest("login-verify:203.0.113.11",10,60_000,1_001)).toBe(true);
    expect(allowRequest("login-verify:203.0.113.10",10,60_000,61_001)).toBe(true);
    const shared = source("src/modules/auth/http.ts");
    expect(shared).toContain("isSameOriginRequest(request)");
    expect(shared).toContain("schema.safeParse(json)");
    expect(shared).toContain('error: "TOO_MANY_REQUESTS"');
    expect(shared).toContain('"Retry-After"');
    for(const route of ["start","email","verify"]) {
      const code = source("src/app/api/auth/login/"+route+"/route.ts");
      expect(code).toContain("guardLoginRequest(");
      expect(code).toContain("loginErrorResponse(");
    }
  });

  it("AUTH-sessions-01 uses opaque signed credentials, scoped ownership and expiry checks", () => {
    const tokenA=generateToken(), tokenB=generateToken();
    expect(tokenA).not.toBe(tokenB);
    expect(tokenA.length).toBeGreaterThanOrEqual(40);
    expect(sessionDigest(secret,tokenA)).not.toBe(tokenA);
    expect(sessionDigest(secret,tokenA)).not.toBe(sessionDigest(secret,tokenB));
    const sessions=source("src/modules/auth/session-service.ts");
    expect(sessions).toContain("sessionDigest(config.secret, token)");
    expect(sessions).toContain('if (row["revoked"]) return { ok: false, reason: "SESSION_REVOKED" }');
    expect(sessions).toContain('if (row["expired"]) return { ok: false, reason: "SESSION_EXPIRED" }');
    expect(sessions).toContain('if (row["platform_status"] !== "ACTIVE")');
    expect(sessions).toContain("WHERE user_id = ${userId}");
    expect(sessions).toContain("AND id <> ${currentSessionId}");
    expect(sessions).toContain("WHERE id = ${sessionId} AND user_id = ${userId}");
  });

  it("AUTH-sessions-04 replacing one's session must never revoke an unrelated user's token", () => {
    const repository=source("src/modules/auth/login-repository.ts");
    const start=repository.indexOf("if (session.previousDigest) {");
    const revoke=repository.slice(start,start+600);
    expect(revoke).toContain("WHERE credential_digest = ${session.previousDigest}");
    expect(revoke).toContain("AND user_id = ${userId}");
    expect(revoke).toContain("AND revoked_at IS NULL");
    expect(repository).toContain("return getDb().transaction(async (tx) =>");
    expect(repository).toContain("const consumed = await consumeInTransaction(tx, id)");
  });

  it("AUTH-handoff-01 login clears previous college scope and issues host-scoped session", () => {
    const verify = source("src/app/api/auth/login/verify/route.ts");
    expect(verify).toContain("previousToken: previousToken(request)");
    expect(verify).toContain("tenantCollegeId: guarded.tenantCollegeId");
    expect(verify).toContain("membership.status === \"ACTIVE\"");
    expect(verify).toContain("response.cookies.set(ADMIN_SCOPE_COOKIE_NAME, \"\",");
    expect(verify).toContain("autoMembershipId ?? \"\"");
    expect(verify).toContain("httpOnly: true");
    expect(verify).toContain('sameSite: "lax"');
    const login = source("src/modules/auth/login-service.ts");
    expect(login).toContain("await assertCanSignInHere(deps, user, input.tenantCollegeId)");
    expect(login).toContain("deps.repository.consumeAttempt(");
  });

  it("AUTH-sessions-03 revoke all devices expires the current authentication and role cookies", () => {
    const route = source("src/app/api/auth/devices/route.ts");
    expect(route).toContain('scope==="all"');
    expect(route).toContain("revokeAllOwnSessions(session.userId)");
    expect(route).toContain('if (scope === "all")');
    for (const name of [
      "SESSION_COOKIE_NAME", "MEMBERSHIP_COOKIE_NAME",
      "ROLE_COOKIE_NAME", "ADMIN_SCOPE_COOKIE_NAME",
    ]) expect(route).toContain(name);
    expect(route).toContain('maxAge: 0');
    expect(route).toContain('response.headers.set("Clear-Site-Data"');
    expect(route).toContain("revokeOtherSessions(session.userId,session.sessionId)");
  });

  it("AUTH-sessions-02 only own devices may be revoked and mutations require same origin", () => {
    const all = source("src/app/api/auth/devices/route.ts");
    const one = source("src/app/api/auth/devices/[sessionId]/route.ts");
    const logout = source("src/app/api/auth/session/route.ts");
    for(const file of [all,one,logout]) expect(file).toContain("isSameOriginRequest(request)");
    expect(all).toContain("listActiveSessions(session.userId)");
    expect(all).toContain("revokeOtherSessions(");
    expect(all).toContain("session.sessionId");
    expect(one).toContain("revokeOwnSession(sessionId, session.userId)");
    expect(one).toContain("z.string().uuid().parse");
    expect(one).toContain("sessionId === session.sessionId");
    expect(one).toContain("maxAge: 0");
    expect(one).toContain('response.headers.set("Clear-Site-Data"');
    for (const cookie of ["SESSION_COOKIE_NAME","MEMBERSHIP_COOKIE_NAME","ROLE_COOKIE_NAME","ADMIN_SCOPE_COOKIE_NAME"]) {
      expect(one).toContain(cookie);
    }
    for(const cookie of ["SESSION_COOKIE_NAME","MEMBERSHIP_COOKIE_NAME","ADMIN_SCOPE_COOKIE_NAME"]) {
      expect(logout).toContain(cookie);
    }
    expect(logout).toContain("maxAge: 0");
    expect(logout).toContain('response.headers.set("Cache-Control", "no-store")');
    expect(logout).toContain("logError(\"auth.logout_revoke_failed\", error)");
  });
});
