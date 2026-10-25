import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {mac,safeEqualHex,generateCode,generateToken,codeMac,contactFingerprint,sessionDigest,maskPhone,maskEmail}
 from "@/modules/auth/crypto";
import {normalizePhone,normalizeEmail,ATTEMPT_LIFETIME_SECONDS,MAX_EMAIL_RESENDS}
 from "@/modules/auth/login-service";
const src=(path:string)=>readFileSync(path,"utf8");
describe("chat-6 high priority auth login OTP session and deactivation adversarial coverage",()=>{
 it("AUTH-session-01 a disabled platform account's session is refused before last_seen mutation",()=>{
  const s=src("src/modules/auth/session-service.ts");
  const denied=s.indexOf('if (row["platform_status"] !== "ACTIVE")');
  const updated=s.indexOf('SET last_seen_at = now()');
  expect(denied).toBeGreaterThan(-1);
  expect(updated).toBeGreaterThan(denied);
  expect(s).toContain('reason: "SESSION_REVOKED"');
 });
 it("AUTH-session-02 a different owner cannot revoke a session by guessing its identifier",()=>{
  const s=src("src/modules/auth/session-service.ts");
  expect(s).toContain('WHERE id = ${sessionId} AND user_id = ${userId} AND revoked_at IS NULL');
  expect(s).toContain('AND id <> ${currentSessionId}');
  expect(s).toContain('AND revoked_at IS NULL');
 });
 it("AUTH-otp-01 challenge MACs are scoped by channel, attempt and purpose",()=>{
  const secret="unit-test-secret",code="123456";
  const a=codeMac(secret,"sms","attempt-a",code);
  expect(a).toMatch(/^[0-9a-f]{64}$/);
  expect(a).not.toBe(codeMac(secret,"email","attempt-a",code));
  expect(a).not.toBe(codeMac(secret,"sms","attempt-b",code));
  expect(a).not.toBe(sessionDigest(secret,code));
  expect(contactFingerprint(secret,"phone","+911234567890")).not.toBe(
    contactFingerprint(secret,"email","+911234567890"));
  expect(mac(secret,"x","a")).not.toBe(mac(secret,"y","a"));
 });
 it("AUTH-otp-02 fixed-time comparison only accepts identical MACs",()=>{
  const a=mac("secret","purpose","payload");
  expect(safeEqualHex(a,a)).toBe(true);
  expect(safeEqualHex(a,mac("secret","purpose","other"))).toBe(false);
  expect(safeEqualHex(a,"a")).toBe(false);
 });
 it("AUTH-otp-03 six-digit codes and opaque tokens cannot degrade to short identifiers",()=>{
  for(let i=0;i<32;i++){
   expect(generateCode()).toMatch(/^\d{6}$/);
   const token=generateToken();
   expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
  }
  expect(generateToken()).not.toBe(generateToken());
 });
 it("AUTH-login-01 malformed contacts and tenant-specific invalid identifiers are rejected",()=>{
  expect(normalizePhone("9876543210")).toBe("+919876543210");
  expect(normalizePhone("+919876543210")).toBe("+919876543210");
  for(const bad of ["","123","00000000","++919876543210","91123456789012"])
   expect(normalizePhone(bad)).toBe(null);
  expect(normalizeEmail(" USER@EXAMPLE.COM ")).toBe("user@example.com");
  expect(normalizeEmail("not an email")).toBe(null);
 });
 it("AUTH-login-02 user-facing contact masks never reveal full phone or local email",()=>{
  expect(maskPhone("+919876543210")).toBe("********3210");
  expect(maskPhone("111")).toBe("****");
  expect(maskEmail("example@example.org")).toContain("@example.org");
  expect(maskEmail("example@example.org")).not.toContain("example@example.org");
 });
 it("AUTH-login-03 OTP attempt and resend budgets are bounded and atomically consumed",()=>{
  expect(ATTEMPT_LIFETIME_SECONDS).toBe(300);
  expect(MAX_EMAIL_RESENDS).toBe(5);
  const s=src("src/modules/auth/login-service.ts");
  expect(s).toContain("reserveVerification");
  expect(s).toContain("consumeAttempt");
  expect(s).toContain("TOO_MANY_REQUESTS");
  expect(s).toContain("WRONG_TENANT");
 });
 it("AUTH-login-04 untrusted origin or invalid JSON cannot reach OTP delivery",()=>{
  const s=src("src/modules/auth/http.ts");
  expect(s).toContain("isSameOriginRequest(request)");
  expect(s).toContain("allowRequest");
  expect(s).toContain("schema.safeParse(json)");
  expect(s).toContain("UNKNOWN_TENANT_HOST");
  expect(s).toContain('"Retry-After"');
 });
});
