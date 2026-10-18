import { describe, expect, it } from "vitest";
import {
  mac, safeEqualHex, generateCode, generateToken,
  codeMac, contactFingerprint, sessionDigest, maskPhone, maskEmail,
} from "@/modules/auth/crypto";

describe("WEAK-auth: real cryptographic isolation and fail-closed formatting",()=>{
  const secret="test-secret-do-not-use-in-production";
  it("WEAK-auth-01 MAC is deterministic hex and separated by purpose",()=>{
    const first=mac(secret,"session","token");
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).toBe(mac(secret,"session","token"));
    expect(first).not.toBe(mac(secret,"otp:sms","token"));
    expect(first).not.toBe(mac(secret,"session","token2"));
    expect(first).not.toBe(mac("different-secret","session","token"));
    expect(first).not.toContain("test-secret");
  });
  it("WEAK-auth-02 safeEqualHex cannot accept identical malformed digests or truncated hex",()=>{
    const signature=mac(secret,"check","value");
    expect(safeEqualHex(signature,signature)).toBe(true);
    expect(safeEqualHex(signature,mac(secret,"check","wrong"))).toBe(false);
    for(const value of ["","g","zz","z".repeat(64),"AB","Aa","a","aaa","a ".repeat(32)]){
      expect(safeEqualHex(value,value)).toBe(false);
    }
    expect(safeEqualHex(signature,signature.slice(0,-1))).toBe(false);
    expect(safeEqualHex(signature,signature.toUpperCase())).toBe(false);
  });
  it("WEAK-auth-03 OTP is six-digit decimal, tokens are 256-bit opaque URL-safe",()=>{
    const codes=Array.from({length:20},()=>generateCode());
    expect(codes.every(code=>/^[0-9]{6}$/.test(code))).toBe(true);
    const tokens=Array.from({length:8},()=>generateToken());
    expect(tokens.every(token=>/^[a-zA-Z0-9_-]{43}$/.test(token))).toBe(true);
    expect(new Set(tokens).size).toBe(tokens.length);
  });
  it("WEAK-auth-04 SMS/email OTP MACs and contact fingerprint do not cross-verify",()=>{
    const id="attempt-123";
    const sms=codeMac(secret,"sms",id,"123456");
    expect(sms).toMatch(/^[a-f0-9]{64}$/);
    expect(sms).not.toBe(codeMac(secret,"email",id,"123456"));
    expect(sms).not.toBe(codeMac(secret,"sms","attempt-124","123456"));
    expect(sms).not.toBe(codeMac(secret,"sms",id,"654321"));
    expect(contactFingerprint(secret,"phone","+919876543210"))
      .not.toBe(contactFingerprint(secret,"email","+919876543210"));
    expect(sessionDigest(secret,"opaque-token")).not.toBe(sms);
  });
  it("WEAK-auth-05 masked contacts never echo entire address or number",()=>{
    expect(maskPhone("+91 98765 43210")).toMatch(/\*+3210$/);
    expect(maskPhone("1234")).toBe("****");
    expect(maskEmail("someone@example.test")).toMatch(/^so\*+@example\.test$/);
    expect(maskEmail("malformed")).toBe("***");
    expect(maskEmail("a@example.test")).toMatch(/^a\*+@example\.test$/);
    expect(maskEmail("someone@example.test")).not.toContain("someone");
  });
});
