import {z} from "zod";
import {hrRecruiterNameFieldsSchema} from "./hr-recruiter-name-fields-model";
export const recruiterProfileDetailsPatchSchema=z.strictObject({
 firstName:z.string().trim().min(1).max(100),
 lastName:z.string().trim().max(100),
 title:z.string().trim().max(160),
 phone:z.string().trim().max(14),
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
