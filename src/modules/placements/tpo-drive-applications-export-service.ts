import "server-only";
import {and,asc,desc,eq,exists,gte,ilike,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,placementApplications,placementApplicationScreenings,
 placementJobRoleOptions,placementJobs,users,placementCandidateAcademicEvidence,learnerProgramEnrollments,cohorts,programs,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {requireTpoJobCollege,requireTpoJobActor} from "./tpo-job-write-base";
import {tpoApplicantSubmittedSince} from "./tpo-applicant-pipeline-model";
import {collectTpoExportPages,projectTpoDriveApplicationsExport,tpoDriveApplicationsExportQuerySchema,
 TPO_DRIVE_APPLICATION_EXPORT_LIMIT,tpoApplicantExportSearchPattern} from "./tpo-drive-applications-export-model";
export async function getTpoDriveApplicationsExport(context:RequestContext,raw:unknown,options:{exportAll?:boolean}={}){
 const collegeId=await requireTpoJobCollege(context);
 const {jobId,stage,search,channel,eligibility,sort,submittedWithin,flag}=tpoDriveApplicationsExportQuerySchema.parse(raw);
 const since=tpoApplicantSubmittedSince(submittedWithin,new Date());
 const db=getDb();
 await db.transaction(async(tx)=>{await requireTpoJobActor(tx,context);},{accessMode:"read only"});
 const [job]=await db.select({id:placementJobs.id,title:placementJobs.title})
  .from(placementJobs).where(and(eq(placementJobs.id,jobId),
   eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const records=await db.transaction(async tx=>{
 const queryPattern=tpoApplicantExportSearchPattern(search);
 const rosterMatch=search?exists(
  tx.select({id:learnerProgramEnrollments.id}).from(learnerProgramEnrollments)
   .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,eq(departments.id,programs.departmentId))
   .where(and(eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
    eq(learnerProgramEnrollments.status,"ACTIVE"),eq(departments.collegeId,collegeId),
    or(ilike(cohorts.name,queryPattern),ilike(cohorts.code,queryPattern),
       ilike(programs.name,queryPattern),ilike(departments.name,queryPattern))))
 ):undefined;
 const flagScope=flag==="WITHDRAWAL_REQUESTED"?sql<boolean>`exists(
   select 1 from placement_learner_requests req
    where req.application_id=${placementApplications.id}
      and req.request_type='APPLICATION_WITHDRAWAL' and req.status='PENDING')`:
  flag==="NO_SHOW"?sql<boolean>`exists(
   select 1 from placement_round_results r
    where r.application_id=${placementApplications.id}
     and r.status='APPLIED' and r.outcome='ABSENT' and r.superseded_at is null)`:
  flag==="PLACED_ELSEWHERE"?sql<boolean>`exists(
   select 1 from placement_offers o
    join placement_applications other on other.id=o.application_id
    where other.membership_id=${placementApplications.membershipId}
     and other.job_id<>${job.id} and o.status='ACCEPTED')`:
  flag==="ADDED_BY_COLLEGE"?sql<boolean>`${placementApplications.submittedByUserId}<>${collegeMemberships.userId}`:undefined;
 const readPage=async(offset:number,limit:number)=>await tx.select({
  applicationId:placementApplications.id,studentName:users.displayName,
  roleTitle:placementJobRoleOptions.title,status:placementApplications.status,
  screeningStatus:placementApplicationScreenings.status,
  screeningUpdatedAt:placementApplicationScreenings.updatedAt,
  eligibilityStatus:placementApplications.eligibilityStatus,
  channel:placementApplications.channel,submittedAt:placementApplications.submittedAt,
  rollNumber:learnerProfiles.rollNumber,email:users.email,phone:users.phoneE164,
  cgpaHundredths:placementCandidateAcademicEvidence.cgpaHundredths,
  activeBacklogs:placementCandidateAcademicEvidence.activeBacklogs,
  pastBacklogs:placementCandidateAcademicEvidence.pastBacklogs,
  tenthPctBasisPoints:placementCandidateAcademicEvidence.tenthPctBasisPoints,
  twelfthPctBasisPoints:placementCandidateAcademicEvidence.twelfthPctBasisPoints,
  evidenceSource:placementCandidateAcademicEvidence.source,
  // TPO-drive-workspace-33: project the active college-owned academic roster,
  // without multiplying applications for learners with historical enrollments.
  batchName:sql<string|null>`(select c.name from learner_program_enrollments lpe
    join cohorts c on c.id=lpe.cohort_id join programs p on p.id=c.program_id
    join departments d on d.id=p.department_id
    where lpe.membership_id=${collegeMemberships.id} and lpe.status='ACTIVE'
      and d.college_id=${collegeId} order by lpe.admitted_at desc,lpe.id desc limit 1)`,
  branchName:sql<string|null>`(select d.name from learner_program_enrollments lpe
    join cohorts c on c.id=lpe.cohort_id join programs p on p.id=c.program_id
    join departments d on d.id=p.department_id
    where lpe.membership_id=${collegeMemberships.id} and lpe.status='ACTIVE'
      and d.college_id=${collegeId} order by lpe.admitted_at desc,lpe.id desc limit 1)`,
  academicYear:sql<string|null>`(select c.academic_year from learner_program_enrollments lpe
    join cohorts c on c.id=lpe.cohort_id join programs p on p.id=c.program_id
    join departments d on d.id=p.department_id
    where lpe.membership_id=${collegeMemberships.id} and lpe.status='ACTIVE'
      and d.college_id=${collegeId} order by lpe.admitted_at desc,lpe.id desc limit 1)`,
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
  .where(and(eq(placementApplications.jobId,job.id),
   flagScope,
   since?gte(placementApplications.submittedAt,since):undefined,
   channel!=="ALL"?eq(placementApplications.channel,channel):undefined,
   eligibility!=="ALL"?eq(placementApplications.eligibilityStatus,eligibility):undefined,
   stage==="ALL"?undefined:stage==="SUBMITTED"?eq(placementApplications.status,"SUBMITTED"):
    sql`case when ${placementApplications.status} = 'WITHDRAWN' then 'WITHDRAWN'
     when ${placementApplicationScreenings.status} in ('SHORTLISTED','HOLD','REJECTED')
     then ${placementApplicationScreenings.status}::text else 'PENDING' end = ${stage}::text`,
   search?or(ilike(users.displayName,queryPattern),
    ilike(placementJobRoleOptions.title,queryPattern),
    ilike(learnerProfiles.rollNumber,queryPattern),
    ilike(learnerProfiles.registrationNumber,queryPattern),ilike(users.email,queryPattern),
    ilike(users.phoneE164,queryPattern),rosterMatch):undefined,
  ))
  .orderBy(sort==="OLDEST"?asc(placementApplications.submittedAt):
    sort==="LEARNER_NAME"?asc(users.displayName):desc(placementApplications.submittedAt),
    placementApplications.id)
  .limit(limit).offset(offset);
 return options.exportAll
  ? await collectTpoExportPages(readPage)
  : await readPage(0,TPO_DRIVE_APPLICATION_EXPORT_LIMIT+1);
 },{isolationLevel:"repeatable read",accessMode:"read only"});
 return {job,stage,search,channel,eligibility,sort,submittedWithin,flag,...projectTpoDriveApplicationsExport(records.map(r=>({
  ...r,addedByCollege:r.submittedByUserId!==r.learnerUserId,
  submittedAt:r.submittedAt.toISOString(),screeningUpdatedAt:r.screeningUpdatedAt?.toISOString()??null,
 })),job.title,options)};
}
