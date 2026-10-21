import "server-only";
import {and,desc,count,eq,ilike,or,exists,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,collegeMemberships,placementApplications,placementJobs,placementJobRoleOptions,placementApplicationScreenings,users,learnerProgramEnrollments,programs,departments,cohorts} from "@/db/schema";
import {placementCollegeApplicationStages} from "@/db/schema/placement-college-application-stages";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listAdminPlacementApplications(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),selected=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(placementApplications.id,"admin_application_id"),
  status:aliasedColumn(placementApplications.status,"admin_application_status"),
  eligibilityStatus:placementApplications.eligibilityStatus,
  channel:placementApplications.channel,submittedAt:placementApplications.submittedAt,
  firstAppliedAt:placementApplications.firstAppliedAt,
  statusUpdatedAt:placementApplications.statusUpdatedAt,
  statusUpdatedBy:placementApplications.statusUpdatedByUserId,
  statusBeforeWithdrawal:placementApplications.statusBeforeWithdrawal,
  withdrawalReason:placementApplications.withdrawalReason,
  legacyApplicationId:placementApplications.legacyApplicationId,
  publicRef:placementApplications.publicRef,
  version:placementApplications.version,
  stageMovedAt:placementCollegeApplicationStages.movedAt,
  stageMovedBy:placementCollegeApplicationStages.movedByUserId,
  screeningStatus:placementApplicationScreenings.status,
  screeningDecidedAt:placementApplicationScreenings.decidedAt,
  screeningDecidedBy:placementApplicationScreenings.decidedByUserId,
  screeningReason:placementApplicationScreenings.candidateMessage,
  latestOfferStatus:sql<string|null>`(
    select po.status from placement_offers po
    where po.application_id=${placementApplications.id}
    order by po.version desc, po.issued_at desc limit 1
  )`.as("admin_application_latest_offer_status"),
  hasOfferLetter:sql<boolean>`exists(
    select 1 from placement_offers po
    where po.application_id=${placementApplications.id}
      and po.offer_letter_url is not null
  )`.as("admin_application_has_offer_letter"),
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
 // Legacy list places recent applicants first. Clamp stale bookmarked pages
 // after scope, status, and search filters; never infer access from a job ID.
 const [counts]=await db.select({total:count()}).from(source);
 const total=counts?.total??0;
 const totalPages=superAdminReadPages(total,query.pageSize);
 const page=Math.min(query.page,totalPages);
 const rows=await db.select().from(source)
  .orderBy(desc(source.submittedAt),desc(source.id))
  .limit(query.pageSize).offset((page-1)*query.pageSize);
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"});
 const now=Date.now();
 return {query:{...query,page},total,totalPages,items:rows.map(row=>({
  id:row.id,title:row.learnerName||"Unnamed applicant",
  subtitle:row.jobTitle+" · "+row.roleTitle,
  status:row.status,details:[
   "Channel: "+row.channel,
   "Eligibility: "+row.eligibilityStatus,
   "Submitted: "+fmt.format(row.submittedAt)+" IST",
   "First applied: "+fmt.format(row.firstAppliedAt??row.submittedAt)+" IST",
   "Age: "+Math.max(0,Math.floor((now-(row.firstAppliedAt??row.submittedAt).getTime())/86400000))+" day(s)",
   "Stage: "+row.pipelineStage,
   "Screening: "+(row.screeningStatus??"PENDING"),
   "Screening decision: "+(row.screeningDecidedAt?fmt.format(row.screeningDecidedAt)+" IST":"Not recorded"),
   "Screening decision by: "+(row.screeningDecidedBy??"Not recorded"),
   "Screening reason: "+(row.screeningReason??"Not recorded"),
   "Latest offer: "+(row.latestOfferStatus??"No offer"),
   "Offer letter: "+(row.hasOfferLetter?"Available in authorized offer details":"Not attached"),
   "Status updated: "+(row.statusUpdatedAt?fmt.format(row.statusUpdatedAt)+" IST":"Not recorded"),
   "Status changed by: "+(row.statusUpdatedBy??"Not recorded"),
   "Stage moved: "+(row.stageMovedAt?fmt.format(row.stageMovedAt)+" IST":"Not recorded"),
   "Stage moved by: "+(row.stageMovedBy??"Not recorded"),
   "Status before withdrawal: "+(row.statusBeforeWithdrawal??"Not recorded"),
   "Withdrawal reason: "+(row.withdrawalReason??"Not recorded"),
   "Legacy application ID: "+(row.legacyApplicationId??"Not recorded"),
   "Application reference: "+row.publicRef,
   "Application version: "+row.version,
  ],
  href:`/admin/placements/applications/${encodeURIComponent(row.id)}`,
  secondaryHref:`/admin/placements/jobs/${encodeURIComponent(row.jobId)}/applications`,
  secondaryLabel:"Manage hiring stage →",
 }))};
}
