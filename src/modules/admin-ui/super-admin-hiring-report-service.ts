import "server-only";
import {and,asc,eq,exists,gte,ilike,lt,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 colleges,departments,programs,learnerProgramEnrollments,cohorts,
 collegeMemberships,placementApplications,placementCompanies,
 placementCompanyRelationships,placementJobs,placementApplicationScreenings,
 placementOffers,placementJoiningOutcomes,
} from "@/db/schema";
import {placementCollegeApplicationStages,placementCollegeApplicationStageHistory} from "@/db/schema/placement-college-application-stages";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";

import {superAdminHiringReportQuery,SUPER_ADMIN_HIRING_EXPORT_CAP,type SuperAdminHiringRow} from "./super-admin-hiring-report-model";
/**
 * Legacy Dayjs boundaries denote IST calendar days. Use the next midnight as
 * an EXCLUSIVE bound rather than losing sub-millisecond timestamps at 23:59:59.
 * IST never applies daylight-saving changes.
 */
function istStartOfDay(value:string):Date {
 return new Date(value+"T00:00:00+05:30");
}
function istStartOfNextDay(value:string):Date {
 return new Date(istStartOfDay(value).getTime()+86_400_000);
}

/**
 * A separate cumulative funnel is required: snapshots are mutually exclusive,
 * while each stage an application EVER reached is counted in the funnel.
 * The stage-history table is append-only; current stage is included for
 * pre-history imports. No recipient detail is returned in report payloads.
 */
