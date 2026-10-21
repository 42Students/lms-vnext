import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {globalCompanyEditSchema} from "./super-admin-company-edit-model";
import {z} from "zod";

/** Updates only the canonical employer record. All drive/relationship readers join this identity. */
export async function editGlobalCompany(context:RequestContext,raw:unknown){
 // Canonical employer catalogue is platform scope even while acting in a college.
 if(!isSuperAdmin(context))
  throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 const input=globalCompanyEditSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  const [current]=await tx.select().from(placementCompanies).where(eq(placementCompanies.id,input.companyId))
   .for("update").limit(1);
  if(!current||current.status!=="ACTIVE")throw new Error("This company is no longer active.");
  if(current.updatedAt.toISOString()!==input.expectedUpdatedAt)
   throw new Error("Company details changed. Refresh before saving.");
  const [duplicate]=await tx.select({id:placementCompanies.id}).from(placementCompanies)
   .where(and(sql`lower(${placementCompanies.name}) = lower(${input.name})`,
    sql`${placementCompanies.id} <> ${current.id}`)).limit(1);
  if(duplicate)throw new Error("Another company already uses this name.");
  const [saved]=await tx.update(placementCompanies).set({
   name:input.name, websiteUrl:input.website, industry:input.industry,
   about:input.about, logoPublicUrl:input.logoPublicUrl,
   updatedAt:sql`greatest(clock_timestamp(), date_trunc('milliseconds', ${placementCompanies.updatedAt}) + interval '1 millisecond')`,
  }).where(and(eq(placementCompanies.id,current.id),
    sql`date_trunc('milliseconds', ${placementCompanies.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`))
   .returning({id:placementCompanies.id,updatedAt:placementCompanies.updatedAt});
  if(!saved)throw new Error("Company details changed. Refresh before saving.");
  await recordActivityEventInTransaction(tx,context,{
   eventType:ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_UPDATED,
   subjectType:"placement_company",subjectId:current.id,subjectLabel:input.name,
   summary:"Super Admin updated canonical company details",
   metadata:{oldName:current.name,newName:input.name,
    changedFields:["name","website","industry","about","logoPublicUrl"]},
  });
  return {id:saved.id,updatedAt:saved.updatedAt.toISOString()};
 });
}

/** Safely preserve historical description/logoUrl alias and PATCH omission. */
export const legacyCompanyEditAliases=z.strictObject({
 description:z.string().trim().max(4000).nullable().optional(),
 logoUrl:z.string().trim().url().refine(raw=>{
  try{const u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password;}catch{return false;}
 }).nullable().optional(),
});
export function applyLegacyCompanyEditAliases<T extends {about:string|null;logoPublicUrl:string|null}>(
 current:T,raw:unknown,
):T{
 const input=legacyCompanyEditAliases.parse(raw);
 return {...current,...(input.description!==undefined?{about:input.description}:{}),
  ...(input.logoUrl!==undefined?{logoPublicUrl:input.logoUrl}:{})};
}
