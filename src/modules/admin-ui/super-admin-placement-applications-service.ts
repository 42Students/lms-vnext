import "server-only";
import {and,asc,count,eq,ilike,or,exists,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,placementApplications,placementJobs,placementJobRoleOptions,placementApplicationScreenings,users,learnerProgramEnrollments,programs,departments,cohorts} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
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
  pipelineStage:sql<string>`coalesce(${placementCollegeApplicationStages.stage}, case when ${placementApplicationScreenings.status} = 'SHORTLISTED' then 'SHORTLISTED' when ${placementApplicationScreenings.status} = 'REJECTED' then 'REJECTED' else 'APPLIED' end)`.as("admin_application_pipeline_stage"),
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
 .leftJoin(placementCollegeApplicationStages,and(eq(placementCollegeApplicationStages.applicationId,placementApplications.id),eq(placementCollegeApplicationStages.jobId,placementJobs.id)))
 .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
 .where(and(
  query.status==="ALL"?undefined:eq(placementApplications.status,query.status as "SUBMITTED"|"WITHDRAWN"),
  query.jobId?eq(placementApplications.jobId,query.jobId):undefined,
  query.source!=="ALL"?eq(placementApplications.channel,query.source):undefined,
  query.channel!=="ALL"?eq(placementApplications.channel,query.channel):undefined,
  query.pipelineStage!=="ALL"?sql`coalesce(${placementCollegeApplicationStages.stage}, case when ${placementApplicationScreenings.status} = 'SHORTLISTED' then 'SHORTLISTED' when ${placementApplicationScreenings.status} = 'REJECTED' then 'REJECTED' else 'APPLIED' end) = ${query.pipelineStage}`:undefined,
  query.departmentId||query.programId||query.cohortId?exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
   .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,selected.collegeId)))
   .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),
    eq(cohorts.programId,learnerProgramEnrollments.programId)))
   .where(and(eq(learnerProgramEnrollments.membershipId,placementApplications.membershipId),
    eq(learnerProgramEnrollments.status,"ACTIVE"),
    query.departmentId?eq(departments.id,query.departmentId):undefined,
    query.programId?eq(programs.id,query.programId):undefined,
    query.cohortId?eq(cohorts.id,query.cohortId):undefined))):undefined,
  query.q?or(ilike(placementJobs.title,scopedSearchLike(query.q)),
   ilike(placementJobRoleOptions.title,scopedSearchLike(query.q)),
   ilike(users.displayName,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_placement_applications");
 const [counts,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.submittedAt),asc(source.id))
   .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=counts[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 const now=Date.now();
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(row=>({
  id:row.id,title:row.learnerName||"Unnamed applicant",
  subtitle:row.jobTitle+" · "+row.roleTitle,
  status:row.status,details:["Channel: "+row.channel,"Eligibility: "+row.eligibilityStatus,
   "Submitted: "+fmt.format(row.submittedAt)+" IST","Age: "+Math.max(0,Math.floor((now-row.submittedAt.getTime())/86400000))+" day(s)","Stage: "+row.pipelineStage],
  href:`/admin/placements/applications/${encodeURIComponent(row.id)}`,
  secondaryHref:`/admin/placements/jobs/${encodeURIComponent(row.jobId)}/applications`,
  secondaryLabel:"Manage hiring stage →",
 }))};
}
