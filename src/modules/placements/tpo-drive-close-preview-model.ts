import {z} from "zod";
export const tpoDriveImpactCountsSchema=z.object({
 applications:z.number().int().nonnegative(),
 rounds:z.number().int().nonnegative(),
 offers:z.number().int().nonnegative(),
}).strict();
export type TpoDriveImpactCounts=z.infer<typeof tpoDriveImpactCountsSchema>;
export const tpoDriveCloseSchema=z.object({
 action:z.literal("CLOSE"),confirmed:z.literal(true),
 expectedUpdatedAt:z.iso.datetime({offset:true})
  .transform(value=>new Date(value).toISOString()),
 expectedCounts:tpoDriveImpactCountsSchema,
 reason:z.string().trim().min(10).max(1000),
}).strict();
export function evaluateTpoDriveClosure(
 status:string,seasonStatus:string|null,
 current:TpoDriveImpactCounts,expected:TpoDriveImpactCounts,
){
 if(status!=="PUBLISHED"||seasonStatus!=="ACTIVE")return "READ_ONLY" as const;
 if(current.applications!==expected.applications||current.rounds!==expected.rounds||
  current.offers!==expected.offers)return "PREVIEW_STALE" as const;
 return "ALLOW" as const;
}
