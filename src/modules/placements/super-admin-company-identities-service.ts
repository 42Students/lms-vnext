import "server-only";
import {and,eq,ilike,ne} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyDomains,placementCompanyAliases,tenantDomains}
 from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {companyDomainCommandSchema,companyAliasCommandSchema,
 normalizeCompanyDomain,normalizeCompanyAlias} from "./super-admin-company-identities-model";
import {canonicalCompanyAlias} from "./company-curation-alias-model";

function requireGlobal(context:RequestContext){
 // Domain/alias registry mutations target a platform company identity, not
 // the acting college. A selected college must not silently narrow a global
 // catalogue operation, nor prevent a verified Super Admin from doing it.
 if(!isSuperAdmin(context))throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
}
export async function changeSuperAdminCompanyDomain(context:RequestContext,raw:unknown){
 requireGlobal(context);
 const cmd=companyDomainCommandSchema.parse(raw),domain=normalizeCompanyDomain(cmd.domain);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  const [company]=await tx.select().from(placementCompanies)
    .where(eq(placementCompanies.id,cmd.companyId)).for("update").limit(1);
  if(!company||company.status!=="ACTIVE")throw new Error("Company is unavailable.");
  const [collegeDomain]=await tx.select({id:tenantDomains.id}).from(tenantDomains)
    .where(ilike(tenantDomains.host,domain)).limit(1);
  if(collegeDomain||[".ac.in",".edu.in",".res.in",".edu",".ac.uk",
    ".edu.au",".ac.nz",".edu.sg",".ac.jp",".edu.cn"].some(suffix=>("."+domain).endsWith(suffix)))
   throw new Error("College and university addresses can\'t be used for a company");
  const current=await tx.select().from(placementCompanyDomains)
    .where(eq(placementCompanyDomains.companyId,company.id)).for("update");
  const own=current.find(d=>d.domain.toLowerCase()===domain);
  if(cmd.action==="ADD"){
   // An older imported canonical domain can predate child-domain backfill.
   // Treat both registries as authoritative until migration reconciliation.
   const [primaryOwner]=await tx.select({id:placementCompanies.id,name:placementCompanies.name})
    .from(placementCompanies).where(and(
     ilike(placementCompanies.primaryDomain,domain),
     ne(placementCompanies.id,company.id))).limit(1);
   if(primaryOwner)
    throw new Error(domain+" already belongs to another company. Merge them instead.");
   const [taken]=await tx.select({companyId:placementCompanyDomains.companyId,
      companyName:placementCompanies.name})
     .from(placementCompanyDomains)
     .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyDomains.companyId))
     .where(ilike(placementCompanyDomains.domain,domain)).limit(1);
   if(taken&&taken.companyId!==company.id)
    throw new Error(domain+" already belongs to another company. Merge them instead.");
   if(!own){
    await tx.insert(placementCompanyDomains).values({
      companyId:company.id,domain,addedByUserId:context.user.id,
      addedByUserType:"SUPER_ADMIN",verifiedBy42:false,
    });
   }
   if(!company.primaryDomain)await tx.update(placementCompanies)
    .set({primaryDomain:domain,updatedAt:new Date()}).where(eq(placementCompanies.id,company.id));
  }else{
   if(!own)throw new Error("Domain is not registered with this company.");
   if(current.length<=1)throw new Error("A company keeps at least one domain");
   await tx.delete(placementCompanyDomains).where(eq(placementCompanyDomains.id,own.id));
   if(company.primaryDomain===domain)await tx.update(placementCompanies)
    .set({primaryDomain:current.find(d=>d.id!==own.id)!.domain,updatedAt:new Date()})
    .where(eq(placementCompanies.id,company.id));
  }
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_DOMAIN_UPDATED,
   subjectType:"placement_company",subjectId:company.id,subjectLabel:company.name,
   summary:cmd.action==="ADD"?"Company domain added":"Company domain removed",
   metadata:{domain,action:cmd.action},
  });
  return {companyId:company.id,domain,action:cmd.action};
 });
}
export async function changeSuperAdminCompanyAlias(context:RequestContext,raw:unknown){
 requireGlobal(context);
 const cmd=companyAliasCommandSchema.parse(raw),alias=normalizeCompanyAlias(cmd.alias);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  const [company]=await tx.select().from(placementCompanies)
    .where(eq(placementCompanies.id,cmd.companyId)).for("update").limit(1);
  if(!company||company.status!=="ACTIVE")throw new Error("Company is unavailable.");
  if(cmd.action==="ADD"&&canonicalCompanyAlias(company.name)===canonicalCompanyAlias(alias))
   throw new Error("This is already the company's canonical name.");
  const [otherName]=await tx.select({id:placementCompanies.id,name:placementCompanies.name}).from(placementCompanies)
   .where(and(ilike(placementCompanies.name,alias),ne(placementCompanies.id,company.id))).limit(1);
  if(cmd.action==="ADD"&&otherName)
   throw new Error("Other name already belongs to "+otherName.name+". Merge them instead.");
  const [existing]=await tx.select().from(placementCompanyAliases)
   .where(ilike(placementCompanyAliases.alias,alias)).limit(1);
  if(cmd.action==="ADD"){
   if(existing&&existing.companyId!==company.id)
    throw new Error("Other name is already registered to another company. Merge them instead.");
   if(!existing)await tx.insert(placementCompanyAliases).values({
    companyId:company.id,alias,addedByUserId:context.user.id,
   });
  }else{
   if(!existing||existing.companyId!==company.id)throw new Error("Other name is not registered here.");
   await tx.delete(placementCompanyAliases).where(eq(placementCompanyAliases.id,existing.id));
  }
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_ALIAS_UPDATED,
   subjectType:"placement_company",subjectId:company.id,subjectLabel:company.name,
   summary:cmd.action==="ADD"?"Company other name added":"Company other name removed",
   metadata:{alias,action:cmd.action},
  });
  return {companyId:company.id,alias,action:cmd.action};
 });
}
