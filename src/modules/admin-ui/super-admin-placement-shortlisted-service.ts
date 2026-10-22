import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,placementApplications,placementApplicationScreenings,
 placementJobs,placementJobRoleOptions,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listSuperAdminShortlisted(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),scope=requireSuperAdminSelectedCollege(context,"placements.read");
 const db=getDb();
 const source=db.select({
  id:aliasedColumn(placementApplications.id,"admin_shortlisted_application_id"),
  status:aliasedColumn(placementApplications.status,"admin_shortlisted_application_status"),
  jobId:aliasedColumn(placementJobs.id,"admin_shortlisted_job_id"),
  jobTitle:aliasedColumn(placementJobs.title,"admin_shortlisted_job_name"),
  roleTitle:aliasedColumn(placementJobRoleOptions.title,"admin_shortlisted_role_name"),
  learnerName:aliasedColumn(users.displayName,"admin_shortlisted_learner_name"),
  decidedAt:placementApplicationScreenings.decidedAt,
 }).from(placementApplicationScreenings)
 .innerJoin(placementApplications,eq(placementApplications.id,placementApplicationScreenings.applicationId))
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,scope.collegeId)))
 .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
  eq(placementJobRoleOptions.jobId,placementJobs.id)))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),eq(collegeMemberships.collegeId,scope.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(and(eq(placementApplicationScreenings.status,"SHORTLISTED"),
  query.status==="ALL"?undefined:eq(placementApplications.status,query.status),
  query.jobId?eq(placementJobs.id,query.jobId):undefined,
  query.q?or(ilike(users.displayName,scopedSearchLike(query.q)),ilike(placementJobs.title,scopedSearchLike(query.q)),
  ilike(placementJobRoleOptions.title,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_shortlisted");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.learnerName),asc(source.id))
  .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=totals[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(r=>({
  id:r.id,title:r.learnerName||"Unnamed applicant",subtitle:r.jobTitle+" · "+r.roleTitle,
  status:r.status,details:["Screening: Shortlisted","Decision: "+(r.decidedAt?fmt.format(r.decidedAt)+" IST":"Not recorded")],
  href:`/admin/placements/shortlisted/${encodeURIComponent(r.id)}`,
 }))};
}
