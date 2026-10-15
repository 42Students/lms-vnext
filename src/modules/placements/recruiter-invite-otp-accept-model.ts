import { z } from "zod";
import { recruiterInviteOtpSchema } from "./recruiter-invite-otp-policy";
/** Public body never accepts a user ID or claimed email. */
export const recruiterInviteAcceptanceBodySchema=z.object({
 code:recruiterInviteOtpSchema,
}).strict();

/** No public accept endpoint until storage, delivery and grant policy are live. */
export function recruiterInviteAcceptReady(flags:{
 db09:string|undefined;otp:string|undefined;grantExpiry:string|undefined;
 delivery:string|undefined;
}):boolean {
 return flags.db09==="DB09_VERIFIED" &&
  flags.otp==="VERIFIED" && flags.grantExpiry==="VERIFIED" &&
  flags.delivery==="VERIFIED";
}
