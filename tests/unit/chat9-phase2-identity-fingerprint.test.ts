import { describe, expect, it, vi } from "vitest";
import { saltedIdentityFingerprint, stableIdentitySalt } from "@/modules/profile-verification/identity-fingerprint";
import { safeVerificationSnapshot, VerificationStateError } from "@/modules/profile-verification/domain";

const a = "a".repeat(64), b = "b".repeat(64);
describe("profile verification salted Aadhaar/PAN fingerprint", () => {
  it("uses an existing per-membership salt for repeat submissions", () => {
    const factory = vi.fn(()=>b);
    expect(stableIdentitySalt(a,factory)).toBe(a);
    expect(factory).not.toHaveBeenCalled();
  });
  it("rejects invalid inherited salts and creates a strong new salt", () => {
    expect(stableIdentitySalt("weak",()=>b)).toBe(b);
    expect(()=>stableIdentitySalt(null,()=>"123")).toThrow("salt");
  });
  it("detects changed Aadhaar/PAN numbers without exposing original values", () => {
    const original = saltedIdentityFingerprint("AADHAAR","123412341234",a);
    expect(original).toMatch(/^[0-9a-f]{64}$/);
    expect(original).not.toContain("1234");
    expect(saltedIdentityFingerprint("AADHAAR","123412341234",a)).toBe(original);
    expect(saltedIdentityFingerprint("AADHAAR","123412341235",a)).not.toBe(original);
    expect(saltedIdentityFingerprint("AADHAAR","123412341234",b)).not.toBe(original);
    expect(saltedIdentityFingerprint("PAN","123412341234",a)).not.toBe(original);
  });
  it("allows only hex salted metadata and masked numbers in the safe snapshot", () => {
    const safe = safeVerificationSnapshot({
      aadhaarNumber:"XXXXXXXX1234",identityHashSalt:a,
      aadhaarHash:saltedIdentityFingerprint("AADHAAR","123412341234",a),
    });
    expect(JSON.stringify(safe)).not.toContain("123412341234");
    expect(()=>safeVerificationSnapshot({aadhaarHash:"123412341234"}))
      .toThrowError(VerificationStateError);
    expect(()=>safeVerificationSnapshot({aadhaarNumber:"123412341234"}))
      .toThrowError(VerificationStateError);
  });
});
