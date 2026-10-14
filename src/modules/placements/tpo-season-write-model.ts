import { z } from "zod";
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
export const tpoRulesChangeSchema = z.object({
  confirmed: z.literal(true),
  expectedVersion: z.number().int().min(0),
  countsAsPlacedAt: z.enum(["SELECTED", "OFFER_RELEASED", "OFFER_ACCEPTED"]),
  maxHeldOffers: z.number().int().min(1).max(1000),
  upliftPct: z.number().int().min(0).max(1000),
  minResponseHours: z.number().int().min(1).max(8760),
}).strict();
