import { describe, expect, it } from "vitest";
import {
  isTpoCompanyTrustCurrent,
  tpoCompanyTrustChangeSchema,
} from "@/modules/placements/tpo-company-trust-model";

const id = "00000000-0000-4000-8000-000000000001";
const valid = {
  relationshipId: id,
  confirmed: true as const,
  reason: "Recruiter verification completed",
  expectedTrusted: false,
  nextTrusted: true,
};

describe("TPO company trust transitions", () => {
  it("requires explicit confirmation, reason and exact state change", () => {
    expect(tpoCompanyTrustChangeSchema.safeParse(valid).success).toBe(true);
    expect(tpoCompanyTrustChangeSchema.safeParse({ ...valid, confirmed: false }).success).toBe(false);
    expect(tpoCompanyTrustChangeSchema.safeParse({ ...valid, reason: "short" }).success).toBe(false);
    expect(tpoCompanyTrustChangeSchema.safeParse({ ...valid, nextTrusted: false }).success).toBe(false);
    expect(tpoCompanyTrustChangeSchema.safeParse({ ...valid, collegeId: id }).success).toBe(false);
  });

  it("rejects stale repeated and reversed transitions before updating", () => {
    expect(isTpoCompanyTrustCurrent(false, false, true)).toBe(true);
    expect(isTpoCompanyTrustCurrent(true, false, true)).toBe(false);
    expect(isTpoCompanyTrustCurrent(false, true, false)).toBe(false);
    expect(isTpoCompanyTrustCurrent(true, true, false)).toBe(true);
    expect(isTpoCompanyTrustCurrent(true, true, true)).toBe(false);
  });
});
