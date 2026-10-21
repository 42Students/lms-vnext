import "server-only";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyDomains} from "@/db/schema";
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
  const domains=await tx.select({
    id:placementCompanyDomains.id,
    domain:placementCompanyDomains.domain,
    verifiedBy42:placementCompanyDomains.verifiedBy42,
    verifiedAt:placementCompanyDomains.verifiedAt,
  }).from(placementCompanyDomains)
    .where(eq(placementCompanyDomains.companyId,company.id)).for("update");
  const primary=company.primaryDomain?
    domains.find(row=>row.domain.toLowerCase()===company.primaryDomain?.toLowerCase()):null;
  // The global Verify action expressly attests the registered primary domain.
  // Never imply that additional, unreviewed domains were also verified.
  if(input.verified&&!primary)
    throw new Error("Register a primary company domain before verification.");
  const companyChanged=Boolean(company.verifiedAt)!==input.verified;
  const domainChanged=input.verified?
    !primary?.verifiedBy42||!primary?.verifiedAt:
    domains.some(row=>row.verifiedBy42||row.verifiedAt!==null);
  if(!companyChanged&&!domainChanged)
    return {companyId:company.id,verified:input.verified,changed:false};
  const now=new Date();
  if(companyChanged){
    const [saved]=await tx.update(placementCompanies).set({
      verifiedAt:input.verified?now:null,
      verifiedByUserId:input.verified?context.user.id:null,
      updatedAt:now,
    }).where(eq(placementCompanies.id,company.id)).returning({id:placementCompanies.id});
    if(!saved)throw new Error("Company changed. Refresh and retry.");
  }
  if(input.verified&&primary){
    await tx.update(placementCompanyDomains).set({
      verifiedBy42:true,verifiedAt:now,verifiedByUserId:context.user.id,
    }).where(eq(placementCompanyDomains.id,primary.id));
  }else if(!input.verified){
    await tx.update(placementCompanyDomains).set({
      verifiedBy42:false,verifiedAt:null,verifiedByUserId:null,
    }).where(eq(placementCompanyDomains.companyId,company.id));
  }
  await recordActivityEventInTransaction(tx,context,{
   eventType:input.verified?ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_VERIFIED:
    ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_UNVERIFIED,
   collegeId:null,organizationId:null,
   subjectType:"placement_company",subjectId:company.id,subjectLabel:company.name,
   summary:input.verified?"Company verified by 42":"Company global verification removed",
   metadata:{previousVerified:Boolean(company.verifiedAt),verified:input.verified,
    primaryDomain:company.primaryDomain,
    verifiedPrimaryDomain:input.verified?primary?.domain??null:null,
    domainProofAttestedByAction:input.verified,
    subsidiaryDomainsRemainUnverified:input.verified},
  });
  return {companyId:company.id,verified:input.verified,changed:true};
 });
}
