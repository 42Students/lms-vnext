import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,colleges,tenantDomains} from "@/db/schema";
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
 return managedBaseDomain(process.env.TENANT_MANAGED_BASE_DOMAIN,
  process.env.TENANT_MANAGED_WILDCARD_READY==="true");
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
 const baseDomain=configuredDomain();
 if(!baseDomain)return {ready:false as const,baseDomain:null,currentHost:null};
 const rows=await getDb().select({host:tenantDomains.host,isPrimary:tenantDomains.isPrimary})
  .from(tenantDomains).where(eq(tenantDomains.collegeId,college.id));
 const managed=rows.find(row=>isManagedHost(row.host,baseDomain));
 return {ready:true as const,baseDomain,currentHost:managed?.host??null};
}
export async function changeManagedCollegeSubdomain(ctx:RequestContext,collegeInput:string,raw:unknown){
 const college=await checkedCollege(ctx,collegeInput);
 const base=configuredDomain();
 if(!base)throw new ManagedSubdomainError("MANAGED_WILDCARD_NOT_READY");
 const input=managedSubdomainRequest.parse(raw);
 const host=input.action==="REMOVE"?null:managedHost(input.label!,base);
 return getDb().transaction(async tx=>{
  const [lockedCollege]=await tx.select({id:colleges.id}).from(colleges)
   .where(and(eq(colleges.id,college.id),eq(colleges.status,"ACTIVE"))).for("update").limit(1);
  if(!lockedCollege)throw new TenantDomainServiceError("COLLEGE_NOT_FOUND");
  const rows=await tx.select({id:tenantDomains.id,host:tenantDomains.host,isPrimary:tenantDomains.isPrimary,isVerified:tenantDomains.isVerified})
   .from(tenantDomains).where(eq(tenantDomains.collegeId,college.id)).for("update");
  const current=rows.find(row=>isManagedHost(row.host,base));
  if((current?.host??null)!==input.expectedHost)throw new ManagedSubdomainError("SUBDOMAIN_STALE");
  if(input.action==="ALLOT"&&current)throw new ManagedSubdomainError("SUBDOMAIN_ALREADY_ALLOTTED");
  if(input.action==="CHANGE"&&!current)throw new ManagedSubdomainError("SUBDOMAIN_MISSING");
  if(input.action==="REMOVE"&&!current)throw new ManagedSubdomainError("SUBDOMAIN_MISSING");
  if(host===current?.host)return {host,changed:false};
  if(host){
   const [taken]=await tx.select({id:tenantDomains.id,collegeId:tenantDomains.collegeId})
    .from(tenantDomains).where(sql<boolean>`lower(${tenantDomains.host})=${host}`).limit(1);
   if(taken&&taken.collegeId!==college.id)throw new TenantDomainServiceError("HOST_CONFLICT");
   if(taken&&taken.id!==current?.id)throw new ManagedSubdomainError("SUBDOMAIN_CONFLICT");
  }
  // Managed wildcard ownership and TLS are prerequisites; do not bypass
  // TXT ownership verification for arbitrary customer-controlled hosts.
  if(current){
   await tx.update(tenantDomains).set({isPrimary:false,updatedAt:new Date()})
    .where(eq(tenantDomains.id,current.id));
  }
  if(host){
   const now=new Date();
   if(current){
    // Another verified custom address can be primary while the managed
    // address exists. Clear it before promoting this address atomically.
    await tx.update(tenantDomains).set({isPrimary:false,updatedAt:now})
     .where(and(eq(tenantDomains.collegeId,college.id),eq(tenantDomains.isPrimary,true)));
    await tx.update(tenantDomains).set({host,isVerified:true,verifiedAt:now,
     lastCheckedAt:now,lastCheckResult:"MANAGED_WILDCARD",isPrimary:true,verificationToken:null,updatedAt:now})
     .where(eq(tenantDomains.id,current.id));
   }else{
    // Existing primary custom host stays verified but is no longer primary.
    await tx.update(tenantDomains).set({isPrimary:false,updatedAt:now})
     .where(and(eq(tenantDomains.collegeId,college.id),eq(tenantDomains.isPrimary,true)));
    await tx.insert(tenantDomains).values({collegeId:college.id,host,isPrimary:true,isVerified:true,
     verifiedAt:now,lastCheckedAt:now,lastCheckResult:"MANAGED_WILDCARD"});
   }
  }else if(current){
   await tx.delete(tenantDomains).where(eq(tenantDomains.id,current.id));
  }
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,actorUserId:ctx.user.id,
   module:"PLATFORM",eventType:"PLATFORM_COLLEGE_SUBDOMAIN_CHANGED",importance:"HIGH",
   subjectType:"COLLEGE",subjectId:college.id,summary:"Super Admin changed a managed college web address",
   metadata:{from:current?.host??null,to:host,action:input.action},
  });
  return {host,changed:true};
 });
}
