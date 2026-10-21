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

/** Batch JSON is untrusted at read time. Missing keys inherit college
 * defaults; malformed or unsupported JSON must never expand eligibility. */
export function effectiveTpoBatchRuleFields<T extends {
 countsAsPlacedAt:string;maxHeldOffers:number;upliftPct:number;minResponseHours:number;
}>(college:T,raw:unknown):T{
 if(raw===null||raw===undefined)return college;
 const parsed=tpoBatchRuleOverridesSchema.safeParse(raw);
 return parsed.success?{...college,...parsed.data}:college;
}
