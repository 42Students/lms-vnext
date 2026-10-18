import {z} from "zod";

/** The identity store has a single display name. Keep it canonical while
 * editing first and last names separately to preserve the employer UI. */
export const hrRecruiterNameFieldsSchema=z.strictObject({
 firstName:z.string().trim().min(1,"First name is required").max(100)
  .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid first name"}),
 lastName:z.string().trim().max(100)
  .refine(value=>!/[\x00-\x1f\x7f]/.test(value),{message:"Invalid last name"}),
}).superRefine((input,ctx)=>{
 const combined=[input.firstName,input.lastName].filter(Boolean).join(" ");
 if(combined.length<2||combined.length>160)ctx.addIssue({
  code:"custom",path:["firstName"],message:"Full name must be between 2 and 160 characters",
 });
});
export function splitHrRecruiterName(displayName:string|null){
 const tokens=(displayName??"").trim().split(/\s+/).filter(Boolean);
 return {firstName:tokens[0]??"",lastName:tokens.slice(1).join(" ")};
}
export function joinHrRecruiterName(firstName:string,lastName:string){
 const data=hrRecruiterNameFieldsSchema.parse({firstName,lastName});
 return [data.firstName,data.lastName].filter(Boolean).join(" ");
}

/** Compare the identity name row's optimistic timestamp at persisted millisecond precision. */
export function sameHrNameVersion(actual:Date,expected:string):boolean{
 const value=Date.parse(expected);
 return Number.isFinite(value)&&Number.isFinite(actual.getTime())&&
  Math.trunc(actual.getTime())===Math.trunc(value);
}
