import "server-only";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {CollegeServiceError} from "@/modules/colleges/service";
import {getSuperAdminTenantLifecycleDetail} from "@/modules/colleges/admin-tenant-lifecycle-service";
/** Distinct retryable access-read failure; never leak exception or tenant data. */
export class VerificationAccessCheckError extends Error {
 readonly code="VERIFICATION_ACCESS_UNAVAILABLE";
 constructor() {
  super("Could not check your verification access");
  this.name="VerificationAccessCheckError";
 }
}
export async function requireSuperAdminVerificationCollege(context:RequestContext,rawId:unknown){
 const collegeId=z.uuid().parse(rawId);
 if(context.user.platformStatus!=="ACTIVE"||context.adminScope?.collegeId!==collegeId)
  throw new AuthorizationError("profile-verification.review");
 let college:Awaited<ReturnType<typeof getSuperAdminTenantLifecycleDetail>>;
 try {
  college=await getSuperAdminTenantLifecycleDetail(context,collegeId);
 } catch(error) {
  if(error instanceof AuthorizationError || error instanceof CollegeServiceError)throw error;
  throw new VerificationAccessCheckError();
 }
 requirePermission(context,"profile-verification.review",{organizationId:college.organizationId,collegeId:college.id});
 if(college.status!=="ACTIVE"||college.organizationStatus!=="ACTIVE")
  throw new AuthorizationError("profile-verification.review");
 return {collegeId:college.id,organizationId:college.organizationId};
}
