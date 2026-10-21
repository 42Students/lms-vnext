import { z } from "zod";
import { recruiterInviteOtpSchema } from "./recruiter-invite-otp-policy";
/** Public body never accepts a user ID or claimed email. */
export const recruiterInviteAcceptanceBodySchema=z.object({
 code:recruiterInviteOtpSchema,
 name:z.string().trim().min(1).max(150).optional(),
 designation:z.string().trim().max(150).optional(),
 mobile:z.string().trim().max(30)
   .regex(/^\+?[0-9() .-]*$/,"Enter a valid 10-digit mobile number, or leave it blank.")
   .refine(value=>{
      const digits=value.replace(/\D/g,"");
      return !digits || digits.length===10 || (digits.length===12&&digits.startsWith("91"));
   },"Enter a valid 10-digit mobile number, or leave it blank.").optional(),
}).strict();

/**
 * Explicit adapter for importing an older invite acceptance payload after the
 * OTP recipient email has been established by the server. Never call this with
 * a caller-asserted "trusted" address, and never accept email in the public
 * recruiterInviteAcceptanceBodySchema (the invite identity is authoritative).
 */
const legacyRecruiterInviteAcceptanceSchema = z.object({
 code: recruiterInviteOtpSchema,
 firstName: z.string().trim().max(100).optional(),
 lastName: z.string().trim().max(100).optional(),
 designation: z.string().trim().max(150).optional(),
 phone: z.string().trim().max(30).optional(),
 email: z.email().optional(),
}).strict();

export function migrateLegacyRecruiterInviteAcceptance(
 raw:unknown,
 verifiedOtpRecipientEmail:string | null,
):z.infer<typeof recruiterInviteAcceptanceBodySchema> | null {
 const parsed = legacyRecruiterInviteAcceptanceSchema.safeParse(raw);
 if (!parsed.success) return null;
 const input = parsed.data;
 const claimedEmail = input.email?.trim().toLowerCase();
 // Legacy email was an OTP delivery fallback, never an identity override.
 if (claimedEmail && (!verifiedOtpRecipientEmail ||
     claimedEmail!==verifiedOtpRecipientEmail.trim().toLowerCase())) return null;
 const name = [input.firstName,input.lastName].filter(Boolean).join(" ").trim();
 const migrated = recruiterInviteAcceptanceBodySchema.safeParse({
  code:input.code,
  ...(name ? {name} : {}),
  ...(input.designation !== undefined ? {designation:input.designation} : {}),
  ...(input.phone !== undefined ? {mobile:input.phone} : {}),
 });
 return migrated.success ? migrated.data : null;
}

/** No public accept endpoint until storage, delivery and grant policy are live. */
export function recruiterInviteAcceptReady(flags:{
 db09:string|undefined;otp:string|undefined;
 delivery:string|undefined;
}):boolean {
 return flags.db09==="DB09_VERIFIED" &&
  flags.otp==="VERIFIED" &&
  flags.delivery==="VERIFIED";
}
