import "server-only";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {getSuperAdminTenantLifecycleDetail} from "@/modules/colleges/admin-tenant-lifecycle-service";
export async function requireSuperAdminVerificationCollege(context:RequestContext,rawId:unknown){
 const collegeId=z.uuid().parse(rawId);
 if(context.user.platformStatus!=="ACTIVE"||context.adminScope?.collegeId!==collegeId)
  throw new AuthorizationError("profile-verification.review");
 const college=await getSuperAdminTenantLifecycleDetail(context,collegeId);
 requirePermission(context,"profile-verification.review",{organizationId:college.organizationId,collegeId:college.id});
 if(college.status!=="ACTIVE"||college.organizationStatus!=="ACTIVE")
  throw new AuthorizationError("profile-verification.review");
 return {collegeId:college.id,organizationId:college.organizationId};
}
