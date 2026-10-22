import "server-only";
import {and,asc,eq,ilike} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireOwnLearnerProfileAccess} from "./learner-profile-access-service";
import {DEFAULT_LEARNER_EDUCATION_CATALOG} from "./learner-education-picker-model";

/** Legacy config is platform-owned; institution suggestions are never
 * derived from another tenant's private learner profiles or directory.
 * The learner may still enter an institution absent from this shortlist. */
export async function getOwnLearnerEducationCatalog(
 context:RequestContext,searchRaw:string,
){
 const membership=await requireOwnLearnerProfileAccess(context);
 const search=searchRaw.trim();
 if(search.length>100)throw new Error("INVALID_PROFILE_CATALOG_QUERY");
 const literal="%"+search.replace(/[\\%_]/g,"\\$&")+"%";
 const rows=await getDb().select({name:colleges.name})
  .from(colleges).where(and(
   eq(colleges.organizationId,membership.organizationId),
   eq(colleges.status,"ACTIVE"),
   ...(search.length>=2?[ilike(colleges.name,literal)]:[]),
  )).orderBy(asc(colleges.name)).limit(25);
 return {
  catalog:DEFAULT_LEARNER_EDUCATION_CATALOG,
  institutions:[...new Set(rows.map(row=>row.name))],
  institutionsScope:"ORGANIZATION_COLLEGES" as const,
  institutionSearchSupported:true,
 };
}
