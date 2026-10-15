import { describe, expect, it } from "vitest";
import {
  recruiterGrantValidUntil, recruiterGrantEffectiveAt,
} from "@/modules/placements/recruiter-grant-expiry-policy";

describe("T-S1-01 expiring recruiter access", () => {
  it("uses calendar-month renewal and clamps end-of-month days", () => {
    expect(recruiterGrantValidUntil(new Date("2026-01-31T08:00:00Z"), 1)
      .toISOString()).toBe("2026-02-28T08:00:00.000Z");
    expect(recruiterGrantValidUntil(new Date("2024-01-31T08:00:00Z"), 1)
      .toISOString()).toBe("2024-02-29T08:00:00.000Z");
  });
  it("requires a positive configured duration", () => {
    expect(() => recruiterGrantValidUntil(new Date(), 0)).toThrow();
    expect(() => recruiterGrantValidUntil(new Date(), 61)).toThrow();
  });
  const now = new Date("2026-10-16T00:00:00Z");
  const base = { status: "ACTIVE", validUntil: new Date("2026-10-17T00:00:00Z"),
    verificationStatus: "VERIFIED", capabilities: ["DRIVES"] };
  it("fails closed for missing, expired, unverified or revoked grants", () => {
    expect(recruiterGrantEffectiveAt(base, now, "DRIVES")).toBe(true);
    expect(recruiterGrantEffectiveAt({ ...base, validUntil: now }, now)).toBe(false);
    expect(recruiterGrantEffectiveAt({ ...base, validUntil: null }, now)).toBe(false);
    expect(recruiterGrantEffectiveAt({ ...base, verificationStatus: "PENDING" }, now)).toBe(false);
    expect(recruiterGrantEffectiveAt({ ...base, status: "REVOKED" }, now)).toBe(false);
    expect(recruiterGrantEffectiveAt(base, now, "APPLICANT_EXPORT")).toBe(false);
  });
});
