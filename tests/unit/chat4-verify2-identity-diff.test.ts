import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { saltedIdentityFingerprint } from "@/modules/profile-verification/identity-fingerprint";
import { learnerVerifiedIdentityChanged } from "@/modules/placements/learner-verified-identity-diff";

describe("W1 learner profile verified-identity comparison", () => {
  const salt="b".repeat(64);
  const snapshot={
    identityHashSalt:salt,
    aadhaarNumber:"XXXXXXXX1234",panNumber:"XXXXXXXX6F",
    aadhaarHash:saltedIdentityFingerprint("AADHAAR","123412341234",salt),
    panHash:saltedIdentityFingerprint("PAN","ABCDE1234F",salt),
  };
  it("compares verified fingerprints without returning a number or a hash", () => {
    expect(learnerVerifiedIdentityChanged(snapshot,{
      aadhaarNumber:"1234 1234 1234",panNumber:"abcde1234f",
    })).toBe(false);
    expect(learnerVerifiedIdentityChanged(snapshot,{
      aadhaarNumber:"1234 1234 1234",panNumber:"ABCDE1234G",
    })).toBe(true);
    expect(learnerVerifiedIdentityChanged(snapshot,{
      aadhaarNumber:"",panNumber:"ABCDE1234F",
    })).toBe(true);
  });
  it("does not assert equality when a legacy snapshot is not comparable", () => {
    expect(learnerVerifiedIdentityChanged(null,{
      aadhaarNumber:"123412341234",panNumber:"",
    })).toBeNull();
    expect(learnerVerifiedIdentityChanged({
      aadhaarNumber:"XXXXXXXX1234",panNumber:"",identityHashSalt:salt,
    },{aadhaarNumber:"123412341234",panNumber:""})).toBeNull();
    expect(learnerVerifiedIdentityChanged({
      identityHashSalt:salt,aadhaarNumber:"",panNumber:"",
    },{aadhaarNumber:"",panNumber:""})).toBe(false);
  });
  it("shows a private warning, not a previously verified raw identifier", () => {
    const service=readFileSync("src/modules/placements/learner-verification-status-service.ts","utf8");
    const page=readFileSync("src/app/(authenticated)/learn/profile/verification/page.tsx","utf8");
    expect(service).toContain("learnerVerifiedIdentityChanged(row?.verifiedSnapshot,document.identity)");
    expect(page).toContain("row.identityChangedSinceVerification===true");
    expect(page).toContain("Your current identity details differ from the last verified record.");
    expect(page).toContain("previously verified identity number is never displayed");
    expect(service).not.toContain("identityHashSalt:identityChanged");
  });
});
