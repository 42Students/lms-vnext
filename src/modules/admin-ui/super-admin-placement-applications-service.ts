import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,placementApplications,placementJobs,placementJobRoleOptions,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listAdminPlacementApplications(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(placementApplications.id,"admin_application_id"),
  status:aliasedColumn(placementApplications.status,"admin_application_status"),
  eligibilityStatus:placementApplications.eligibilityStatus,
  channel:placementApplications.channel,submittedAt:placementApplications.submittedAt,
  jobId:aliasedColumn(placementJobs.id,"admin_application_job_id"),
  jobTitle:aliasedColumn(placementJobs.title,"admin_application_job_title"),
  roleTitle:aliasedColumn(placementJobRoleOptions.title,"admin_application_role_title"),
  learnerName:aliasedColumn(users.displayName,"admin_application_learner_name"),
 }).from(placementApplications)
 .innerJoin(placementJobs,and(eq(placementJobs.id,placementApplications.jobId),eq(placementJobs.collegeId,selected.collegeId)))
 .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
  eq(placementJobRoleOptions.jobId,placementJobs.id)))
 .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),
  selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,selected.collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .where(and(
  query.status==="ALL"?undefined:eq(placementApplications.status,query.status as "SUBMITTED"|"WITHDRAWN"),
  query.q?or(ilike(placementJobs.title,scopedSearchLike(query.q)),
   ilike(placementJobRoleOptions.title,scopedSearchLike(query.q)),
   ilike(users.displayName,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_placement_applications");
 const [counts,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.submittedAt),asc(source.id))
   .limit(SUPER_ADMIN_READ_PAGE_SIZE).offset((query.page-1)*SUPER_ADMIN_READ_PAGE_SIZE),
 ]);
 const total=counts[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total),items:rows.map(row=>({
  id:row.id,title:row.learnerName||"Unnamed applicant",
  subtitle:row.jobTitle+" · "+row.roleTitle,
  status:row.status,details:["Channel: "+row.channel,"Eligibility: "+row.eligibilityStatus,
   "Submitted: "+fmt.format(row.submittedAt)+" IST"],
  href:`/admin/placements/jobs/${encodeURIComponent(row.jobId)}`,
 }))};
}
