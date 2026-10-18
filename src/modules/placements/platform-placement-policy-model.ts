import { z } from "zod";

export const PLACEMENT_POLICY_FIELDS = [
 { key:"placement.applyRateLimitPerMinute",label:"Job application rate limit",unit:"per minute",defaultValue:5,min:1,max:100,step:1 },
 { key:"interview.overlapWindowMinutes",label:"Interview overlap window",unit:"minutes",defaultValue:60,min:5,max:480,step:1 },
 { key:"interview.overlapBufferMinutes",label:"Interview buffer",unit:"minutes",defaultValue:15,min:0,max:120,step:1 },
 { key:"interview.durationMinMinutes",label:"Interview duration — minimum",unit:"minutes",defaultValue:15,min:1,max:480,step:1 },
 { key:"interview.durationMaxMinutes",label:"Interview duration — maximum",unit:"minutes",defaultValue:480,min:1,max:1440,step:1 },
 { key:"placement.staleAppliedDays",label:"Stale application after",unit:"days",defaultValue:7,min:1,max:90,step:1 },
 { key:"placement.closingSoonDays",label:"Closing-soon window",unit:"days",defaultValue:3,min:1,max:60,step:1 },
 { key:"placement.needsAttentionSampleCap",label:"Items shown per alert category",unit:"items",defaultValue:5,min:1,max:50,step:1 },
 { key:"placement.lowConversionThreshold",label:"Low-conversion threshold",unit:"ratio",defaultValue:0.15,min:0,max:1,step:0.01 },
] as const;
export type PlacementPolicyKey=(typeof PLACEMENT_POLICY_FIELDS)[number]["key"];
export const platformPlacementPolicyInput=z.strictObject({
 key:z.enum(PLACEMENT_POLICY_FIELDS.map(field=>field.key) as [PlacementPolicyKey,...PlacementPolicyKey[]]),
 value:z.number().finite().nullable(),
 expectedVersion:z.number().int().min(0),
}).refine(input=>input.value===null||placementPolicyValidate(input.key,input.value),{
 path:["value"],message:"Policy value outside allowed range",
});
export function placementPolicyValidate(key:PlacementPolicyKey,value:number) {
 const rule=PLACEMENT_POLICY_FIELDS.find(item=>item.key===key)!;
 if(!Number.isFinite(value)||value<rule.min||value>rule.max|| (rule.step===1&&!Number.isInteger(value)) ||
   (rule.step!==1&&Math.abs(value*100-Math.round(value*100))>1e-7))return false;
 return true;
}


/** Read a persisted policy override without interpreting malformed legacy
 * numeric text as a safety setting. The write schema emits canonical decimals.
 */
export function storedPlacementPolicyValue(
 key: PlacementPolicyKey,
 raw: string | null | undefined,
): number {
 const field=PLACEMENT_POLICY_FIELDS.find(item=>item.key===key)!;
 const text=raw?.trim();
 if(!text||!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(text))return field.defaultValue;
 const value=Number(text);
 return placementPolicyValidate(key,value)?value:field.defaultValue;
}
