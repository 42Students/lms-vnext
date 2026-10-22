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
import {istStartOfDay,istStartOfNextDay} from "./super-admin-hiring-ist-boundary";
import {hiringStagesAtOrAfter,type HiringPersistedStage} from "./super-admin-hiring-funnel-model";

/**
 * A separate cumulative funnel is required: snapshots are mutually exclusive,
 * while each stage an application EVER reached is counted in the funnel.
 * The stage-history table is append-only; current stage is included for
 * pre-history imports. No recipient detail is returned in report payloads.
 */
export async function getSuperAdminCompanyHiringReport(context:RequestContext,raw:unknown){
 const query=superAdminHiringReportQuery.parse(raw);
 // A verified organization scope may span several colleges. Do not require
 // an arbitrary selected college for its read-only hiring summary.
 if(!isSuperAdmin(context))throw new AuthorizationError("placements.read");
 const selected={
  collegeId:context.adminScope?.collegeId??null,
  organizationId:context.adminScope?.organizationId??null,
 };
 if(!selected.collegeId&&!selected.organizationId)
  throw new AuthorizationError("placements.read");
 requirePermission(context,"placements.read",{
  collegeId:selected.collegeId??undefined,
  organizationId:selected.organizationId??undefined,
 });
 // Academic facet IDs are meaningful only inside a selected college; they
 // must not leak into organization-wide aggregates through an old URL.
 if(!selected.collegeId && (query.departmentId||query.programId||query.cohortId))
  throw new AuthorizationError("placements.read");
 const db=getDb();
 const pattern=query.q?"%"+query.q.replace(/[\\%_]/g,"\\$&")+"%":null;
 const matchingAcademic= query.departmentId||query.programId||query.cohortId
  ?exists(db.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
    .innerJoin(programs,eq(programs.id,learnerProgramEnrollments.programId))
    .innerJoin(departments,and(eq(departments.id,programs.departmentId),
      selected.collegeId?eq(departments.collegeId,selected.collegeId):undefined))
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
 // A later stage (including a verified JOINED offer) proves that all earlier
 // milestones were reached even if an imported application has sparse history.
 // Compute this for each application, not by inflating aggregate stage totals.
 const reached=(name:HiringPersistedStage)=>{
  const reachedStages=sql.join(hiringStagesAtOrAfter(name).map(value=>sql`${value}`),sql`, `);
  return sql<number>`count(distinct ${placementApplications.id}) filter (
   where ${placementApplications.id} is not null
   and (${stage} in (${reachedStages}) or ${verifiedJoined} or exists (
      select 1 from ${placementCollegeApplicationStageHistory} h
      where h.stage_id = ${placementCollegeApplicationStages.id}
      and h.to_stage in (${reachedStages})
   ))
  )::integer`.mapWith(Number);
 };
 const applicationFilters=and(
  query.appliedFrom?gte(appliedAt,istStartOfDay(query.appliedFrom)):undefined,
  query.appliedTo?lt(appliedAt,istStartOfNextDay(query.appliedTo)):undefined,
  matchingAcademic,
 );
 const result=await db.select({
  companyId:placementCompanies.id,companyName:placementCompanies.name,
  jobId:placementJobs.id,jobTitle:placementJobs.title,
  totalApplications:sql<number>`count(distinct ${placementApplications.id})::integer`.mapWith(Number),
  applied:tally("APPLIED"),
  withdrawn:sql<number>`count(distinct ${placementApplications.id}) filter (where ${placementApplications.status} = 'WITHDRAWN')::integer`.mapWith(Number),
  waitlisted:tally("WAITLISTED"),
  shortlisted:tally("SHORTLISTED"),assessment:tally("ASSESSMENT"),interview:tally("INTERVIEW"),
  offered:tally("OFFERED"),
  // A mutable pipeline stage alone cannot prove that a learner joined.
  // Use the accepted offer + persisted JOINED outcome, consistent with
  // the selected-college employer-history tally. EXISTS prevents multiple
  // historical offers inflating the same applicant.
  hired:sql<number>`count(distinct ${placementApplications.id}) filter (
    where ${placementApplications.status} = 'SUBMITTED'
    and ${verifiedJoined}
  )::integer`.mapWith(Number),
  rejected:tally("REJECTED"),
  // Cumulative funnel distinct from mutually exclusive snapshot metrics:
  // all applications begin APPLIED, including later withdrawals.
  funnelApplied:sql<number>`count(distinct ${placementApplications.id})::integer`.mapWith(Number),
  funnelShortlisted:reached("SHORTLISTED"),
  funnelAssessment:reached("ASSESSMENT"),
  funnelInterview:reached("INTERVIEW"),
  funnelOffered:reached("OFFERED"),
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
  )::integer`.mapWith(Number),
  // The first SHORTLISTED instant is the earliest of the native stage history
  // and the screening history (migrated applications keep their first decision
  // there), the same two sources the college funnel reads.
  firstShortlistCount:sql<number>`count((
    select min(t.at) from (
      select h.moved_at as at from ${placementCollegeApplicationStageHistory} h
       where h.stage_id = ${placementCollegeApplicationStages.id} and h.to_stage = 'SHORTLISTED'
      union all
      select sh.created_at as at from placement_application_screening_history sh
       where sh.application_id = ${placementApplications.id} and sh.to_status = 'SHORTLISTED'
    ) t where t.at >= ${appliedAt}
  ))::integer`.mapWith(Number),
  firstShortlistHours:sql<number|null>`avg((
    select extract(epoch from (min(t.at)-${appliedAt}))/3600
    from (
      select h.moved_at as at from ${placementCollegeApplicationStageHistory} h
       where h.stage_id = ${placementCollegeApplicationStages.id} and h.to_stage = 'SHORTLISTED'
      union all
      select sh.created_at as at from placement_application_screening_history sh
       where sh.application_id = ${placementApplications.id} and sh.to_status = 'SHORTLISTED'
    ) t where t.at >= ${appliedAt}
  ))`.mapWith(Number),
 }).from(placementJobs)
  .innerJoin(placementCompanyRelationships,and(
    eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
    eq(placementCompanyRelationships.collegeId,placementJobs.collegeId)))
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
  .orderBy(asc(placementCompanies.name),asc(placementJobs.id));
 // Keep the display/CSV safety cap, not a cap on aggregate truth. The
 // database already performs company/job grouping; accumulate all matching
 // grouped rows on the server before returning only the first capped page.
 const bounded=result.slice(0,SUPER_ADMIN_HIRING_EXPORT_CAP);
 const fullTotals={
  totalApplications:0,applied:0,shortlisted:0,assessment:0,interview:0,
  offered:0,hired:0,rejected:0,withdrawn:0,waitlisted:0,
 };
 const fullFunnelTotals={
  applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0,
 };
 let shortlistWeightedHours=0,shortlistObservationCount=0;
 for(const row of result){
  for(const key of ["totalApplications","applied","shortlisted","assessment",
   "interview","offered","hired","rejected","withdrawn","waitlisted"] as const)
   fullTotals[key]+=row[key];
  for(const key of ["applied","shortlisted","assessment","interview","offered","hired"] as const){
   const field=("funnel"+key[0]!.toUpperCase()+key.slice(1)) as
    "funnelApplied"|"funnelShortlisted"|"funnelAssessment"|"funnelInterview"|"funnelOffered"|"funnelHired";
   fullFunnelTotals[key]+=row[field];
  }
  if(typeof row.firstShortlistHours==="number"&&
     Number.isFinite(row.firstShortlistHours)&&row.firstShortlistHours>=0&&
     row.firstShortlistCount>0){
   shortlistWeightedHours+=row.firstShortlistHours*row.firstShortlistCount;
   shortlistObservationCount+=row.firstShortlistCount;
  }
 }
 const fullShortlistMeanHours=shortlistObservationCount>0?
  Math.round(shortlistWeightedHours/shortlistObservationCount):null;
 return {
  query,
  // These rows preserve the mutually exclusive current-status snapshot.
  rows:bounded as SuperAdminHiringRow[],
  matchingJobCount:result.length,
  // All filters were applied by the same selected-college SQL joins as the
  // displayed job rows. These aggregates cover *all* matching jobs, even
  // when the CSV and company rows are capped for response size.
  fullTotals,fullFunnelTotals,fullShortlistMeanHours,
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
   sharedJobs:selected.collegeId?"SELECTED_COLLEGE_ONLY" as const:
     "SELECTED_ORGANIZATION_COLLEGES" as const,
   companyReportJobFilter:"EXPLICIT_JOB_SCOPE_EXTENSION" as const,
   // Snapshot stages count only submitted applications. Withdrawn rows
   // remain in totalApplications and in a distinct withdrawn bucket;
   // stages are not assumed to sum to total after screening changes.
   totalReconciliation:"TOTAL_INCLUDES_WITHDRAWN_AND_OTHER_STATES" as const,
  },
 };
}
