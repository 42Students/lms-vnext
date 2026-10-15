import {z} from "zod";
export const placementFeatureChangeSchema=z.strictObject({
 collegeId:z.uuid(),enabled:z.boolean(),expectedVersion:z.number().int().nonnegative(),
});
export function placementFeatureEffects(enabled:boolean) {
 return enabled?{access:"OPEN" as const,deletesData:false,impact:"Placements becomes available to authorized college users."}:
 {access:"CLOSED" as const,deletesData:false,impact:"Placement workflows close; existing placements data is retained."};
}
