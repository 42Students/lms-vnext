import {z} from "zod";

/** The four overrideable legacy rules; missing keys inherit college defaults. */
export const tpoBatchRuleOverridesSchema=z.object({
 countsAsPlacedAt:z.enum(["OFFER_RELEASED","OFFER_ACCEPTED"]).optional(),
 maxHeldOffers:z.number().int().min(1).max(5).optional(),
 upliftPct:z.number().int().min(0).max(200).optional(),
 minResponseHours:z.number().int().min(12).max(168).optional(),
}).strict();
export const tpoBatchRuleSaveSchema=z.object({
 rulesOverride:tpoBatchRuleOverridesSchema,
 expectedVersion:z.union([z.literal("none"),z.iso.datetime({offset:true})]),
}).strict();
export type TpoBatchRuleFields={
 countsAsPlacedAt:"OFFER_RELEASED"|"OFFER_ACCEPTED";
 maxHeldOffers:number;
 upliftPct:number;
 minResponseHours:number;
};
export type TpoBatchRuleOverrides=z.infer<typeof tpoBatchRuleOverridesSchema>;