export async function getSuperAdminCompanyHiringReport(context:RequestContext,raw:unknown){
 const query=superAdminHiringReportQuery.parse(raw);
 // A reviewed organization selection is also a legitimate legacy scope.
 // An unselected global scope is not: never issue an unrestricted report.
 if(!isSuperAdmin(context)||(!context.adminScope?.collegeId&&!context.adminScope?.organizationId))
  throw new AuthorizationError("placements.read");
 const selected={collegeId:context.adminScope?.collegeId??null,
  organizationId:context.adminScope?.organizationId??null};
 requirePermission(context,"placements.read",{
  ...(selected.collegeId?{collegeId:selected.collegeId}:{}),
  ...(selected.organizationId?{organizationId:selected.organizationId}:{}),
 });
 const db=getDb();
 const pattern=query.q?"%"+query.q.replace(/[\\%_]/g,"\\$&")+"%":null;
 const matchingAcademic= query.departmentId||query.programId||query.cohortId
  ?exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
    .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,placementJobs.collegeId)))
    .innerJoin(cohorts,and(eq(cohorts.id,learnerProgramEnrollments.cohortId),
      eq(cohorts.programId,learnerProgramEnrollments.programId)))
    .where(and(eq(learnerProgramEnrollments.membershipId,placementApplications.membershipId),
      eq(learnerProgramEnrollments.status,"ACTIVE"),
      query.departmentId?eq(departments.id,query.departmentId):undefined,
      query.programId?eq(programs.id,query.programId):undefined,
      query.cohortId?eq(cohorts.id,query.cohortId):undefined))) : undefined;
 const stage=sql<string>`coalesce(${placementCollegeApplicationStages.stage}, case when ${placementApplicationScreenings.status} = 'SHORTLISTED' then 'SHORTLISTED' when ${placementApplicationScreenings.status} = 'REJECTED' then 'REJECTED' else 'APPLIED' end)`;
 // Persisted first application time survives a withdrawal/reapplication. It
 // is the legacy applied-at clock for date filters and time-to-shortlist.
 const appliedAt=sql<Date>`coalesce(${placementApplications.firstAppliedAt}, ${placementApplications.submittedAt})`;
 const verifiedJoined=sql<boolean>`exists (
   select 1 from ${placementOffers}
   inner join ${placementJoiningOutcomes}
     on ${placementJoiningOutcomes.offerId} = ${placementOffers.id}
   where ${placementOffers.applicationId} = ${placementApplications.id}
     and ${placementOffers.status} = 'ACCEPTED'
     and ${placementJoiningOutcomes.status} = 'JOINED'
 )`;
 const tally=(name:string)=>sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementApplications.status} = 'SUBMITTED' and ${stage} = ${name})::integer`.mapWith(Number);
 const reached=(name:string)=>sql<number>`count(distinct ${placementApplications.id}) filter (
   where ${placementApplications.id} is not null
   and (${stage} = ${name} or exists (
      select 1 from ${placementCollegeApplicationStageHistory} h
      where h.stage_id = ${placementCollegeApplicationStages.id}
      and h.to_stage = ${name}
   ))
 )::integer`.mapWith(Number);
 const applicationFilters=and(
  query.appliedFrom?gte(appliedAt,istStartOfDay(query.appliedFrom)):undefined,
  query.appliedTo?lt(appliedAt,istStartOfNextDay(query.appliedTo)):undefined,
  matchingAcademic,
 );
 const perJob=db.select({
  companyId:placementCompanies.id,companyName:placementCompanies.name,
  jobId:placementJobs.id,jobTitle:placementJobs.title,
  totalApplications:sql<number>`count(distinct ${placementApplications.id})::integer`.mapWith(Number).as("total_applications"),
  applied:tally("APPLIED").as("applied"),
  withdrawn:sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementApplications.status} = 'WITHDRAWN')::integer`.mapWith(Number).as("withdrawn"),
  waitlisted:tally("WAITLISTED").as("waitlisted"),
  shortlisted:tally("SHORTLISTED").as("shortlisted"),assessment:tally("ASSESSMENT").as("assessment"),interview:tally("INTERVIEW").as("interview"),
  offered:tally("OFFERED").as("offered"),
  // A mutable pipeline stage alone cannot prove that a learner joined.
  // Use the accepted offer + persisted JOINED outcome, consistent with
  // the selected-college employer-history tally. EXISTS prevents multiple
  // historical offers inflating the same applicant.
  hired:sql<number>`count(distinct ${placementApplications.id}) filter (
    where ${placementApplications.status} = 'SUBMITTED'
    and ${verifiedJoined}
  )::integer`.mapWith(Number).as("hired"),
  rejected:tally("REJECTED").as("rejected"),
  // Cumulative funnel distinct from mutually exclusive snapshot metrics:
  // all applications begin APPLIED, including later withdrawals.
  funnelApplied:sql<number>`count(distinct ${placementApplications.id})::integer`.mapWith(Number).as("funnel_applied"),
  funnelShortlisted:reached("SHORTLISTED").as("funnel_shortlisted"),
  funnelAssessment:reached("ASSESSMENT").as("funnel_assessment"),
  funnelInterview:reached("INTERVIEW").as("funnel_interview"),
  funnelOffered:reached("OFFERED").as("funnel_offered"),
  // A joined placement is not always accompanied by a synthetic HIRED
  // college stage. Use the real offer+joining evidence as a second route.
  funnelHired:sql<number>`count(distinct ${placementApplications.id}) filter (
    where ${placementApplications.id} is not null and (
      ${stage} = 'HIRED' or ${verifiedJoined} or exists (
        select 1 from ${placementCollegeApplicationStageHistory} h
        where h.stage_id = ${placementCollegeApplicationStages.id}
          and h.to_stage = 'HIRED'
      )
    )
  )::integer`.mapWith(Number).as("funnel_hired"),
  firstShortlistCount:sql<number>`count((
    select min(h.moved_at) from ${placementCollegeApplicationStageHistory} h
    where h.stage_id = ${placementCollegeApplicationStages.id}
      and h.to_stage = 'SHORTLISTED' and h.moved_at >= ${appliedAt}
  ))::integer`.mapWith(Number).as("first_shortlist_count"),
  firstShortlistHours:sql<number|null>`avg((
    select extract(epoch from (min(h.moved_at)-${appliedAt}))/3600
    from ${placementCollegeApplicationStageHistory} h
    where h.stage_id = ${placementCollegeApplicationStages.id}
      and h.to_stage = 'SHORTLISTED'
      and h.moved_at >= ${appliedAt}
  ))`.mapWith(Number).as("first_shortlist_hours"),
 }).from(placementJobs)
  .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId),
    selected.collegeId?eq(placementCompanyRelationships.collegeId,selected.collegeId):undefined)))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(colleges,and(eq(colleges.id,placementJobs.collegeId),
    selected.collegeId?eq(colleges.id,selected.collegeId):undefined,
    selected.organizationId?eq(colleges.organizationId,selected.organizationId):undefined))
  // A legacy free-text-only company is normalized to a required per-college
  // relationship on import. This join must NOT invent a cross-college job.
  // Keep zero-application jobs in this LEFT JOIN, but never let an
  // application with a foreign-college membership into the aggregates.
  // A separate LEFT JOIN on memberships is insufficient: COUNT(application.id)
  // still includes the unmatched foreign application.
  .leftJoin(placementApplications,and(
    eq(placementApplications.jobId,placementJobs.id),
    applicationFilters,
    exists(db.select({id:collegeMemberships.id}).from(collegeMemberships)
      .where(and(eq(collegeMemberships.id,placementApplications.membershipId),
        eq(collegeMemberships.collegeId,placementJobs.collegeId)))),
  ))
  .leftJoin(placementCollegeApplicationStages,and(
    eq(placementCollegeApplicationStages.applicationId,placementApplications.id),
    eq(placementCollegeApplicationStages.jobId,placementJobs.id)))
  .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
  .where(and(
    query.jobId?eq(placementJobs.id,query.jobId):undefined,
    pattern?or(ilike(placementJobs.title,pattern),ilike(placementCompanies.name,pattern)):undefined,
  ))
  .groupBy(placementJobs.id,placementJobs.title,placementCompanies.id,placementCompanies.name)
  .as("hiring_per_job");
 // Aggregate the whole authorized, filtered set IN PostgreSQL. Only the
 // rendered job table/CSV is capped; a 5000-row cap must never turn a
 // dashboard's headline counts into plausible but incorrect totals.
 const [result,totalsRows]=await Promise.all([
  db.select().from(perJob)
   .orderBy(asc(perJob.companyName),asc(perJob.jobId))
   .limit(SUPER_ADMIN_HIRING_EXPORT_CAP+1),
  db.select({
   matchingJobCount:sql<number>`count(*)::integer`.mapWith(Number),
   totalApplications:sql<number>`coalesce(sum(${perJob.totalApplications}),0)::integer`.mapWith(Number),
   applied:sql<number>`coalesce(sum(${perJob.applied}),0)::integer`.mapWith(Number),
   shortlisted:sql<number>`coalesce(sum(${perJob.shortlisted}),0)::integer`.mapWith(Number),
   assessment:sql<number>`coalesce(sum(${perJob.assessment}),0)::integer`.mapWith(Number),
   interview:sql<number>`coalesce(sum(${perJob.interview}),0)::integer`.mapWith(Number),
   offered:sql<number>`coalesce(sum(${perJob.offered}),0)::integer`.mapWith(Number),
   hired:sql<number>`coalesce(sum(${perJob.hired}),0)::integer`.mapWith(Number),
   rejected:sql<number>`coalesce(sum(${perJob.rejected}),0)::integer`.mapWith(Number),
   withdrawn:sql<number>`coalesce(sum(${perJob.withdrawn}),0)::integer`.mapWith(Number),
   waitlisted:sql<number>`coalesce(sum(${perJob.waitlisted}),0)::integer`.mapWith(Number),
   funnelApplied:sql<number>`coalesce(sum(${perJob.funnelApplied}),0)::integer`.mapWith(Number),
   funnelShortlisted:sql<number>`coalesce(sum(${perJob.funnelShortlisted}),0)::integer`.mapWith(Number),
   funnelAssessment:sql<number>`coalesce(sum(${perJob.funnelAssessment}),0)::integer`.mapWith(Number),
   funnelInterview:sql<number>`coalesce(sum(${perJob.funnelInterview}),0)::integer`.mapWith(Number),
   funnelOffered:sql<number>`coalesce(sum(${perJob.funnelOffered}),0)::integer`.mapWith(Number),
   funnelHired:sql<number>`coalesce(sum(${perJob.funnelHired}),0)::integer`.mapWith(Number),
   shortlistCount:sql<number>`coalesce(sum(${perJob.firstShortlistCount}),0)::integer`.mapWith(Number),
   shortlistWeightedHours:sql<number>`coalesce(sum(${perJob.firstShortlistHours} * ${perJob.firstShortlistCount}),0)::double precision`.mapWith(Number),
  }).from(perJob),
 ]);
 const bounded=result.slice(0,SUPER_ADMIN_HIRING_EXPORT_CAP);
 const total=totalsRows[0]!;
 return {
  matchingJobCount:total.matchingJobCount,
  fullTotals:{
   totalApplications:total.totalApplications,applied:total.applied,
   shortlisted:total.shortlisted,assessment:total.assessment,
   interview:total.interview,offered:total.offered,hired:total.hired,
   rejected:total.rejected,withdrawn:total.withdrawn,waitlisted:total.waitlisted,
  },
  fullFunnelTotals:{
   applied:total.funnelApplied,shortlisted:total.funnelShortlisted,
   assessment:total.funnelAssessment,interview:total.funnelInterview,
   offered:total.funnelOffered,hired:total.funnelHired,
  },
  fullShortlistMeanHours:total.shortlistCount>0
   ?Math.round(total.shortlistWeightedHours/total.shortlistCount):null,
  query,
  // These rows preserve the mutually exclusive current-status snapshot.
  rows:bounded as SuperAdminHiringRow[],
  // Do NOT derive the funnel from rows.applied/shortlisted: an applicant who
  // later moved stages still contributes to earlier stages in this view.
  funnelRows:bounded.map(row=>({
   jobId:row.jobId,companyId:row.companyId,
   applied:row.funnelApplied,shortlisted:row.funnelShortlisted,
   assessment:row.funnelAssessment,interview:row.funnelInterview,
   offered:row.funnelOffered,hired:row.funnelHired,
   averageHoursToFirstShortlist:row.firstShortlistHours,
   firstShortlistObservationCount:row.firstShortlistCount,
  })),
  truncated:result.length>SUPER_ADMIN_HIRING_EXPORT_CAP,
  reportSemantics:{
   timezone:"Asia/Kolkata" as const,
   appliedToExclusive:query.appliedTo?istStartOfNextDay(query.appliedTo):null,
   snapshot:"CURRENT_STAGE" as const,
   funnel:"EVER_REACHED" as const,
   totalApplicationsIncludesWithdrawn:true,
   applicationClock:"FIRST_APPLIED_AT_OR_SUBMITTED_AT" as const,
   hiredEvidence:"ACCEPTED_OFFER_AND_JOINED_OUTCOME" as const,
   firstShortlistLatency:"FIRST_VALID_SHORTLIST_TRANSITION" as const,
   sharedJobs:selected.collegeId?"SELECTED_COLLEGE_ONLY" as const:"AUTHORIZED_ORGANIZATION_ONLY" as const,
   companyReportJobFilter:"EXPLICIT_JOB_SCOPE_EXTENSION" as const,
   // Snapshot stages count only submitted applications. Withdrawn rows
   // remain in totalApplications and in a distinct withdrawn bucket;
   // stages are not assumed to sum to total after screening changes.
   totalReconciliation:"TOTAL_INCLUDES_WITHDRAWN_AND_OTHER_STATES" as const,
  },
 };
}
