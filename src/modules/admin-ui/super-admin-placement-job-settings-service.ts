import "server-only";
import {and,asc,count,eq,ilike} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,placementJobs,placementJobEligibilityPolicies} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listSuperAdminJobSettings(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const db=getDb();
 const source=db.select({
  id:aliasedColumn(placementJobs.id,"admin_job_policy_job_id"),
  title:aliasedColumn(placementJobs.title,"admin_job_policy_job_title"),
  status:aliasedColumn(placementJobs.status,"admin_job_policy_job_status"),
  deadline:placementJobs.applicationDeadline,
  cgpa:placementJobEligibilityPolicies.minCgpaHundredths,
  activeBacklogs:placementJobEligibilityPolicies.maxActiveBacklogs,
  gapYears:placementJobEligibilityPolicies.maxGapYears,
  missingEvidence:placementJobEligibilityPolicies.missingEvidencePolicy,
  configuredJobId:aliasedColumn(placementJobEligibilityPolicies.jobId,"admin_policy_configured_job_id"),
 }).from(placementJobs)
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),eq(placementJobs.collegeId,scope.collegeId),
  scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .leftJoin(placementJobEligibilityPolicies,eq(placementJobEligibilityPolicies.jobId,placementJobs.id))
 .where(and(
  query.status==="ALL"?undefined:eq(placementJobs.status,query.status),
  query.q?ilike(placementJobs.title,scopedSearchLike(query.q)):undefined,
 )).as("super_admin_job_policy_directory");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.title),asc(source.id))
  .limit(SUPER_ADMIN_READ_PAGE_SIZE).offset((query.page-1)*SUPER_ADMIN_READ_PAGE_SIZE),
 ]);
 const total=totals[0]?.total??0;const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total),items:rows.map(r=>({
  id:r.id,title:r.title,subtitle:r.configuredJobId?"Eligibility policy configured":"No job eligibility policy recorded",
  status:r.status,details:[
   "Deadline: "+(r.deadline?fmt.format(r.deadline)+" IST":"Not set"),
   "Min CGPA: "+(r.cgpa===null?"Not restricted":(r.cgpa/100).toFixed(2)),
   "Max active backlogs: "+(r.activeBacklogs??"Not restricted"),
   "Max gap years: "+(r.gapYears??"Not restricted"),
   "Missing evidence: "+(r.missingEvidence??"Not configured"),
  ],href:`/admin/placements/jobs/${encodeURIComponent(r.id)}`,
 }))};
}
