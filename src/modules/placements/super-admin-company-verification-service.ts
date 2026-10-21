import "server-only";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {companyGlobalVerificationSchema,canVerifyGlobalCompany} from "./super-admin-company-verification-model";
export async function setSuperAdminGlobalCompanyVerification(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context)||!canVerifyGlobalCompany(context.adminScope))
  throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 const input=companyGlobalVerificationSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  const [company]=await tx.select({
   id:placementCompanies.id,name:placementCompanies.name,
   status:placementCompanies.status,verifiedAt:placementCompanies.verifiedAt,
   primaryDomain:placementCompanies.primaryDomain,
  }).from(placementCompanies).where(eq(placementCompanies.id,input.companyId)).for("update").limit(1);
  if(!company||company.status!=="ACTIVE")throw new Error("Company unavailable for verification.");
  if(Boolean(company.verifiedAt)===input.verified)
   return {companyId:company.id,verified:input.verified,changed:false};
  const [saved]=await tx.update(placementCompanies).set({
   verifiedAt:input.verified?new Date():null,
   verifiedByUserId:input.verified?context.user.id:null,
   updatedAt:new Date(),
  }).where(eq(placementCompanies.id,company.id)).returning({id:placementCompanies.id});
  if(!saved)throw new Error("Company changed. Refresh and retry.");
  await recordActivityEventInTransaction(tx,context,{
   eventType:input.verified?ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_VERIFIED:
    ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_UNVERIFIED,
   collegeId:null,organizationId:null,
   subjectType:"placement_company",subjectId:company.id,subjectLabel:company.name,
   summary:input.verified?"Company verified by 42":"Company global verification removed",
   metadata:{previousVerified:Boolean(company.verifiedAt),verified:input.verified,
    primaryDomain:company.primaryDomain,
    domainProofNotInferred:true},
  });
  return {companyId:company.id,verified:input.verified,changed:true};
 });
}
