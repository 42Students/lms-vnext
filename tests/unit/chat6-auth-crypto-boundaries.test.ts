import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  codeMac,
  contactFingerprint,
  generateCode,
  generateToken,
  mac,
  maskEmail,
  maskPhone,
  safeEqualHex,
  sessionDigest,
} from "@/modules/auth/crypto";

const secret = "auth-crypto-test-key";

describe("auth crypto: opaque one-time codes and device sessions", () => {
  it("computes a purpose-delimited keyed HMAC without exposing the source value", () => {
    const expected = createHmac("sha256", secret)
      .update("session\u0000opaque-device-token")
      .digest("hex");
    expect(mac(secret, "session", "opaque-device-token")).toBe(expected);
    expect(sessionDigest(secret, "opaque-device-token")).toBe(expected);
    expect(sessionDigest(secret, "other-token")).not.toBe(expected);
    expect(mac("other-secret", "session", "opaque-device-token")).not.toBe(expected);
  });

  it("separates SMS/email codes, challenge IDs, contact types and session namespaces", () => {
    const sms = codeMac(secret, "sms", "challenge-a", "123456");
    expect(sms).toMatch(/^[a-f0-9]{64}$/);
    expect(sms).not.toBe(codeMac(secret, "email", "challenge-a", "123456"));
    expect(sms).not.toBe(codeMac(secret, "sms", "challenge-b", "123456"));
    expect(sms).not.toBe(sessionDigest(secret, "123456"));
    expect(contactFingerprint(secret, "phone", "someone@example.edu"))
      .not.toBe(contactFingerprint(secret, "email", "someone@example.edu"));
    expect(contactFingerprint(secret, "email", "someone@example.edu"))
      .not.toBe(mac(secret, "session", "someone@example.edu"));
  });

  it("accepts only complete lowercase 256-bit MACs, including for equal malformed inputs", () => {
    const digest = sessionDigest(secret, "token");
    expect(safeEqualHex(digest, digest)).toBe(true);
    expect(safeEqualHex(digest, sessionDigest(secret, "token-b"))).toBe(false);
    for (const malformed of [
      "",
      "zz",
      "f".repeat(63),
      "f".repeat(65),
      "G".repeat(64),
      "A".repeat(64),
      " ".repeat(64),
    ]) {
      expect(safeEqualHex(malformed, malformed), malformed).toBe(false);
      expect(safeEqualHex(digest, malformed), malformed).toBe(false);
    }
    expect(safeEqualHex(digest, digest.toUpperCase())).toBe(false);
  });

  it("issues fixed-format six-digit codes and 256-bit URL-safe session tokens", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(generateCode()).toMatch(/^[1-9][0-9]{5}$/);
      expect(generateToken()).toMatch(/^[A-Za-z0-9_-]{43}$/);
    }
  });

  it("does not leak phone prefixes or full email local parts in contact hints", () => {
    expect(maskPhone("+919876543210")).toBe("********3210");
    expect(maskPhone("+91 (987) 654-3210")).toBe("********3210");
    expect(maskPhone("1234")).toBe("****");
    expect(maskPhone("")).toBe("****");
    expect(maskEmail("someone@example.edu")).toBe("so*****@example.edu");
    expect(maskEmail("x@example.edu")).toBe("x***@example.edu");
    expect(maskEmail("not-an-address")).toBe("***");
  });
});
