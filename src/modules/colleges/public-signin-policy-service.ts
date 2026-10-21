import "server-only";
import {eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeSigninPolicies} from "@/db/schema/college-signin";
import {collegeSignInMethodSchema,legacyCollegeSignInMethodSchema,normalizeCollegeSignInMethod,signInCapabilities,signInChannelOrder} from "./signin-methods-model";

/** Tenant identity comes exclusively from the verified host. The legacy
 * CollegeBranding.loginMethods field is mapped independently into this
 * college_signin_policies projection; branding assets and contacts must not
 * be accepted from a public login payload. */
async function readStoredCollegeSignInMethod(collegeId:string|null){
 const fallback="EMAIL_AND_PHONE" as const;
 if(!collegeId)return {method:fallback,requiresAdminReview:false,source:"DEFAULT" as const};
 const db=getDb();
 const result=await db.execute(sql<{present:boolean}>`select to_regclass('public.college_signin_policies') is not null as present`);
 if(!result.rows[0]?.present)return {method:fallback,requiresAdminReview:false,source:"DEFAULT" as const};
 const [row]=await db.select({method:collegeSigninPolicies.method}).from(collegeSigninPolicies)
  .where(eq(collegeSigninPolicies.collegeId,collegeId)).limit(1);
 if(!row)return {method:fallback,requiresAdminReview:false,source:"DEFAULT" as const};
 const current=collegeSignInMethodSchema.safeParse(row.method);
 if(current.success)return {method:current.data,requiresAdminReview:false,source:"PERSISTED" as const};
 // Legacy values used EMAIL_PHONE and PHONE_EMAIL. Preserve their ordering;
 // never persist a guessed translation into an active tenant policy.
 const legacy=legacyCollegeSignInMethodSchema.safeParse(row.method);
 if(legacy.success)return {method:normalizeCollegeSignInMethod(legacy.data),requiresAdminReview:false,source:"LEGACY" as const};
 // Keep the legacy public fallback for unknown imported values, but surface
 // the repair condition to admin readers without disclosing the raw value.
 return {method:fallback,requiresAdminReview:true,source:"INVALID_LEGACY_VALUE" as const};
}
export async function effectiveCollegeSignInMethod(collegeId:string|null){
 return (await readStoredCollegeSignInMethod(collegeId)).method;
}
export async function effectiveCollegeSignInCapabilities(collegeId:string|null){
 return signInCapabilities(await effectiveCollegeSignInMethod(collegeId));
}

/** Public compatibility projection for legacy loginMethods consumers. The
 * tenant host must already be verified by the caller; no college ID is accepted
 * from a login payload. Disabled channels stay disabled for OTP initiation. */
export async function effectivePublicCollegeSignInPolicy(collegeId:string|null){
 const {method,requiresAdminReview,source}=await readStoredCollegeSignInMethod(collegeId);
 const capabilities=signInCapabilities(method);
 // Explicit public allowlist: do not return tokens, tenant identifiers,
 // stored raw method strings, or any mutable sign-in/branding settings.
 return {
  method,
  legacyLoginMethods:method==="EMAIL_AND_PHONE"?"EMAIL_PHONE":
   method==="PHONE_AND_EMAIL"?"PHONE_EMAIL":method,
  channelOrder:signInChannelOrder(method),
  emailEnabled:capabilities.email,
  phoneEnabled:capabilities.phone,
  primaryChannel:capabilities.primary,
  requiresAdminReview,
  policySource:source,
  adminRepairPath:requiresAdminReview?"/admin/colleges/signin":null,
 } as const;
}
