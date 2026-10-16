import {z} from "zod";

/** The identity store has a single display name. Keep it canonical while
 * editing first and last names separately to preserve the employer UI. */
export const hrRecruiterNameFieldsSchema=z.strictObject({
 firstName:z.string().trim().min(1,"First name is required").max(100),
 lastName:z.string().trim().max(100),
});
export function splitHrRecruiterName(displayName:string|null){
 const tokens=(displayName??"").trim().split(/\s+/).filter(Boolean);
 return {firstName:tokens[0]??"",lastName:tokens.slice(1).join(" ")};
}
export function joinHrRecruiterName(firstName:string,lastName:string){
 const data=hrRecruiterNameFieldsSchema.parse({firstName,lastName});
 return [data.firstName,data.lastName].filter(Boolean).join(" ");
}
