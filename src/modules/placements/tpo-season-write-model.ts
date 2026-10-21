import { z } from "zod";
import {TPO_RULE_LIMITS} from "./tpo-rule-limits";
/** Additional vNext fields must be visible beside the legacy season name and dates. */
export const TPO_SEASON_FORM_COPY = {
 name: "Season name",
 code: "Season code",
 startDate: "Start date",
 endDate: "End date",
 confirmation: "I confirm these placement season details.",
 codeHelp: "Season code is required in the new LMS to uniquely identify a season. It is not generated from the season name.",
 confirmationHelp: "Confirm the season name, code and dates before saving.",
} as const;
const fields = {
  name: z.string().trim().min(2).max(160),
  code: z.string().trim().min(2).max(64),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
};
export const tpoSeasonChangeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("CREATE"), confirmed: z.literal(true), ...fields }).strict(),
  z.object({ action: z.literal("EDIT"), confirmed: z.literal(true), seasonId: z.string().uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }), ...fields }).strict(),
]).refine((value) => value.endDate >= value.startDate, {
  path: ["endDate"], message: "End date must be on or after start date",
});
/** The legacy create form also exposed registration. Activation alone does not
 * open registration in vNext: academic-cohort consent and eligibility checks
 * belong to a different lifecycle. Always show this before confirmation. */
export const TPO_SEASON_CREATE_REVIEW_COPY={
 fields:["Season name","Season code","Start date","End date"] as const,
 notice:"Creating a placement season does not open learner registration. Registration must be opened for eligible academic cohorts separately.",
 confirm:"I understand that students cannot register merely because a season is active.",
 unavailable:"Registration opening and deadline are managed separately from season dates.",
} as const;
export const tpoRulesChangeSchema = z.object({
  confirmed: z.literal(true),
  expectedVersion: z.number().int().min(0),
  countsAsPlacedAt: z.enum(["OFFER_RELEASED", "OFFER_ACCEPTED"]),
  maxHeldOffers: z.number().int().min(TPO_RULE_LIMITS.maxHeldOffers.min).max(TPO_RULE_LIMITS.maxHeldOffers.max),
  upliftPct: z.number().int().min(TPO_RULE_LIMITS.upliftPct.min).max(TPO_RULE_LIMITS.upliftPct.max),
  minResponseHours: z.number().int().min(TPO_RULE_LIMITS.minResponseHours.min).max(TPO_RULE_LIMITS.minResponseHours.max),
}).strict();
