import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";

/** T-S1-03: six digits, ten minutes, five failures, no reusable code. */
export const recruiterInviteOtpSchema=z.string().regex(/^[0-9]{6}$/);
export const RECRUITER_OTP_TTL_MS=10*60_000;
export const RECRUITER_OTP_MAX_FAILURES=5;
export const RECRUITER_OTP_PER_LINK_HOUR=5;
/** Monitoring threshold only; unlike the five-per-link limit, old LMS did
 * not block one invite because unrelated recruiters used this college's SMSs. */
export const RECRUITER_OTP_PER_COLLEGE_HOUR=300;

export function recruiterOtpSendAllowed(
  issuedForLinkLastHour:number, issuedForCollegeLastHour:number,
): boolean {
 return Number.isSafeInteger(issuedForLinkLastHour) &&
  Number.isSafeInteger(issuedForCollegeLastHour) &&
  issuedForLinkLastHour>=0 && issuedForCollegeLastHour>=0 &&
  issuedForLinkLastHour<RECRUITER_OTP_PER_LINK_HOUR;
}
export function createRecruiterInviteOtp():string {
 return randomInt(0,1_000_000).toString().padStart(6,"0");
}
export function recruiterOtpDigest(
  tokenHash:string, code:string, secret:string,
):string {
 if(!/^[a-f0-9]{64}$/.test(tokenHash) ||
    !recruiterInviteOtpSchema.safeParse(code).success ||
    Buffer.byteLength(secret,"utf8")<32) throw new Error("INVALID_INVITE_OTP_INPUT");
 return createHmac("sha256",secret).update(tokenHash+":"+code,"utf8").digest("hex");
}
export function recruiterOtpMatches(
  actualDigest:string, tokenHash:string, code:string, secret:string,
):boolean {
 if(!/^[a-f0-9]{64}$/.test(actualDigest) ||
    !recruiterInviteOtpSchema.safeParse(code).success) return false;
 const candidate=recruiterOtpDigest(tokenHash,code,secret);
 return timingSafeEqual(Buffer.from(candidate,"hex"),Buffer.from(actualDigest,"hex"));
}
export function recruiterOtpUsable(
 challenge:{expiresAt:Date;failedAttempts:number;consumedAt:Date|null;
   deliveryState:string}, now:Date,
):boolean {
 return challenge.deliveryState==="SENT" &&
  challenge.consumedAt===null &&
  Number.isFinite(now.getTime()) &&
  Number.isFinite(challenge.expiresAt.getTime()) &&
  now.getTime()<challenge.expiresAt.getTime() &&
  Number.isInteger(challenge.failedAttempts) &&
  challenge.failedAttempts>=0 &&
  challenge.failedAttempts<RECRUITER_OTP_MAX_FAILURES;
}

/** Never throw inside a transaction after incrementing failedAttempts:
 * a throw would rollback the lockout counter. Return DENY and commit. */
export function recruiterOtpAttemptDecision(
 challenge:{expiresAt:Date;failedAttempts:number;consumedAt:Date|null;
  deliveryState:string}, now:Date, digestMatches:boolean,
):"ACCEPT"|"REJECT"|"LOCKED" {
 if(!recruiterOtpUsable(challenge,now))return "LOCKED";
 return digestMatches?"ACCEPT":"REJECT";
}
