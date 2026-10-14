import { describe, expect, it } from "vitest";
import { collegePromotionExecuteSchema, promotionReady } from "@/modules/academics/college-batch-promotion-model";

describe("College Admin promotion execute boundaries", () => {
  const valid = {
    cohortId: "10000000-0000-4000-8000-000000000001",
    programId: "20000000-0000-4000-8000-000000000001",
    expectedVersion: 0,
    expectedCheckedLearners: 1,
    expectedTargetTerm: 2,
    expectedAcademicYearStart: 2026,
    action: "PROMOTE",
    confirm: true,
  } as const;

  it("requires an exact confirmation, prior version and same known identifiers", () => {
    expect(collegePromotionExecuteSchema.parse(valid)).toEqual(valid);
    for (const field of ["expectedCheckedLearners", "expectedTargetTerm", "expectedAcademicYearStart"] as const) {
      const missing: Partial<typeof valid> = { ...valid };
      delete missing[field];
      expect(collegePromotionExecuteSchema.safeParse(missing).success).toBe(false);
    }
    expect(collegePromotionExecuteSchema.safeParse({
      ...valid, expectedVersion: -1,
    }).success).toBe(false);
    expect(collegePromotionExecuteSchema.safeParse({
      ...valid, confirm: false,
    }).success).toBe(false);
    expect(collegePromotionExecuteSchema.safeParse({
      ...valid, collegeId: valid.programId,
    }).success).toBe(false);
    expect(collegePromotionExecuteSchema.safeParse({
      ...valid, action: "GRADUATE",
    }).success).toBe(false);
    expect(collegePromotionExecuteSchema.safeParse({
      ...valid, yearStart: 1000,
    }).success).toBe(false);
  });

  it("fails closed when preview is truncated, blocked or graduating", () => {
    const ready = {
      simulatedReadiness: true,
      blockedLearners: 0,
      completePreview: true,
      plan: { action: "PROMOTE" },
    };
    expect(promotionReady(ready)).toBe(true);
    expect(promotionReady({ ...ready, blockedLearners: 1 })).toBe(false);
    expect(promotionReady({ ...ready, completePreview: false })).toBe(false);
    expect(promotionReady({ ...ready, plan: { action: "GRADUATE" } })).toBe(false);
    expect(promotionReady({ ...ready, simulatedReadiness: false })).toBe(false);
  });
});
