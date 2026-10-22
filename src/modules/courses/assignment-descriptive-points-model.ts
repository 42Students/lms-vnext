import {z} from "zod";

export const descriptiveAssignmentPointsSchema=z.strictObject({
 expectedVersion:z.number().int().min(0),
 pointsToAdd:z.number().int().min(1).max(10000),
 feedback:z.string().trim().max(10000).nullable().optional(),
});
/** Preserve the original submission's grade ceiling. Description points are
 * additive ONLY on an ungraded submission; the server separately guards
 * against a previously graded/auto-graded row and checks optimistic CAS. */
export function addDescriptivePoints(
 existing:number,additional:number,ceiling:number,
):number{
 if(!Number.isSafeInteger(existing)||existing<0||
   !Number.isSafeInteger(additional)||additional<1||
   !Number.isSafeInteger(ceiling)||ceiling<0||
   existing>ceiling||additional>ceiling-existing)
  throw new RangeError("Descriptive points exceed the assignment maximum");
 return existing+additional;
}
