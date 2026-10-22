import "server-only";
import {and,asc,desc,eq,ilike,inArray,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,placementJobs,placementCompanyRelationships,placementCompanies,
 placementJobRoleOptions} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveOrganizationPlacementSearchScope} from "./organization-application-search-service";

/** Legacy JobSearchDTO crosswalk for authorized platform/organization admins.
 * Integer legacyJobId is display/import metadata, NOT a resource locator.
 * Each normalized role option has a distinct UUID; old single-role CTC is
 * never blindly applied to all roles. College tenancy comes from the job's
 * persisted college, and the organization is verified before either query.
 */
export const organizationJobSearchSchema=z.strictObject({
 organizationId:z.string().uuid().optional(),
 q:z.string().trim().max(120).default(""),
 status:z.enum(["ALL","DRAFT","PUBLISHED","CLOSED","CANCELLED","ARCHIVED"]).default("ALL"),
 sort:z.enum(["NEWEST","OLDEST","TITLE"]).default("NEWEST"),
 page:z.coerce.number().int().min(1).max(100000).default(1),
 pageSize:z.coerce.number().int().min(1).max(100).default(50),
});

export async function searchOrganizationPlacementJobs(context:RequestContext,raw:unknown){
 const input=organizationJobSearchSchema.parse(raw);
 const organizationId=await resolveOrganizationPlacementSearchScope(context,input.organizationId);
 const search=input.q.trim();
 const escaped=search.replace(/[\\%_]/g,"\\$&");
 const pattern="%"+escaped+"%";
 const conditions=and(eq(colleges.organizationId,organizationId),
  input.status==="ALL"?undefined:eq(placementJobs.status,input.status),
  search?or(ilike(placementJobs.title,pattern),ilike(placementCompanies.name,pattern),
   ilike(placementJobs.description,pattern)):undefined);
 const db=getDb();
 const [countRows]=await db.select({total:sql<number>`count(*)::int`})
  .from(placementJobs)
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,placementJobs.collegeId)))
  .innerJoin(placementCompanies,
   eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(conditions);
 const order=input.sort==="TITLE"?
  [asc(placementJobs.title),asc(placementJobs.id)]:
  input.sort==="OLDEST"?
  [asc(sql`coalesce(${placementJobs.legacyPostedAt},${placementJobs.publishedAt},${placementJobs.createdAt})`),
   asc(placementJobs.id)]:
  [desc(sql`coalesce(${placementJobs.legacyPostedAt},${placementJobs.publishedAt},${placementJobs.createdAt})`),
   asc(placementJobs.id)];
 const rows=await db.select({
  id:placementJobs.id,legacyId:placementJobs.legacyJobId,
  legacySlug:placementJobs.legacySlug,
  collegeId:placementJobs.collegeId,organizationId:colleges.organizationId,
  title:placementJobs.title,description:placementJobs.description,
  responsibilities:sql<string|null>`${placementJobs.legacyPostingDetails}->>'responsibilities'`,
  employmentType:placementJobs.employmentType,jobType:placementJobs.jobTypeLabel,
  workMode:placementJobs.workMode,locations:placementJobs.locations,
  applicationMode:placementJobs.applicationMode,
  legacyDriveMode:placementJobs.legacyDriveMode,
  ctcLpa:placementJobs.ctcLpa,
  minimumAnnualCtcInr:placementJobs.minimumAnnualCtcInr,
  maximumAnnualCtcInr:placementJobs.maximumAnnualCtcInr,
  applicationDeadline:placementJobs.applicationDeadline,
  postedAt:sql<Date>`coalesce(${placementJobs.legacyPostedAt},${placementJobs.publishedAt},${placementJobs.createdAt})`,
  status:placementJobs.status,
  isDeleted:sql<boolean>`${placementJobs.status}='ARCHIVED' or ${placementJobs.legacyWasDeleted} is true`,
  companyName:placementCompanies.name,
  companyLogoUrl:placementCompanies.logoPublicUrl,
  legacyTargeting:placementJobs.legacyTargeting,
  legacyCandidatePreferences:placementJobs.legacyCandidatePreferences,
 }).from(placementJobs)
  .innerJoin(colleges,eq(colleges.id,placementJobs.collegeId))
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,placementJobs.collegeId)))
  .innerJoin(placementCompanies,
   eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .where(conditions)
  .orderBy(...order)
  .limit(input.pageSize).offset((input.page-1)*input.pageSize);
 const roleRows=rows.length?await db.select({
  id:placementJobRoleOptions.id,jobId:placementJobRoleOptions.jobId,
  title:placementJobRoleOptions.title,status:placementJobRoleOptions.status,
  minimumAnnualCtcInr:placementJobRoleOptions.minimumAnnualCtcInr,
 }).from(placementJobRoleOptions)
  .where(inArray(placementJobRoleOptions.jobId,rows.map(row=>row.id)))
  .orderBy(asc(placementJobRoleOptions.title),asc(placementJobRoleOptions.id)):[];
 const rolesByJob=new Map<string,typeof roleRows>();
 for(const role of roleRows){
  const collected=rolesByJob.get(role.jobId)??[];
  collected.push(role);
  rolesByJob.set(role.jobId,collected);
 }
 const totalMatching=countRows?.total??0;
 return {organizationId,totalMatching,
  page:input.page,pageSize:input.pageSize,
  totalPages:Math.max(1,Math.ceil(totalMatching/input.pageSize)),
  rows:rows.map(row=>({
   ...row,
   // An external untrusted logo never becomes an executable resource URL.
   companyLogoUrl:row.companyLogoUrl&&/^https:\/\//i.test(row.companyLogoUrl)
    ?row.companyLogoUrl:null,
   roleOptions:rolesByJob.get(row.id)??[],
  }))};
}
