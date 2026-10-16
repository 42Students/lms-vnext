import { z } from "zod";
import { recruiterInviteOtpSchema } from "./recruiter-invite-otp-policy";
/** Public body never accepts a user ID or claimed email. */
export const recruiterInviteAcceptanceBodySchema=z.object({
 code:recruiterInviteOtpSchema,
 name:z.string().trim().min(1).max(150).optional(),
 designation:z.string().trim().max(100).optional(),
 mobile:z.string().trim().max(30)
   .regex(/^\+?[0-9() .-]*$/,"Enter a valid 10-digit mobile number, or leave it blank.")
   .refine(value=>{
      const digits=value.replace(/\D/g,"");
      return !digits || digits.length===10 || (digits.length===12&&digits.startsWith("91"));
   },"Enter a valid 10-digit mobile number, or leave it blank.").optional(),
}).strict();

/** No public accept endpoint until storage, delivery and grant policy are live. */
export function recruiterInviteAcceptReady(flags:{
 db09:string|undefined;otp:string|undefined;
 delivery:string|undefined;
}):boolean {
 return flags.db09==="DB09_VERIFIED" &&
  flags.otp==="VERIFIED" &&
  flags.delivery==="VERIFIED";
}
