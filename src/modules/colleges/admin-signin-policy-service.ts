import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,activityEvents} from "@/db/schema";
import {updateCollegeSignInSchema} from "./signin-methods-model";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import type {RequestContext} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {isSuperAdmin} from "@/modules/identity/context";
import {getSuperAdminTenantLifecycleDetail} from "@/modules/colleges/admin-tenant-lifecycle-service";
import {collegeSignInPoliciesStaged} from "./staged-schema";
import {signInPolicyReadState} from "./signin-policy-read-model";
/** Stored sign-in policy. The login start and email-fallback paths enforce this on a college host. */
export async function readAdminCollegeSignInPolicy(context:RequestContext,collegeId:unknown){
 const college=await getSuperAdminTenantLifecycleDetail(context,collegeId);
 requirePermission(context,"college.read",{organizationId:college.organizationId,collegeId:college.id});
 // Even a read-only college policy can be accessed through a stale Super
 // Admin request snapshot after the user's account/system role was disabled.
 // Rebuild authority under locks held for the entire scoped policy read.
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"college.read",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const present=await tx.execute(sql<{found:boolean}>`SELECT to_regclass('public.college_signin_policies') IS NOT NULL AS found`);
  if(present.rows[0]?.found!==true)return {college,policy:signInPolicyReadState(false,null)};
  const [row]=await tx.select({
   method:collegeSignInPoliciesStaged.method,
   version:collegeSignInPoliciesStaged.version,
   updatedAt:collegeSignInPoliciesStaged.updatedAt,
  }).from(collegeSignInPoliciesStaged).where(eq(collegeSignInPoliciesStaged.collegeId,college.id)).limit(1);
  return {college,policy:signInPolicyReadState(true,row?.method??null),version:row?.version??null,updatedAt:row?.updatedAt??null};
 });
}

export class CollegeSignInPolicyError extends Error {
 constructor(readonly code:"SIGNIN_STORAGE_PENDING"|"SIGNIN_POLICY_STALE"|"COLLEGE_UNAVAILABLE"){
  super(code);this.name="CollegeSignInPolicyError";
 }
}
/** Save only a policy for the specified active college; CAS prevents racing
 * administrators from silently clobbering each other's changes. */
export async function saveAdminCollegeSignInPolicy(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("college.manage");
 const input=updateCollegeSignInSchema.parse(raw);
 const college=await getSuperAdminTenantLifecycleDetail(context,input.collegeId);
 requirePermission(context,"college.manage",{organizationId:college.organizationId,collegeId:college.id});
 const db=getDb();
 const [ready]= (await db.execute(sql<{ready:boolean}>`select to_regclass('public.college_signin_policies') is not null as ready`)).rows;
 if(!ready?.ready)throw new CollegeSignInPolicyError("SIGNIN_STORAGE_PENDING");
 return db.transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"college.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [active]=await tx.select({id:colleges.id}).from(colleges)
   .where(and(eq(colleges.id,college.id),eq(colleges.status,"ACTIVE"))).for("update").limit(1);
  if(!active)throw new CollegeSignInPolicyError("COLLEGE_UNAVAILABLE");
  const [current]=await tx.select({version:collegeSignInPoliciesStaged.version,
   method:collegeSignInPoliciesStaged.method}).from(collegeSignInPoliciesStaged)
   .where(eq(collegeSignInPoliciesStaged.collegeId,college.id)).for("update").limit(1);
  // A retry after a successful response was lost must not increment the
  // version or write another audit event. The policy row is locked first;
  // any genuinely different desired method still enforces the CAS token.
  if(current?.method===input.method)
   return {method:current.method,version:current.version};
  if((current?.version??0)!==input.expectedVersion)throw new CollegeSignInPolicyError("SIGNIN_POLICY_STALE");
  const now=new Date();
  const [saved]=current
   ?await tx.update(collegeSignInPoliciesStaged).set({method:input.method,version:current.version+1,updatedAt:now})
     .where(eq(collegeSignInPoliciesStaged.collegeId,college.id)).returning()
   :await tx.insert(collegeSignInPoliciesStaged).values({collegeId:college.id,method:input.method,version:1,updatedAt:now}).returning();
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,actorUserId:context.user.id,
   module:"IDENTITY",eventType:"identity.college_signin.updated",importance:"HIGH",
   subjectType:"college_signin_policies",subjectId:college.id,
   summary:"Super Admin changed college sign-in methods",
   metadata:{from:current?.method??"EMAIL_AND_PHONE",to:input.method,version:saved.version},
  });
  return {method:saved.method,version:saved.version};
 });
}

/** Legacy college_branding.login_methods (from prod-2026) is not the
 * current policy writer source. Use this one-way mapping ONLY in a reviewed
 * backfill of colleges with no existing policy row; never overwrite later
 * versioned/admin-authored policy changes. */
export function translateLegacyBrandingLoginMethods(raw:string|null|undefined):
 "EMAIL_AND_PHONE"|"PHONE_AND_EMAIL"|"EMAIL_ONLY"|"PHONE_ONLY"|null {
 switch(raw?.trim().toUpperCase()){
  case "EMAIL_PHONE":return "EMAIL_AND_PHONE";
  case "PHONE_EMAIL":return "PHONE_AND_EMAIL";
  case "EMAIL_ONLY":return "EMAIL_ONLY";
  case "PHONE_ONLY":return "PHONE_ONLY";
  default:return null;
 }
}

/** Read-only alias for legacy branding consumers; dedicated scoped policy remains authoritative. */
export async function readLegacyCollegeBrandingSignInMethods(context:RequestContext,collegeId:unknown){
 const result=await readAdminCollegeSignInPolicy(context,collegeId);
 const method=result.policy.method??"EMAIL_AND_PHONE";
 const loginMethods=method==="PHONE_AND_EMAIL"?"PHONE_EMAIL":
   method==="EMAIL_ONLY"?"EMAIL_ONLY":method==="PHONE_ONLY"?"PHONE_ONLY":"EMAIL_PHONE";
 return {collegeId:result.college.id,loginMethods,policy:result.policy};
}
