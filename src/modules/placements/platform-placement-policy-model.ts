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
});
export function placementPolicyValidate(key:PlacementPolicyKey,value:number) {
 const rule=PLACEMENT_POLICY_FIELDS.find(item=>item.key===key)!;
 if(value<rule.min||value>rule.max|| (rule.step===1&&!Number.isInteger(value)) ||
   (rule.step!==1&&!Number.isInteger(value*100)))return false;
 return true;
}
