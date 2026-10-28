import "server-only";
import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,colleges,organizations,tenantDomains} from "@/db/schema";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {managedBaseDomain,managedHost,isManagedHost,managedSubdomainRequest} from "./managed-subdomain-model";
import {TenantDomainServiceError} from "./service";
import {z} from "zod";
export class ManagedSubdomainError extends Error{
 constructor(readonly code:"MANAGED_WILDCARD_NOT_READY"|"SUBDOMAIN_STALE"|
  "SUBDOMAIN_ALREADY_ALLOTTED"|"SUBDOMAIN_MISSING"|"SUBDOMAIN_CONFLICT"){
  super(code);this.name="ManagedSubdomainError";
 }
}
function configuredDomain(){
 return managedBaseDomain(process.env["TENANT_MANAGED_BASE_DOMAIN"],
  process.env["TENANT_MANAGED_WILDCARD_READY"]==="true");
}
async function checkedCollege(ctx:RequestContext,input:string){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("admin-scope.select");
 requirePermission(ctx,"admin-scope.select");
 const id=z.uuid().parse(input);
 const [row]=await getDb().select({id:colleges.id,organizationId:colleges.organizationId,status:colleges.status})
  .from(colleges).where(eq(colleges.id,id)).limit(1);
 if(!row||row.status!=="ACTIVE")throw new TenantDomainServiceError("COLLEGE_NOT_FOUND");
 requirePermission(ctx,"college.manage",{collegeId:row.id,organizationId:row.organizationId});
 return row;
}
export async function getManagedCollegeSubdomain(ctx:RequestContext,collegeInput:string){
 const college=await checkedCollege(ctx,collegeInput);
 // A configured suffix can be displayed before wildcard deployment is ready.
 // Only the explicit operator readiness flag permits allotment or changes.
 const baseDomain=managedBaseDomain(process.env["TENANT_MANAGED_BASE_DOMAIN"],true);
 const ready=Boolean(baseDomain)&&process.env["TENANT_MANAGED_WILDCARD_READY"]==="true";
 const rows=baseDomain?await getDb().select({host:tenantDomains.host,isPrimary:tenantDomains.isPrimary})
  .from(tenantDomains).where(and(eq(tenantDomains.collegeId,college.id),isNull(tenantDomains.deletedAt))):[];
 const managed=baseDomain?rows.find(row=>isManagedHost(row.host,baseDomain)):undefined;
 const currentHost=managed?.host??null;
 const subdomain=currentHost&&baseDomain?currentHost.slice(0,-baseDomain.length-1):null;
 return {
  ready,baseDomain,currentHost,host:currentHost,subdomain,
  safetyStatus:ready?"WILDCARD_READY" as const:"WILDCARD_NOT_READY" as const,
  setupHelp:ready?null:"Configure wildcard DNS for *.<base domain> with the expected CNAME/A target; allow DNS propagation and resolver timeouts; provision and verify wildcard HTTPS/TLS and tenant routing before setting TENANT_MANAGED_WILDCARD_READY=true. Verification TXT challenges for custom domains use the separate domain-verification workflow.",
 };
}
export async function changeManagedCollegeSubdomain(ctx:RequestContext,collegeInput:string,raw:unknown){
 const college=await checkedCollege(ctx,collegeInput);
 const base=configuredDomain();
 if(!base)throw new ManagedSubdomainError("MANAGED_WILDCARD_NOT_READY");
 const input=managedSubdomainRequest.parse(raw);
 const host=input.action==="REMOVE"?null:managedHost(input.label!,base);
 return getDb().transaction(async tx=>{
  const [lockedCollege]=await tx.select({
    id:colleges.id,organizationId:colleges.organizationId,
  }).from(colleges)
   .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
   .where(and(eq(colleges.id,college.id),eq(colleges.status,"ACTIVE"),
     eq(organizations.status,"ACTIVE"))).for("update").limit(1);
  if(!lockedCollege)throw new TenantDomainServiceError("COLLEGE_NOT_FOUND");
  // The request-time context can go stale while this mutation waits.
  // Require the persisted actor to remain active and privileged inside
  // the same transaction as the DNS ownership and primary-host updates.
  await assertPersistedPlatformPermission(tx,ctx,"college.manage",{
    collegeId:lockedCollege.id,organizationId:lockedCollege.organizationId,
  });
  // Take host claim locks BEFORE locking domain rows. Custom-domain creation,
  // editing and deletion follow college-parent -> hostname -> domain order.
  // Sort the two claims so cross-college swaps cannot create an AB/BA deadlock.
  const before=await tx.select({id:tenantDomains.id,host:tenantDomains.host})
    .from(tenantDomains).where(and(eq(tenantDomains.collegeId,college.id),
      isNull(tenantDomains.deletedAt)));
  const existingManaged=before.find(row=>isManagedHost(row.host,base));
  const lockHosts=[existingManaged?.host,host]
    .filter((value):value is string=>Boolean(value)).sort();
  for(const claim of new Set(lockHosts))
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${"tenant-domain-host:"+claim}))`);
  const rows=await tx.select({id:tenantDomains.id,host:tenantDomains.host,isPrimary:tenantDomains.isPrimary,isVerified:tenantDomains.isVerified})
   .from(tenantDomains).where(and(eq(tenantDomains.collegeId,college.id),isNull(tenantDomains.deletedAt))).for("update");
  const current=rows.find(row=>isManagedHost(row.host,base));
  // Network retries after a committed mutation must not fail merely because
  // the caller is still carrying the former expectedHost. A different desired
  // host still needs the strict compare-and-swap check below.
  if(input.action==="REMOVE"&&!current)return {host:null,changed:false,fallbackHost:rows.find(row=>row.isPrimary)?.host??null};
  if(host!==null&&current?.host===host)return {host,changed:false,fallbackHost:null};
  if((current?.host??null)!==input.expectedHost)throw new ManagedSubdomainError("SUBDOMAIN_STALE");
  if(input.action==="ALLOT"&&current)throw new ManagedSubdomainError("SUBDOMAIN_ALREADY_ALLOTTED");
  if(input.action==="CHANGE"&&!current)throw new ManagedSubdomainError("SUBDOMAIN_MISSING");
  if(host){
   const [taken]=await tx.select({id:tenantDomains.id,collegeId:tenantDomains.collegeId})
    .from(tenantDomains).where(sql<boolean>`lower(${tenantDomains.host})=${host}`).limit(1);
   if(taken&&taken.collegeId!==college.id)throw new TenantDomainServiceError("HOST_CONFLICT");
   if(taken&&taken.id!==current?.id)throw new ManagedSubdomainError("SUBDOMAIN_CONFLICT");
  }
  // The old managed address is soft-retired before the new address is
  // published. Do not reassign an old public host to another college through
  // a routine allot/change, even if the active-host index releases it.
  const now=new Date();
  // Removing a primary managed host should reactivate a verified custom
  // address as primary when one exists, rather than leave an avoidable gap.
  const fallback=!host&&current?.isPrimary?
   rows.find(row=>row.id!==current.id&&row.isVerified):undefined;
  if(current){
   await tx.update(tenantDomains).set({
    deletedAt:now,isPrimary:false,isVerified:false,verificationToken:null,
    updatedAt:now,lastCheckResult:"MANAGED_RETIRED",
   }).where(and(eq(tenantDomains.id,current.id),isNull(tenantDomains.deletedAt)));
  }
  if(fallback){
   await tx.update(tenantDomains).set({isPrimary:true,updatedAt:now})
    .where(and(eq(tenantDomains.id,fallback.id),isNull(tenantDomains.deletedAt)));
  }
  if(host){
   // A verified custom domain can remain in the college, but at most one
   // active domain is primary after this write.
   await tx.update(tenantDomains).set({isPrimary:false,updatedAt:now})
     .where(and(eq(tenantDomains.collegeId,college.id),
       eq(tenantDomains.isPrimary,true),isNull(tenantDomains.deletedAt)));
   await tx.insert(tenantDomains).values({
    collegeId:college.id,host,isPrimary:true,isVerified:true,
    verifiedAt:now,lastCheckedAt:now,lastCheckResult:"MANAGED_WILDCARD",
   });
  }
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,actorUserId:ctx.user.id,
   module:"PLATFORM",eventType:"PLATFORM_COLLEGE_SUBDOMAIN_CHANGED",importance:"HIGH",
   subjectType:"COLLEGE",subjectId:college.id,summary:"Super Admin changed a managed college web address",
   metadata:{from:current?.host??null,to:host,action:input.action,
     previousDomainId:current?.id??null,softRetired:Boolean(current)},
  });
  return {host,changed:true,fallbackHost:fallback?.host??null};
 });
}
