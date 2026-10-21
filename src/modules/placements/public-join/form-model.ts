import { z } from "zod";
import { publicCollegeJoinCodeSchema, publicCollegeJoinTokenSchema,
  publicRecruiterWorkEmailSchema } from "../public-college-join-model";

export const publicJoinMobileSchema=z.string().trim().max(14).refine(value=>{
 if(!value)return true;
 if(!/^\+?[0-9() .-]+$/.test(value))return false;
 const digits=value.replace(/\D/g,"");
 return digits.length===10||(digits.length===12&&digits.startsWith("91"));
},"Enter a valid 10-digit mobile number, or leave it blank.")
 .transform(value=>value.replace(/\D/g,"").slice(-10));

export const publicJoinFormSchema = z.strictObject({
  email: publicRecruiterWorkEmailSchema,
  name: z.string().trim().min(1).max(150),
  designation: z.string().trim().max(150),
  phone: publicJoinMobileSchema,
  companyName: z.string().trim().max(200),
});

/** Shared public join inputs, no caller-supplied college or company IDs. */
export const publicJoinAcceptSchema = publicJoinFormSchema.extend({
  token: publicCollegeJoinTokenSchema,
  code: publicCollegeJoinCodeSchema,
}).strict();
