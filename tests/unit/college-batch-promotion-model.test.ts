import { describe, expect, it } from "vitest";
import {
  batchPromotionPlan, collegePromotionQuerySchema, promotionLearnerBlockers,
  promotionPreviewMatches, collegePromotionExecuteSchema,
} from "@/modules/academics/college-batch-promotion-model";

describe("College Admin batch promotion preview policy", () => {
  it("binds a confirmed promotion to count, term and year from the server preview",()=>{
    const expected={expectedCheckedLearners:2,expectedTargetTerm:4,expectedAcademicYearStart:2028};
    const actual={checkedLearners:2,plan:{targetTermNumber:4,academicYearStart:2028}};
    expect(promotionPreviewMatches(expected,actual)).toBe(true);
    expect(promotionPreviewMatches({...expected,expectedCheckedLearners:3},actual)).toBe(false);
    expect(promotionPreviewMatches({...expected,expectedTargetTerm:5},actual)).toBe(false);
    expect(promotionPreviewMatches({...expected,expectedAcademicYearStart:2029},actual)).toBe(false);
    const base={cohortId:"40000000-0000-4000-8000-000000000001",
      programId:"40000000-0000-4000-8000-000000000002",
      expectedVersion:0,action:"PROMOTE",confirm:true,...expected};
    expect(collegePromotionExecuteSchema.safeParse(base).success).toBe(true);
    expect(collegePromotionExecuteSchema.safeParse({...base,expectedCheckedLearners:undefined}).success).toBe(false);
    expect(collegePromotionExecuteSchema.safeParse({...base,collegeId:base.cohortId}).success).toBe(false);
  });
  const base = {
    cohortStatus: "ACTIVE", currentTermNumber: 1, durationTerms: 4,
    nextTermConfigured: true, currentYearStart: 2026,
    currentPeriodConfigured: true, currentPeriodOwned: true,
  };
  it("uses persisted next term, not inferred progression, and displays unsaved year override", () => {
    expect(batchPromotionPlan(base)).toMatchObject({
      action: "PROMOTE", targetTermNumber: 2,
      academicYearStart: 2026, blockers: [],
    });
    expect(batchPromotionPlan({ ...base, overrideYearStart: 2028 }))
      .toMatchObject({ academicYearStart: 2028, blockers: [] });
  });
  it("requires a configured next term, term progression, academic year and valid college period", () => {
    expect(batchPromotionPlan({ ...base, nextTermConfigured: false }).blockers)
      .toContain("NEXT_TERM_UNCONFIGURED");
    expect(batchPromotionPlan({ ...base, currentTermNumber: null }).blockers)
      .toContain("PROGRESSION_MISSING");
    expect(batchPromotionPlan({ ...base, currentYearStart: null }).blockers)
      .toContain("ACADEMIC_YEAR_MISSING");
    expect(batchPromotionPlan({ ...base, currentPeriodOwned: false }).blockers)
      .toContain("PERIOD_OUTSIDE_COLLEGE");
    expect(batchPromotionPlan({ ...base, cohortStatus: "ARCHIVED" }).blockers)
      .toContain("BATCH_NOT_ACTIVE");
  });
  it("COL-academic-setup-R04 blocks promotion when the active destination term has no mapped courses",()=>{
    expect(batchPromotionPlan({...base,nextTermHasCourses:false}).blockers)
      .toContain("NEXT_TERM_NO_MAPPED_COURSES");
    expect(batchPromotionPlan({...base,nextTermHasCourses:true}).blockers).toEqual([]);
    expect(batchPromotionPlan({...base,nextTermConfigured:false,nextTermHasCourses:false}).blockers)
      .toContain("NEXT_TERM_UNCONFIGURED");
    expect(batchPromotionPlan({...base,currentTermNumber:4,nextTermHasCourses:false}).blockers)
      .not.toContain("NEXT_TERM_NO_MAPPED_COURSES");
  });
  it("previews graduation only when current term is the program maximum", () => {
    expect(batchPromotionPlan({ ...base, currentTermNumber: 4 }))
      .toMatchObject({ action: "GRADUATE", targetTermNumber: null });
    expect(batchPromotionPlan({ ...base, currentTermNumber: 5 }))
      .toMatchObject({ action: "UNAVAILABLE", blockers: ["TERM_OUTSIDE_PROGRAM"] });
  });
  it("fails closed per learner on persisted account, membership and class states", () => {
    expect(promotionLearnerBlockers({
      enrollmentStatus: "ACTIVE", membershipStatus: "ACTIVE", accountStatus: "ACTIVE",
      hasLearnerRole: true, hasActiveClass: true, periodConfigured: true,
    })).toEqual([]);
    expect(promotionLearnerBlockers({
      enrollmentStatus: "WITHDRAWN", membershipStatus: "SUSPENDED",
      accountStatus: "SUSPENDED", hasLearnerRole: false, hasActiveClass: false,
      periodConfigured: true,
    })).toEqual([
      "ENROLLMENT_INACTIVE", "MEMBERSHIP_INACTIVE",
      "ACCOUNT_INACTIVE", "LEARNER_ROLE_MISSING", "NO_ACTIVE_CLASS",
    ]);
  });
  it("accepts only bounded query fields and valid academic year overrides", () => {
    const uuid = "40000000-0000-4000-8000-000000000001";
    expect(collegePromotionQuerySchema.parse({ cohortId: uuid, yearStart: "2028" }))
      .toEqual({ cohortId: uuid, yearStart: 2028 });
    for (const invalid of [
      { collegeId: uuid }, { cohortId: "broken" },
      { yearStart: 1899 }, { yearStart: 9999 }, { yearStart: 2026.5 },
    ]) expect(collegePromotionQuerySchema.safeParse(invalid).success).toBe(false);
  });
});
