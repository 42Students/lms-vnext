import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {placementTpoTrustedDomains} from "@/db/schema/tpo-collaboration";
import type {RequestContext} from "@/modules/identity/context";
import {requirePlacementManageScope} from "./scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {placementTableExists} from "./staged-tables";
const free=new Set(["gmail.com","googlemail.com","yahoo.com","yahoo.co.in","yahoo.in","ymail.com",
 "outlook.com","outlook.in","hotmail.com","live.com","msn.com","icloud.com","me.com","aol.com",
 "rediffmail.com","protonmail.com","proton.me","zohomail.com","zohomail.in",
 "mail.com","gmx.com","yandex.com"]);
const domainSchema=z.string().trim().min(4).max(253).transform(value=>
 value.toLowerCase().replace(/^@/,"")).refine(value=>
 /^[a-z0-9](?:[a-z0-9-]*\.)+[a-z]{2,}$/.test(value)&&!free.has(value),
 "Use a valid non-free company domain");
export class TpoTrustedDomainError extends Error{
 constructor(readonly code:"TRUST_STORAGE_PENDING"|"DOMAIN_ALREADY_TRUSTED"|"DOMAIN_NOT_FOUND"){
  super(code);this.name="TpoTrustedDomainError";
 }
}
export async function changeTpoTrustedDomain(ctx:RequestContext,raw:unknown){
 const input=z.strictObject({domain:domainSchema,action:z.enum(["TRUST","REMOVE"])}).parse(raw);
 const member=ctx.membership;
 if(!member)throw new TpoTrustedDomainError("DOMAIN_NOT_FOUND");
 const college=await requirePlacementManageScope(ctx,member.collegeId);
 if(!await placementTableExists("placement_tpo_trusted_domains"))
  throw new TpoTrustedDomainError("TRUST_STORAGE_PENDING");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  if(input.action==="TRUST"){
   const [added]=await tx.insert(placementTpoTrustedDomains).values({
    collegeId:college.id,domain:input.domain,createdByUserId:ctx.user.id,
   }).onConflictDoNothing().returning({domain:placementTpoTrustedDomains.domain});
   if(!added)throw new TpoTrustedDomainError("DOMAIN_ALREADY_TRUSTED");
  }else{
   const [deleted]=await tx.delete(placementTpoTrustedDomains).where(and(
    eq(placementTpoTrustedDomains.collegeId,college.id),
    eq(placementTpoTrustedDomains.domain,input.domain),
   )).returning({domain:placementTpoTrustedDomains.domain});
   if(!deleted)throw new TpoTrustedDomainError("DOMAIN_NOT_FOUND");
  }
  await tx.insert(activityEvents).values({
   module:"PLACEMENTS",eventType:"placements.tpo.trusted_domain_changed",
   organizationId:college.organizationId,collegeId:college.id,actorUserId:ctx.user.id,
   actorMembershipId:member.id,subjectType:"trusted_company_domain",subjectId:input.domain,
   summary:input.action==="TRUST"?"Placement team trusted a company email domain":"Placement team stopped trusting a company email domain",
   metadata:{domain:input.domain,action:input.action},
  });
  return {domain:input.domain,trusted:input.action==="TRUST"};
 });
}
