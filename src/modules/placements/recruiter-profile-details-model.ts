import {z} from "zod";
import {hrRecruiterNameFieldsSchema} from "./hr-recruiter-name-fields-model";

/** Source-equivalent OnboardingMobileNumber.normalize. Supports local,
 * +91, leading-zero and formatted Indian phone input, persists 10 digits.
 * An arbitrary 12-digit number must never be silently truncated. */
export function normalizeLegacyRecruiterMobile(raw:string):string|null{
 const text=raw.trim();
 if(!text)return "";
 if(text.length>32||!/^[+0-9() .-]+$/.test(text)||
   (text.includes("+")&&(!text.startsWith("+")||text.indexOf("+",1)!==-1)))return null;
 let digits=text.replace(/\D/g,"");
 if(digits.length===12&&digits.startsWith("91"))digits=digits.slice(2);
 else if(digits.length===11&&digits.startsWith("0"))digits=digits.slice(1);
 return /^[0-9]{10}$/.test(digits)?digits:null;
}
export const recruiterProfileDetailsPatchSchema=z.strictObject({
 firstName:z.string().trim().min(1,"FIRST_NAME_REQUIRED").max(100),
 lastName:z.string().trim().max(100),
 title:z.string().trim().max(150),
 phone:z.string().trim().max(32),
 expectedUserUpdatedAt:z.iso.datetime(),
 expectedProfileUpdatedAt:z.iso.datetime(),
}).superRefine((input,ctx)=>{
 const valid=hrRecruiterNameFieldsSchema.safeParse({
  firstName:input.firstName,lastName:input.lastName,
 });
 if(!valid.success)ctx.addIssue({code:"custom",path:["firstName"],message:"Enter a valid first and last name."});
 if(normalizeLegacyRecruiterMobile(input.phone)===null)
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
  firstName:z.string().trim().min(1).max(120).optional(),
  lastName:z.string().max(120).optional(),
  title:z.string().nullable(),
  phone:z.string().regex(/^(?:[0-9]{10})?$/),
  changed:z.boolean(),
  userUpdatedAt:z.iso.datetime(),
  profileUpdatedAt:z.iso.datetime(),
 }),
});

/** First-party field feedback used by the recruiter profile editor. */
export function recruiterProfileFieldErrors(raw: {
  firstName: string; lastName: string; title: string; phone: string;
}, backendCode?: string) {
  const issues: Partial<Record<"firstName" | "lastName" | "title" | "phone", string>> = {};
  const firstName = raw.firstName.trim();
  if (!firstName) issues.firstName = "First name is required";
  if (raw.title.trim().length>150)issues.title="Title must not exceed 150 characters.";
  if (normalizeLegacyRecruiterMobile(raw.phone)===null)
    issues.phone = "Enter a valid 10-digit mobile number, or leave it blank";
  if (backendCode === "INVALID_MOBILE") issues.phone = "Enter a valid 10-digit mobile number, or leave it blank";
  if (backendCode === "FIRST_NAME_REQUIRED") issues.firstName = "First name is required";
  return issues;
}
/** Suspension reason is support-only metadata; never include it in a public error. */
export function recruiterAccessEndedFeedback(input: {
  authorizedSupport: boolean; suspensionReason: string | null;
}) {
  return input.authorizedSupport && input.suspensionReason?.trim()
    ? "Recruiter access suspended: " + input.suspensionReason.trim()
    : "Your recruiter access has ended. Ask the placement cell to restore it.";
}

export function recruiterGrantAccessLabel(input:{
 accountStatus:"ACTIVE"|"DISABLED";profileStatus:string;
 grantStatus:string;grantExpiresAt:Date|null;now?:Date;
}){
 if(input.accountStatus!=="ACTIVE"||input.profileStatus!=="ACTIVE")
   return "Recruiter account suspended";
 if(input.grantStatus!=="ACTIVE")return "Recruiter college access ended";
 if(!input.grantExpiresAt||input.grantExpiresAt.getTime()<=(input.now??new Date()).getTime())
   return "Recruiter college grant expired";
 return "Recruiter access active";
}
