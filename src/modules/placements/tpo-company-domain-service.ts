import "server-only";
import {and,eq,ilike,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementCompanies,placementCompanyDomains,placementCompanyRelationships,tenantDomains} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {placementCompanyDomainSchema} from "./validation";
import {requirePlacementManageScope} from "./scope";
import {companyDomainSchema} from "./company-curation-domain-model";

export const addCompanyDomainSchema=z.strictObject({
 // Keep the original bare-host-only TPO input contract, then run the
 // same registrable-domain, academic and disposable-host validation as the
 // platform's canonical company-domain editor.
 companyId:z.string().uuid(),domain:placementCompanyDomainSchema.pipe(companyDomainSchema),
});
export class CompanyDomainError extends Error{
 constructor(readonly code:"COMPANY_NOT_FOUND"|"ALREADY_SET"|"DOMAIN_IN_USE"){super(code);}
}
export async function addTpoCompanyDomain(context:RequestContext,raw:unknown){
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||member.status!=="ACTIVE"||
   context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 if(!can(context,"placements.manage",{collegeId:college.id}))throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId:college.id});
 const input=addCompanyDomainSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [company]=await tx.select({
   id:placementCompanies.id,domain:placementCompanies.primaryDomain,
  }).from(placementCompanies)
   .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.companyId,placementCompanies.id),
    eq(placementCompanyRelationships.collegeId,college.id),
    eq(placementCompanyRelationships.status,"ACTIVE")))
   .where(and(eq(placementCompanies.id,input.companyId),
     eq(placementCompanies.status,"ACTIVE"))).for("update").limit(1);
  if(!company)throw new CompanyDomainError("COMPANY_NOT_FOUND");
  // College domains cannot become company recruiter domains, even when their
  // hostname happens to pass the basic DNS shape check.
  const [institution]=await tx.select({host:tenantDomains.host}).from(tenantDomains)
   .where(ilike(tenantDomains.host,input.domain)).limit(1);
  if(institution)throw new CompanyDomainError("DOMAIN_IN_USE");
  if(company.domain&&company.domain.toLowerCase()!==input.domain)
   throw new CompanyDomainError("ALREADY_SET");
  // Both the old primary column and the canonical child registry have global
  // uniqueness constraints. A domain on another company's legacy primary row
  // is a conflict even when that old company lacks an imported child record.
  const [otherPrimary]=await tx.select({id:placementCompanies.id})
   .from(placementCompanies).where(and(
    ilike(placementCompanies.primaryDomain,input.domain),
    eq(placementCompanies.status,"ACTIVE"))).limit(1);
  if(otherPrimary&&otherPrimary.id!==company.id)
   throw new CompanyDomainError("DOMAIN_IN_USE");
  const [registered]=await tx.select({id:placementCompanyDomains.id,
    ownerId:placementCompanyDomains.companyId})
   .from(placementCompanyDomains)
   .where(ilike(placementCompanyDomains.domain,input.domain)).limit(1);
  if(registered&&registered.ownerId!==company.id)
   throw new CompanyDomainError("DOMAIN_IN_USE");
  if(registered&&company.domain===input.domain)
   return {domain:input.domain,unchanged:true as const};
  // A TPO may register a company host but cannot attest ownership; verification
  // remains false until a separate authorized verification workflow completes.
  if(!registered){
   const [saved]=await tx.insert(placementCompanyDomains).values({
    companyId:company.id,domain:input.domain,addedByCollegeId:college.id,
    addedByUserType:"TPO",addedByUserId:context.user.id,verifiedBy42:false,
   }).onConflictDoNothing().returning({id:placementCompanyDomains.id});
   if(!saved)throw new CompanyDomainError("DOMAIN_IN_USE");
  }
  if(!company.domain){
   const [updated]=await tx.update(placementCompanies).set({
    primaryDomain:input.domain,updatedAt:new Date(),
   }).where(and(eq(placementCompanies.id,company.id),
    isNull(placementCompanies.primaryDomain)))
     .returning({domain:placementCompanies.primaryDomain});
   if(!updated)throw new CompanyDomainError("ALREADY_SET");
  }
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COMPANY_DOMAIN_ADDED",
   subjectType:"placement_company",subjectId:company.id,
   summary:"Company email domain added",metadata:{
    companyId:company.id,domain:input.domain,verifiedBy42:false,
    source:"TPO",addedByCollegeId:college.id,
  },
  });
  return {domain:input.domain,unchanged:false as const};
 }).catch(error=>{
   const e=error as {code?:string;constraint?:string};
   if(e.code==="23505"&&[
     "placement_companies_domain_uq","placement_company_domains_lower_domain_uq",
   ].includes(e.constraint??""))
     throw new CompanyDomainError("DOMAIN_IN_USE");
   throw error;
 });
}
