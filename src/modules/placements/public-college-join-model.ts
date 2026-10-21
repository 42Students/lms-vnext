import { z } from "zod";
import {publicWorkEmailIssue} from "./public-work-email-policy";

/** Syntax validation only. Never use raw tokens as database IDs or log values. */
export const publicCollegeJoinTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32,256}$/);
export const publicRecruiterWorkEmailSchema = z.string().trim().toLowerCase().email().max(254)
  .refine((email) => publicWorkEmailIssue(email)===null, "Enter a company work email address.");
export const publicCollegeJoinCodeSchema = z.string().regex(/^[0-9]{6}$/);

/** Legacy company-domain form accepts URL, @host, full email or bare host;
 * the work-email OTP input remains strict and is not broadened to a domain.
 * WHATWG hostname parsing canonicalizes IDNs/trailing dots without any DNS
 * lookup. Empty/invalid input returns NO_MAIL rather than throwing.
 */
export function canonicalCompanyMailDomain(raw:unknown):string|null {
 if(typeof raw!=="string")return null;
 let value=raw.trim();
 if(!value)return null;
 if(value.startsWith("@"))value=value.slice(1);
 else if(value.includes("@")&&!value.includes("://"))value=value.split("@").at(-1)??"";
 if(!/^[a-z][a-z\d+.-]*:\/\//i.test(value))value="https://"+value;
 try{
  const url=new URL(value);
  const host=url.hostname.toLowerCase().replace(/\.+$/,"");
  if(!host||!host.includes(".")||host.length>253||
   url.username||url.password||/[^a-z\d.-]/.test(host))return null;
  return host;
 }catch{return null;}
}
export type CollegeJoinViewState = "INVALID_LINK" | "UNAVAILABLE" | "READY" | "ALREADY_JOINED";
export function collegeJoinViewState(input: {
  validToken: boolean;
  invitationAvailable: boolean;
  alreadyJoined: boolean;
}): CollegeJoinViewState {
  if (!input.validToken) return "INVALID_LINK";
  if (!input.invitationAvailable) return "UNAVAILABLE";
  return input.alreadyJoined ? "ALREADY_JOINED" : "READY";
}

/** Domain identifies an email domain, not a verified legal company. */
export function workEmailDomain(email: string): string | null {
  const result = publicRecruiterWorkEmailSchema.safeParse(email);
  return result.success ? canonicalCompanyMailDomain(result.data.split("@")[1]) : null;
}
