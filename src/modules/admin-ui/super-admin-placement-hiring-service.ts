import "server-only";
import {and,asc,count,eq,ilike,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,placementApplications,placementJobs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listSuperAdminHiringByJob(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const db=getDb();
 const source=db.select({
  id:aliasedColumn(placementJobs.id,"admin_hiring_job_id"),
  title:aliasedColumn(placementJobs.title,"admin_hiring_job_title"),
  status:aliasedColumn(placementJobs.status,"admin_hiring_job_status"),
  applications:sql<number>`count(${collegeMemberships.id})`.mapWith(Number).as("admin_hiring_all_applications"),
  submitted:sql<number>`count(${collegeMemberships.id}) filter (where ${placementApplications.status} = 'SUBMITTED')`.mapWith(Number).as("admin_hiring_submitted"),
 }).from(placementJobs)
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),eq(placementJobs.collegeId,scope.collegeId),
  scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .leftJoin(placementApplications,eq(placementApplications.jobId,placementJobs.id))
 .leftJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .where(and(query.status==="ALL"?undefined:eq(placementJobs.status,query.status),
  query.q?ilike(placementJobs.title,scopedSearchLike(query.q)):undefined))
 .groupBy(placementJobs.id).as("super_admin_hiring_by_job");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.title),asc(source.id))
  .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=totals[0]?.total??0;
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(r=>({
  id:r.id,title:r.title,subtitle:"Persisted application funnel · job-level totals",
  status:r.status,details:[
   "Total applications: "+r.applications,
   "Currently submitted: "+r.submitted,
   "Withdrawn: "+(r.applications-r.submitted),
   "Only applicant memberships registered in this college are counted.",
  ],href:`/admin/placements/jobs/${encodeURIComponent(r.id)}`,
 }))};
}
