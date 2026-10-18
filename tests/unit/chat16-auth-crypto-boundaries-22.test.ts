import { describe, expect, it } from "vitest";
import {
  mac, safeEqualHex, generateCode, generateToken, codeMac,
  contactFingerprint, sessionDigest, maskPhone, maskEmail,
} from "@/modules/auth/crypto";

const secret = "unit-auth-secret".repeat(4);
describe("chat-16 OTP identity crypto boundaries and contact secrecy", () => {
  it("AUTH-CRYPTO-01 compares only canonical full SHA-256 MACs", () => {
    const correct = mac(secret, "otp:sms:attempt-1", "123456");
    const forged = mac(secret, "otp:sms:attempt-1", "123457");
    expect(correct).toMatch(/^[0-9a-f]{64}$/);
    expect(safeEqualHex(correct, correct)).toBe(true);
    expect(safeEqualHex(correct, forged)).toBe(false);
    for (const bad of ["", "ab", "00", "a".repeat(62), "A".repeat(64),
      "g".repeat(64), "a".repeat(65), "not-hex", "💥"]) {
      expect(safeEqualHex(bad, bad)).toBe(false);
      expect(safeEqualHex(correct, bad)).toBe(false);
    }
  });

  it("AUTH-CRYPTO-02 challenge, contact and session MACs are purpose-isolated", () => {
    const sms = codeMac(secret, "sms", "attempt-1", "123456");
    const email = codeMac(secret, "email", "attempt-1", "123456");
    const otherAttempt = codeMac(secret, "sms", "attempt-2", "123456");
    expect(sms).not.toBe(email);
    expect(sms).not.toBe(otherAttempt);
    expect(sms).not.toBe(contactFingerprint(secret, "phone", "123456"));
    expect(contactFingerprint(secret, "email", "a@example.org"))
      .not.toBe(contactFingerprint(secret, "phone", "a@example.org"));
    expect(sessionDigest(secret, "123456")).not.toBe(sms);
    expect(sessionDigest("other-secret", "123456"))
      .not.toBe(sessionDigest(secret, "123456"));
  });

  it("AUTH-CRYPTO-03 generated one-time codes and opaque session tokens respect contracts", () => {
    for (let i = 0; i < 20; i++) {
      expect(generateCode()).toMatch(/^[1-9][0-9]{5}$/);
      const token = generateToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
      expect(Buffer.from(token, "base64url")).toHaveLength(32);
    }
  });

  it("AUTH-CRYPTO-04 login-facing masks do not disclose the entire contact", () => {
    expect(maskPhone("+919876543210")).toMatch(/\*+3210$/);
    expect(maskPhone("+919876543210")).not.toContain("9876543210");
    expect(maskPhone("")).toBe("****");
    expect(maskEmail("learner@example.org")).toContain("@example.org");
    expect(maskEmail("learner@example.org")).not.toContain("learner@");
    expect(maskEmail("not-an-email")).toBe("***");
  });
});
