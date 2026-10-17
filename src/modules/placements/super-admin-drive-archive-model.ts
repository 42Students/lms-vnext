import {z} from "zod";
export const superAdminArchiveImpactSchema=z.strictObject({
 activeApplications:z.number().int().nonnegative(),
 affectedLearners:z.number().int().nonnegative(),
 openRounds:z.number().int().nonnegative(),
 issuedOffers:z.number().int().nonnegative(),
 acceptedOffers:z.number().int().nonnegative(),
});
export const superAdminArchiveCommandSchema=z.strictObject({
 confirmed:z.literal(true),expectedUpdatedAt:z.iso.datetime({offset:true}),
 expectedImpact:superAdminArchiveImpactSchema,
 reason:z.string().trim().min(10).max(1000),
});
export function canArchiveDriveWithImpact(status:string,impact:z.infer<typeof superAdminArchiveImpactSchema>){
 return status!=="ARCHIVED"&&impact.acceptedOffers===0;
}
export function sameArchiveImpact(a:z.infer<typeof superAdminArchiveImpactSchema>,
 b:z.infer<typeof superAdminArchiveImpactSchema>){
 return Object.keys(a).every(key=>a[key as keyof typeof a]===b[key as keyof typeof b]);
}
