import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementCompanies,placementCompanyRelationships} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {placementCompanyDomainSchema} from "./validation";
import {requirePlacementManageScope} from "./scope";

export const addCompanyDomainSchema=z.strictObject({
 companyId:z.string().uuid(),domain:placementCompanyDomainSchema,
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
  if(company.domain){
   if(company.domain===input.domain)return {domain:company.domain,unchanged:true as const};
   throw new CompanyDomainError("ALREADY_SET");
  }
  // Global uniqueness is enforced by placement_companies_domain_uq.
  const [updated]=await tx.update(placementCompanies).set({
   primaryDomain:input.domain,updatedAt:new Date(),
  }).where(and(eq(placementCompanies.id,company.id),isNull(placementCompanies.primaryDomain)))
    .returning({domain:placementCompanies.primaryDomain});
  if(!updated)throw new CompanyDomainError("ALREADY_SET");
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:member.id,
   module:"PLACEMENTS",eventType:"PLACEMENTS_COMPANY_DOMAIN_ADDED",
   subjectType:"placement_company",subjectId:company.id,
   summary:"Company email domain added",metadata:{companyId:company.id,domain:updated.domain},
  });
  return {domain:updated.domain,unchanged:false as const};
 }).catch(error=>{
   const e=error as {code?:string;constraint?:string};
   if(e.code==="23505"&&e.constraint==="placement_companies_domain_uq")
     throw new CompanyDomainError("DOMAIN_IN_USE");
   throw error;
 });
}
