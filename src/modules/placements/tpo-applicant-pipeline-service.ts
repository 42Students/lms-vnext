import "server-only";
import {z} from "zod";
import { and, asc, desc, eq, exists, gte, ilike, or, sql,lte } from "drizzle-orm";
import { getDb } from "@/db/client";
import { collegeMemberships, placementApplications, placementApplicationScreenings, placementJobRoleOptions,
  placementJobs, users, learnerProfiles, learnerProgramEnrollments, sectionEnrollments, cohorts, programs, departments,placementCandidateAcademicEvidence } from "@/db/schema";
import { hasMembershipRole, type RequestContext } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { requirePlacementManageScope } from "./scope";
import { PlacementsServiceError } from "./errors";
import { requireTpoJobActor } from "./tpo-job-write-base";
import { tpoApplicantPipelinePage, tpoApplicantPipelineParams,tpoApplicantSubmittedSince } from "./tpo-applicant-pipeline-model";
import {tpoApplicantExportSearchPattern} from "./tpo-drive-applications-export-model";
/** Job/college scoped compatibility facets. Org-wide indexing uses another service. */
const oldFacetsSchema=z.strictObject({
 submittedAfter:z.iso.date().optional(),submittedBefore:z.iso.date().optional(),
 minScore:z.coerce.number().int().min(0).max(100).optional(),
 maxScore:z.coerce.number().int().min(0).max(100).optional(),
 cohortId:z.uuid().optional(),sectionId:z.uuid().optional(),
 programId:z.uuid().optional(),departmentId:z.uuid().optional(),
 source:z.enum(["ALL","LEARNER","COLLEGE"]).default("ALL"),
}).superRefine((x,ctx)=>{
 if(x.minScore!==undefined&&x.maxScore!==undefined&&x.maxScore<x.minScore)
  ctx.addIssue({code:"custom",path:["maxScore"],message:"Maximum score cannot be below minimum"});
 if(x.submittedAfter&&x.submittedBefore&&x.submittedBefore<x.submittedAfter)
  ctx.addIssue({code:"custom",path:["submittedBefore"],message:"End date must follow start date"});
});
export const legacyTpoApplicantRouteMap={
 list:"GET /api/placements/tpo/jobs/[jobId]/applicants-pipeline",
 detail:"GET /api/placements/jobs/[jobId]",
 jobApplications:"GET /api/placements/jobs/[jobId]/applications",
} as const;
export async function getTpoApplicantPipeline(context: RequestContext, raw: unknown) {
  const membership = context.membership;
  if (!membership || !hasMembershipRole(context,"TPO") ||
      membership.status!=="ACTIVE" || context.user.platformStatus!=="ACTIVE") {
    throw new AuthorizationError("placements.manage");
  }
  const collegeId=membership.collegeId;
  if(!can(context,"placements.manage",{collegeId})) throw new AuthorizationError("placements.manage");
  requirePermission(context,"placements.manage",{collegeId});
  const params:Record<string,unknown>=raw&&typeof raw==="object"&&!Array.isArray(raw)?
   {...raw as Record<string,unknown>}:{ };
  const oldRaw:Record<string,unknown>={};
  for(const key of ["submittedAfter","submittedBefore","minScore","maxScore","cohortId","sectionId","programId","departmentId","source"]){
   if(Object.prototype.hasOwnProperty.call(params,key)){oldRaw[key]=params[key];delete params[key];}
  }
  const input=tpoApplicantPipelineParams.parse(params);
  const oldFacets=oldFacetsSchema.parse(oldRaw);
  await requirePlacementManageScope(context,collegeId);
  const db=getDb();
  await db.transaction(async(tx)=>{await requireTpoJobActor(tx,context);},{accessMode:"read only"});
  const [job]=await db.select({id:placementJobs.id,title:placementJobs.title,status:placementJobs.status})
    .from(placementJobs)
    // Historical placements remain readable after a drive is archived.
    // The TPO membership, persisted placements.manage permission and college
    // scope still apply; archive only disables mutation/public discovery.
    .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
  if(!job) throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
  const projection=await db.transaction(async tx=>{
   const since=tpoApplicantSubmittedSince(input.submittedWithin,new Date());
   const queryPattern=tpoApplicantExportSearchPattern(input.search);
   const screeningScore=sql<number|null>`(select max(r.score_percent) from placement_round_results r where r.application_id=${placementApplications.id} and r.status='APPLIED' and r.superseded_at is null)`;
   const from=oldFacets.submittedAfter?new Date(oldFacets.submittedAfter+"T00:00:00+05:30"):null;
   const before=oldFacets.submittedBefore?
    new Date(Date.parse(oldFacets.submittedBefore+"T00:00:00+05:30")+86400000-1):null;
   const rosterScope=oldFacets.cohortId||oldFacets.sectionId||oldFacets.programId||oldFacets.departmentId?exists(
    tx.select({id:learnerProgramEnrollments.id})
     .from(learnerProgramEnrollments)
     .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
     .innerJoin(programs,eq(programs.id,cohorts.programId))
     .innerJoin(departments,eq(departments.id,programs.departmentId))
     .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
       eq(learnerProgramEnrollments.status,"ACTIVE"),eq(departments.collegeId,collegeId),
       oldFacets.cohortId?eq(cohorts.id,oldFacets.cohortId):undefined,
       oldFacets.programId?eq(programs.id,oldFacets.programId):undefined,
       oldFacets.departmentId?eq(departments.id,oldFacets.departmentId):undefined,
       oldFacets.sectionId?exists(tx.select({id:sectionEnrollments.id}).from(sectionEnrollments)
         .where(and(eq(sectionEnrollments.learnerEnrollmentId,learnerProgramEnrollments.id),
           eq(sectionEnrollments.sectionId,oldFacets.sectionId)))):undefined))
   ):undefined;
   const rosterMatch=input.search?exists(
    tx.select({id:learnerProgramEnrollments.id})
      .from(learnerProgramEnrollments)
      .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
      .innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
        eq(learnerProgramEnrollments.status,"ACTIVE"),eq(departments.collegeId,collegeId),
        or(ilike(cohorts.name,queryPattern),ilike(cohorts.code,queryPattern),
          ilike(programs.name,queryPattern),ilike(departments.name,queryPattern))))
   ):undefined;
   const flagScope=input.flag==="WITHDRAWAL_REQUESTED"?sql<boolean>`exists(
      select 1 from placement_learner_requests req
       where req.application_id=${placementApplications.id}
        and req.request_type='APPLICATION_WITHDRAWAL' and req.status='PENDING')`:
    input.flag==="NO_SHOW"?sql<boolean>`exists(
      select 1 from placement_round_results r
       where r.application_id=${placementApplications.id}
        and r.status='APPLIED' and r.outcome='ABSENT' and r.superseded_at is null)`:
    input.flag==="PLACED_ELSEWHERE"?sql<boolean>`exists(
      select 1 from placement_offers o
       join placement_applications other on other.id=o.application_id
       where other.membership_id=${placementApplications.membershipId}
        and other.job_id<>${job.id} and o.status='ACCEPTED')`:
    input.flag==="ADDED_BY_COLLEGE"?sql<boolean>`${placementApplications.submittedByUserId}<>${collegeMemberships.userId}`:undefined;
   const scope=and(eq(placementApplications.jobId,job.id),
    sql`${placementApplications.legacyWasDeleted} is distinct from true`,
    flagScope,
    since?gte(placementApplications.submittedAt,since):undefined,
    from?gte(placementApplications.submittedAt,from):undefined,
    before?lte(placementApplications.submittedAt,before):undefined,
    oldFacets.source==="COLLEGE"?sql<boolean>`${placementApplications.submittedByUserId}<>${collegeMemberships.userId}`:
     oldFacets.source==="LEARNER"?eq(placementApplications.submittedByUserId,collegeMemberships.userId):undefined,
    oldFacets.minScore!==undefined?gte(screeningScore,oldFacets.minScore):undefined,
    oldFacets.maxScore!==undefined?lte(screeningScore,oldFacets.maxScore):undefined,
    rosterScope,
    input.channel!=="ALL"?eq(placementApplications.channel,input.channel):undefined,
    input.eligibility!=="ALL"?eq(placementApplications.eligibilityStatus,input.eligibility):undefined,
    input.search?or(
      ilike(users.displayName,queryPattern),ilike(placementJobRoleOptions.title,queryPattern),
      ilike(learnerProfiles.rollNumber,queryPattern),
      ilike(learnerProfiles.registrationNumber,queryPattern),ilike(users.email,queryPattern),
      ilike(users.phoneE164,queryPattern),rosterMatch,
      sql<boolean>`concat_ws(' ',coalesce(${users.displayName},''),coalesce(${placementJobRoleOptions.title},''),coalesce(${learnerProfiles.rollNumber},''),coalesce(${users.email},'')) ilike ${queryPattern}`):undefined);
   const stage=sql`case when ${placementApplications.status} = 'WITHDRAWN' then 'WITHDRAWN'
    when ${placementApplicationScreenings.status} in ('SHORTLISTED','HOLD','REJECTED')
    then ${placementApplicationScreenings.status}::text else 'PENDING' end`;
   const [counts]=await tx.select({all:sql<number>`count(*)::int`,
    submitted:sql<number>`count(*) filter(where ${placementApplications.status} = 'SUBMITTED')::int`,
    pending:sql<number>`count(*) filter(where ${stage} = 'PENDING')::int`,
    hold:sql<number>`count(*) filter(where ${stage} = 'HOLD')::int`,
    shortlisted:sql<number>`count(*) filter(where ${stage} = 'SHORTLISTED')::int`,
    rejected:sql<number>`count(*) filter(where ${stage} = 'REJECTED')::int`,
    withdrawn:sql<number>`count(*) filter(where ${stage} = 'WITHDRAWN')::int`,
   }).from(placementApplications)
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
     eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
    .leftJoin(placementCandidateAcademicEvidence,
     eq(placementCandidateAcademicEvidence.membershipId,collegeMemberships.id))
    .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
     eq(placementJobRoleOptions.jobId,job.id)))
    .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(scope);
   const totals=counts??{all:0,submitted:0,pending:0,hold:0,shortlisted:0,rejected:0,withdrawn:0};
   const totalMatching=input.stage==="ALL"?totals.all:
    input.stage==="SUBMITTED"?totals.submitted:
    input.stage==="PENDING"?totals.pending:input.stage==="HOLD"?totals.hold:
    input.stage==="SHORTLISTED"?totals.shortlisted:input.stage==="REJECTED"?totals.rejected:totals.withdrawn;
   const pagination=tpoApplicantPipelinePage(totalMatching,input.page);
   const records=await tx.select({
    id:placementApplications.id,
    student:sql<string>`coalesce(nullif(trim(${users.displayName}),''),nullif(trim(${learnerProfiles.rollNumber}),''),split_part(${users.email},'@',1),'Learner')`,
    role:placementJobRoleOptions.title,
    rollNumber:learnerProfiles.rollNumber,
    email:users.email,
    phone:users.phoneE164,
    batchName:sql<string|null>`(select c.name from learner_program_enrollments e
      join cohorts c on c.id=e.cohort_id join programs p on p.id=c.program_id
      join departments d on d.id=p.department_id
      where e.membership_id=${collegeMemberships.id} and e.status='ACTIVE'
        and d.college_id=${collegeId}
      order by e.admitted_at desc,e.id desc limit 1)`,
    branchName:sql<string|null>`(select d.name from learner_program_enrollments e
      join cohorts c on c.id=e.cohort_id join programs p on p.id=c.program_id
      join departments d on d.id=p.department_id
      where e.membership_id=${collegeMemberships.id} and e.status='ACTIVE'
        and d.college_id=${collegeId}
      order by e.admitted_at desc,e.id desc limit 1)`,
    cgpaHundredths:placementCandidateAcademicEvidence.cgpaHundredths,
    activeBacklogs:placementCandidateAcademicEvidence.activeBacklogs,
    pastBacklogs:placementCandidateAcademicEvidence.pastBacklogs,
    tenthPctBasisPoints:placementCandidateAcademicEvidence.tenthPctBasisPoints,
    twelfthPctBasisPoints:placementCandidateAcademicEvidence.twelfthPctBasisPoints,
    lastRound:sql<string|null>`(select r.name from placement_round_results result
      join placement_job_rounds r on r.id=result.round_id
      where result.application_id=${placementApplications.id}
       and result.status='APPLIED' and result.superseded_at is null
      order by r.sequence desc,result.updated_at desc limit 1)`,
    lastResult:sql<string|null>`(select result.outcome from placement_round_results result
      join placement_job_rounds r on r.id=result.round_id
      where result.application_id=${placementApplications.id}
       and result.status='APPLIED' and result.superseded_at is null
      order by r.sequence desc,result.updated_at desc limit 1)`,
    applicationStatus:placementApplications.status,
    screeningStatus:placementApplicationScreenings.status,
    /** Legacy appliedAt is first application, even after a re-submission. */
    firstAppliedAt:placementApplications.firstAppliedAt,
    sourceProvider:placementApplications.sourceProvider,
    externalRef:placementApplications.externalRef,
    candidateMessage:placementApplicationScreenings.candidateMessage,
    resumeRecorded:sql<boolean>`exists(select 1 from placement_application_private_artifacts artifact
      where artifact.application_id=${placementApplications.id}
        and artifact.resume_object_path is not null)`,
    privateNotesRecorded:sql<boolean>`exists(select 1 from placement_application_private_artifacts artifact
      where artifact.application_id=${placementApplications.id}
        and nullif(trim(artifact.internal_notes),'') is not null)`,
    screeningScore,
    screeningUpdatedAt:placementApplicationScreenings.updatedAt,
    eligibilityStatus:placementApplications.eligibilityStatus,
    channel:placementApplications.channel,
    submittedByUserId:placementApplications.submittedByUserId,
    learnerUserId:collegeMemberships.userId,
    pendingWithdrawal:sql<boolean>`exists(select 1 from placement_learner_requests w
      where w.application_id=${placementApplications.id}
        and w.request_type='APPLICATION_WITHDRAWAL' and w.status='PENDING')`,
    noShow:sql<boolean>`exists(select 1 from placement_round_results r
      where r.application_id=${placementApplications.id}
        and r.status='APPLIED' and r.outcome='ABSENT')`,
    placedElsewhere:sql<boolean>`exists(select 1 from placement_offers o
      join placement_applications other on other.id=o.application_id
      where other.membership_id=${placementApplications.membershipId}
        and other.job_id<>${job.id} and o.status='ACCEPTED')`,
    submittedAt:placementApplications.submittedAt,
  }).from(placementApplications)
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
    .leftJoin(placementCandidateAcademicEvidence,
      eq(placementCandidateAcademicEvidence.membershipId,collegeMemberships.id))
    .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
      eq(placementJobRoleOptions.jobId,job.id)))
    .leftJoin(placementApplicationScreenings,
      eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(and(scope,input.stage==="ALL"?undefined:input.stage==="SUBMITTED"?
     eq(placementApplications.status,"SUBMITTED"):sql`${stage} = ${input.stage}::text`))
    .orderBy(input.sort==="SCORE_DESC"?sql`${screeningScore} desc nulls last`:
      input.sort==="OLDEST"?asc(placementApplications.submittedAt):
      input.sort==="LEARNER_NAME"?asc(users.displayName):desc(placementApplications.submittedAt),
      desc(placementApplications.submittedAt),placementApplications.id)
    .limit(pagination.pageSize).offset(pagination.offset);
   const allFiltered=totalMatching>0&&totalMatching<=5000?await tx.select({
    id:placementApplications.id,student:users.displayName,role:placementJobRoleOptions.title,
   }).from(placementApplications)
    .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
      eq(collegeMemberships.collegeId,collegeId)))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
    .innerJoin(placementJobRoleOptions,and(eq(placementJobRoleOptions.id,placementApplications.roleOptionId),
      eq(placementJobRoleOptions.jobId,job.id)))
    .leftJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
    .where(and(scope,input.stage==="ALL"?undefined:input.stage==="SUBMITTED"?
      eq(placementApplications.status,"SUBMITTED"):sql`${stage} = ${input.stage}::text`))
    .orderBy(placementApplications.id).limit(5000):null;
   return {counts:totals,...pagination,allFiltered,rows:records.map(({submittedByUserId,learnerUserId,...row})=>({
    ...row,
    flags:[
      ...(submittedByUserId!==learnerUserId?["Added by college"]:[]),
      ...(row.eligibilityStatus!=="ELIGIBLE"?["Eligibility needs review"]:[]),
      ...(row.pendingWithdrawal?["Withdrawal requested"]:[]),
      ...(row.noShow?["No-show"]:[]),
      ...(row.placedElsewhere?["Accepted offer elsewhere"]:[]),
    ],
    submittedAt:row.submittedAt.toISOString(),
    firstAppliedAt:row.firstAppliedAt?.toISOString()??row.submittedAt.toISOString(),
    // The detail route grants a scanned, time-bounded attachment. Raw URLs,
    // storage object paths and staff private notes never enter this list.
    resumeAvailable:row.resumeRecorded,
    staffNoteAvailable:row.privateNotesRecorded,
    screeningUpdatedAt:row.screeningUpdatedAt?.toISOString()??null,
   }))};
  },{isolationLevel:"repeatable read",accessMode:"read only"});
  return {job,stage:input.stage,search:input.search,channel:input.channel,eligibility:input.eligibility,sort:input.sort,submittedWithin:input.submittedWithin,flag:input.flag,oldFacets,...projection};
}

// Organization-wide access is a separate explicitly authorized Super Admin surface.
// TPO job pipelines must never change tenant scope as a side effect of reporting.
export {searchOrganizationPlacementApplications,getOrganizationApplicationStats} from "./organization-application-search-service";
