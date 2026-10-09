import { describe, expect, it } from "vitest";
import {
  placementCollegeRulesPatchSchema,
  placementCompanyVisibilityPatchSchema,
} from "@/modules/placements/tpo-policy-validation";

const collegeId = "20000000-0000-4000-8000-000000000001";

describe("DB09-A V162 TPO placement settings validation", () => {
  it("allows legacy placement counting stages and partial rule updates", () => {
    for (const countsAsPlacedAt of [
      "SELECTED", "OFFER_RELEASED", "OFFER_ACCEPTED",
    ]) {
      expect(
        placementCollegeRulesPatchSchema.parse({
          collegeId, expectedVersion: 0, countsAsPlacedAt,
        }).countsAsPlacedAt,
      ).toBe(countsAsPlacedAt);
    }
    expect(
      placementCollegeRulesPatchSchema.parse({
        collegeId, expectedVersion: 2, upliftPct: 40,
      }).upliftPct,
    ).toBe(40);
  });

  it("rejects impossible rules, absent version and tenant spoofing fields", () => {
    const base = { collegeId, expectedVersion: 0 };
    for (const extra of [
      { countsAsPlacedAt: "OFFER_PENDING" },
      { maxHeldOffers: 0 },
      { upliftPct: -1 },
      { minResponseHours: 0 },
      { countsAsPlacedAt: "SELECTED", scope: "ALL_COLLEGES" },
    ]) {
      expect(() =>
        placementCollegeRulesPatchSchema.parse({ ...base, ...extra }),
      ).toThrow();
    }
    expect(() =>
      placementCollegeRulesPatchSchema.parse({
        collegeId, maxHeldOffers: 2,
      }),
    ).toThrow();
    expect(() =>
      placementCollegeRulesPatchSchema.parse(base),
    ).toThrow();
    expect(() =>
      placementCollegeRulesPatchSchema.parse({
        ...base, expectedVersion: Number.MAX_SAFE_INTEGER,
        maxHeldOffers: 2,
      }),
    ).toThrow();
  });

  it("allows disabling or enabling individual recruiter-visible fields", () => {
    for (const key of [
      "showCgpaExact",
      "showTenthTwelfth",
      "showProjectLinks",
      "showAssessmentScores",
      "showAttendance",
    ] as const) {
      expect(
        placementCompanyVisibilityPatchSchema.parse({
          collegeId, expectedVersion: 0, [key]: false,
        }),
      ).toMatchObject({ [key]: false });
    }
  });

  it("requires a version and rejects empty/unknown/privacy-abusive patches", () => {
    const base = { collegeId, expectedVersion: 0 };
    expect(() =>
      placementCompanyVisibilityPatchSchema.parse(base),
    ).toThrow();
    expect(() =>
      placementCompanyVisibilityPatchSchema.parse({
        collegeId, showCgpaExact: true,
      }),
    ).toThrow();
    expect(() =>
      placementCompanyVisibilityPatchSchema.parse({
        ...base, showCgpaExact: "true",
      }),
    ).toThrow();
    expect(() =>
      placementCompanyVisibilityPatchSchema.parse({
        ...base, showAttendance: true, showAadhaar: true,
      }),
    ).toThrow();
  });
});
