import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { deriveVerifiedAlertAccountHash } from "@/modules/log-alerts/account-identity";

const key = "long-stable-log-alert-account-key-test-2026";
const userId = "11111111-1111-4111-8111-111111111111";
const collegeId = "22222222-2222-4222-8222-222222222222";

describe("DB-023 scoped, validated account blast-radius identity", () => {
  it("preserves historical account HMAC identity for valid canonical UUIDs", () => {
    const hashed = deriveVerifiedAlertAccountHash({ userId, collegeId, key });
    const previousDigest = createHmac("sha256", key)
      .update(collegeId + ":" + userId).digest("hex");
    expect(hashed).toBe(previousDigest);
    expect(hashed).toMatch(/^[0-9a-f]{64}$/);
    expect(hashed).not.toContain(userId);
  });

  it("counts a platform context separately from college membership", () => {
    const platform = deriveVerifiedAlertAccountHash({ userId, key });
    const scoped = deriveVerifiedAlertAccountHash({ userId, collegeId, key });
    const other = deriveVerifiedAlertAccountHash({
      userId, collegeId: "33333333-3333-4333-8333-333333333333", key,
    });
    expect(platform).toMatch(/^[0-9a-f]{64}$/);
    expect(scoped).not.toBe(platform);
    expect(other).not.toBe(scoped);
  });

  it("normalizes UUID casing rather than splitting one person's count", () => {
    expect(deriveVerifiedAlertAccountHash({
      userId: userId.toUpperCase(), collegeId: collegeId.toUpperCase(), key,
    })).toBe(deriveVerifiedAlertAccountHash({ userId, collegeId, key }));
  });

  it("does not count malformed or browser-supplied identity markers", () => {
    for (const value of [
      "12345678901234567890",
      "somebody@example.test",
      "bad",
      "11111111-1111-4111-8111-111111111111  ",
    ]) {
      expect(deriveVerifiedAlertAccountHash({ userId: value, collegeId, key }))
        .toBeNull();
    }
    expect(deriveVerifiedAlertAccountHash({
      userId, collegeId: "not-a-college", key,
    })).toBeNull();
    expect(deriveVerifiedAlertAccountHash({
      userId, collegeId: "11111111-1111-4111-1111-111111111111", key,
    })).toBeNull();
  });

  it("fails closed without independent stable secret, not a public SHA256", () => {
    expect(deriveVerifiedAlertAccountHash({ userId, collegeId, key: "" }))
      .toBeNull();
    expect(deriveVerifiedAlertAccountHash({ userId, collegeId, key: "weak" }))
      .toBeNull();
    expect(deriveVerifiedAlertAccountHash({
      userId, collegeId, key: "second-long-stable-log-alert-account-key-2026",
    })).not.toBe(deriveVerifiedAlertAccountHash({ userId, collegeId, key }));
  });
});
