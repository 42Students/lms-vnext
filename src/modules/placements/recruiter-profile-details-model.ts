import {z} from "zod";
import {hrRecruiterNameFieldsSchema} from "./hr-recruiter-name-fields-model";
export const recruiterProfileDetailsPatchSchema=z.strictObject({
 firstName:z.string().trim().min(1).max(100),
 lastName:z.string().trim().max(100),
 title:z.string().trim().max(160),
 phone:z.string().trim().max(20),
 expectedUserUpdatedAt:z.iso.datetime(),
 expectedProfileUpdatedAt:z.iso.datetime(),
}).superRefine((input,ctx)=>{
 const valid=hrRecruiterNameFieldsSchema.safeParse({
  firstName:input.firstName,lastName:input.lastName,
 });
 if(!valid.success)ctx.addIssue({code:"custom",path:["firstName"],message:"Enter a valid first and last name."});
 const digits=input.phone.replace(/\D/g,"");
 if(input.phone&&(!/^\+?[0-9() .-]+$/.test(input.phone)||
   !(digits.length===10||(digits.length===12&&digits.startsWith("91")))))
  ctx.addIssue({code:"custom",path:["phone"],message:"Enter a valid 10-digit mobile number, or leave it blank"});
});

/** Safe, actionable save feedback; never echo server error details or discard the form. */
export function hrProfileSaveErrorFeedback(status:number):string{
 if(status===409)return "Your profile changed. Refresh before saving; your edits are still here.";
 if(status===401)return "Your session has expired. Sign in again to save; your edits are still here.";
 if(status===403)return "Your recruiter access has ended. Ask the placement cell to restore it; your edits are still here.";
 if(status===429)return "Too many save attempts. Try again shortly; your edits are still here.";
 return "Could not save your profile. Your changes are still here; try again.";
}

/** A successful HTTP status (including a sign-in fallback) is not a saved
 * recruiter profile. Validate the exact server projection and CAS tokens. */
export const hrProfileDetailsSaveReceiptSchema=z.strictObject({
 profile:z.strictObject({
  displayName:z.string().trim().min(2).max(160),
  title:z.string().nullable(),
  phone:z.string().regex(/^(?:[0-9]{10})?$/),
  changed:z.boolean(),
  userUpdatedAt:z.iso.datetime(),
  profileUpdatedAt:z.iso.datetime(),
 }),
});
