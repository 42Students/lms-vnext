import { z } from "zod";

const collegeId = z.string().uuid();
const expectedVersion = z.number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER - 1);

/** V162: college_placement_rules, partial update semantics of legacy PUT. */
export const placementCollegeRulesPatchSchema = z.object({
  collegeId,
  expectedVersion,
  countsAsPlacedAt: z.enum([
    "SELECTED",
    "OFFER_RELEASED",
    "OFFER_ACCEPTED",
  ]).optional(),
  maxHeldOffers: z.number().int().min(1).optional(),
  upliftPct: z.number().int().min(0).optional(),
  minResponseHours: z.number().int().min(1).optional(),
}).strict().refine(
  (v) =>
    v.countsAsPlacedAt !== undefined ||
    v.maxHeldOffers !== undefined ||
    v.upliftPct !== undefined ||
    v.minResponseHours !== undefined,
  "At least one placement rule must change",
);

/** V162: privacy defaults are conservative and the college opts in. */
export const placementCompanyVisibilityPatchSchema = z.object({
  collegeId,
  expectedVersion,
  showCgpaExact: z.boolean().optional(),
  showTenthTwelfth: z.boolean().optional(),
  showProjectLinks: z.boolean().optional(),
  showAssessmentScores: z.boolean().optional(),
  showAttendance: z.boolean().optional(),
}).strict().refine(
  (v) =>
    v.showCgpaExact !== undefined ||
    v.showTenthTwelfth !== undefined ||
    v.showProjectLinks !== undefined ||
    v.showAssessmentScores !== undefined ||
    v.showAttendance !== undefined,
  "At least one visibility setting must change",
);

export const placementPolicyCollegeIdSchema = collegeId;

export type PlacementCollegeRulesPatch = z.input<
  typeof placementCollegeRulesPatchSchema
>;

export type PlacementCompanyVisibilityPatch = z.input<
  typeof placementCompanyVisibilityPatchSchema
>;
