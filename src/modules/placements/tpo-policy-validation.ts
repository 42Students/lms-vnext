import { z } from "zod";
import {TPO_RULE_LIMITS} from "./tpo-rule-limits";

const collegeId = z.string().uuid();
const expectedVersion = z.number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER - 1);

/** V162: college_placement_rules, partial update semantics of legacy PUT. */
export const placementCollegeRulesPatchSchema = z.object({
  collegeId,
  expectedVersion,
  // The college rules endpoint accepts release/accept only. SELECTED is a
  // pre-release roster decision, not an issued offer and cannot count placed.
  countsAsPlacedAt: z.enum([
    "OFFER_RELEASED",
    "OFFER_ACCEPTED",
  ],{error:"Counts as placed must be when the offer is released or accepted"}).optional(),
  maxHeldOffers: z.number().int().min(TPO_RULE_LIMITS.maxHeldOffers.min).max(TPO_RULE_LIMITS.maxHeldOffers.max).optional(),
  upliftPct: z.number().int().min(TPO_RULE_LIMITS.upliftPct.min).max(TPO_RULE_LIMITS.upliftPct.max).optional(),
  minResponseHours: z.number().int().min(TPO_RULE_LIMITS.minResponseHours.min).max(TPO_RULE_LIMITS.minResponseHours.max).optional(),
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
