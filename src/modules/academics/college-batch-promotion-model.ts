import { z } from "zod";

export function formatPromotionAcademicYear(yearStart: number): string {
  return `${yearStart}-${String((yearStart + 1) % 100).padStart(2, "0")}`;
}

export const collegePromotionQuerySchema = z.object({
  programId: z.string().uuid().optional(),
  cohortId: z.string().uuid().optional(),
  yearStart: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
    if (!match) return value;
    const first = Number(match[1]);
    return Number(match[2]) === (first + 1) % 100 ? first : value;
  }, z.coerce.number().int().min(1900).max(9998).optional()),
}).strict();

export type CollegePromotionQuery = z.infer<typeof collegePromotionQuerySchema>;

export type PromotionBlocker =
  | "BATCH_NOT_ACTIVE" | "PROGRESSION_MISSING" | "TERM_OUTSIDE_PROGRAM"
  | "NEXT_TERM_UNCONFIGURED" | "ACADEMIC_YEAR_MISSING"
  | "PERIOD_NOT_CONFIGURED" | "PERIOD_OUTSIDE_COLLEGE"
  | "NO_LEARNERS" | "PREVIEW_TOO_LARGE"
  | "ENROLLMENT_INACTIVE" | "MEMBERSHIP_INACTIVE"
  | "ACCOUNT_INACTIVE" | "LEARNER_ROLE_MISSING" | "NO_ACTIVE_CLASS";

export function batchPromotionPlan(input: {
  cohortStatus: string;
  currentTermNumber: number | null;
  durationTerms: number;
  nextTermConfigured: boolean;
  currentYearStart: number | null;
  overrideYearStart?: number;
  currentPeriodConfigured: boolean;
  currentPeriodOwned: boolean;
}): {
  action: "PROMOTE" | "GRADUATE" | "UNAVAILABLE";
  targetTermNumber: number | null;
  academicYearStart: number | null;
  blockers: PromotionBlocker[];
} {
  const blockers: PromotionBlocker[] = [];
  if (input.cohortStatus !== "ACTIVE") blockers.push("BATCH_NOT_ACTIVE");
  if (input.currentTermNumber === null) blockers.push("PROGRESSION_MISSING");
  const termValid = input.currentTermNumber !== null &&
    input.currentTermNumber >= 1 && input.currentTermNumber <= input.durationTerms;
  if (input.currentTermNumber !== null && !termValid)
    blockers.push("TERM_OUTSIDE_PROGRAM");
  if (!input.currentPeriodConfigured) blockers.push("PERIOD_NOT_CONFIGURED");
  else if (!input.currentPeriodOwned) blockers.push("PERIOD_OUTSIDE_COLLEGE");
  const year = input.overrideYearStart ?? input.currentYearStart;
  if (year === null || year === undefined) blockers.push("ACADEMIC_YEAR_MISSING");
  const graduating = termValid && input.currentTermNumber === input.durationTerms;
  if (termValid && !graduating && !input.nextTermConfigured)
    blockers.push("NEXT_TERM_UNCONFIGURED");
  return {
    action: !termValid ? "UNAVAILABLE" : graduating ? "GRADUATE" : "PROMOTE",
    targetTermNumber: !termValid ? null : graduating ? null : input.currentTermNumber! + 1,
    academicYearStart: year ?? null,
    blockers,
  };
}

export function promotionLearnerBlockers(input: {
  enrollmentStatus: string;
  membershipStatus: string;
  accountStatus: string;
  hasLearnerRole: boolean;
  hasActiveClass: boolean;
  periodConfigured: boolean;
}): PromotionBlocker[] {
  const blockers: PromotionBlocker[] = [];
  if (input.enrollmentStatus !== "ACTIVE") blockers.push("ENROLLMENT_INACTIVE");
  if (input.membershipStatus !== "ACTIVE") blockers.push("MEMBERSHIP_INACTIVE");
  if (input.accountStatus !== "ACTIVE") blockers.push("ACCOUNT_INACTIVE");
  if (!input.hasLearnerRole) blockers.push("LEARNER_ROLE_MISSING");
  if (input.periodConfigured && !input.hasActiveClass) blockers.push("NO_ACTIVE_CLASS");
  return blockers;
}

export const collegePromotionExecuteSchema = z.object({
  cohortId: z.string().uuid(),
  programId: z.string().uuid(),
  expectedVersion: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  expectedCheckedLearners: z.number().int().min(1).max(2000),
  expectedTargetTerm: z.number().int().min(1).max(100),
  expectedAcademicYearStart: z.number().int().min(1900).max(9998),
  yearStart: z.number().int().min(1900).max(9998).optional(),
  confirm: z.literal(true),
  action: z.literal("PROMOTE"),
}).strict();

export function promotionReady(preview: {
  simulatedReadiness: boolean;
  blockedLearners: number;
  completePreview: boolean;
  plan: { action: string };
}): boolean {
  return preview.simulatedReadiness && preview.completePreview &&
    preview.blockedLearners === 0 && preview.plan.action === "PROMOTE";
}

export function promotionPreviewMatches(expected: {
  expectedCheckedLearners: number; expectedTargetTerm: number; expectedAcademicYearStart: number;
}, actual: {checkedLearners: number; plan: {targetTermNumber: number|null; academicYearStart: number|null}}): boolean {
  return expected.expectedCheckedLearners === actual.checkedLearners &&
    expected.expectedTargetTerm === actual.plan.targetTermNumber &&
    expected.expectedAcademicYearStart === actual.plan.academicYearStart;
}
