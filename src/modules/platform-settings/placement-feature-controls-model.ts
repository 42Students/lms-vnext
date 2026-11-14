import {z} from "zod";
import { zUuid } from "@/lib/schema-primitives";
export const placementFeatureChangeSchema=z.strictObject({
 collegeId:zUuid,enabled:z.boolean(),expectedVersion:z.number().int().nonnegative(),
});
export function placementFeatureEffects(enabled:boolean) {
 return enabled?{access:"OPEN" as const,deletesData:false,impact:"Placements becomes available to authorized college users."}:
 {access:"CLOSED" as const,deletesData:false,impact:"Placement workflows close; existing placements data is retained."};
}
