import "server-only";
import {and,desc,eq,inArray,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,collegeMemberships,departments,learnerProgramEnrollments,
 placementApplications,placementBatchRegistrations,placementCandidatePreferences,
 placementCompanies,placementCompanyRelationships,placementJobs,placementRecruiterCollegeGrants,
 placementJobRoleOptions,placementOffers,placementRecruiterDriveRequests,placementSeasons,programs,cohorts,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {placementJobIdSchema} from "./validation";
import {PlacementsServiceError} from "./errors";
import {getJobEligibilityPolicy} from "./eligibility-service";
import {previewEligiblePublishedDrive} from "./tpo-drive-publish-effects";

export async function getTpoDriveAbout(context:RequestContext,rawJobId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId);
 const db=getDb();
 const [job]=await db.select({
  id:placementJobs.id,collegeId:placementJobs.collegeId,title:placementJobs.title,
  description:placementJobs.description,employmentType:placementJobs.employmentType,
  workMode:placementJobs.workMode,locations:placementJobs.locations,
  openings:placementJobs.openings,applicationDeadline:placementJobs.applicationDeadline,
  applicationMode:placementJobs.applicationMode,status:placementJobs.status,
  minimumAnnualCtcInr:placementJobs.minimumAnnualCtcInr,
  maximumAnnualCtcInr:placementJobs.maximumAnnualCtcInr,
  fixedCtcLpa:placementJobs.fixedCtcLpa,
  variableCtcLpa:placementJobs.variableCtcLpa,
  stipendPerMonthInr:placementJobs.stipendPerMonthInr,
  isDream:placementJobs.isDream,createdAt:placementJobs.createdAt,
  company:placementCompanies.name,companyId:placementCompanies.id,
  season:placementSeasons.name,
  companyRelationshipId:placementCompanyRelationships.id,
 }).from(placementJobs)
  .innerJoin(placementCompanyRelationships,and(
   eq(placementCompanyRelationships.id,placementJobs.companyRelationshipId),
   eq(placementCompanyRelationships.collegeId,placementJobs.collegeId)))
  .innerJoin(placementCompanies,eq(placementCompanies.id,placementCompanyRelationships.companyId))
  .innerJoin(placementSeasons,eq(placementSeasons.id,placementJobs.seasonId))
  .where(and(eq(placementJobs.id,jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 const [policy,packages,applications,feed,companyContacts,reach]=await Promise.all([
  getJobEligibilityPolicy(context,jobId),
  db.select({
   id:placementJobRoleOptions.id,title:placementJobRoleOptions.title,
   employmentType:placementJobRoleOptions.employmentType,
   minimumAnnualCtcInr:placementJobRoleOptions.minimumAnnualCtcInr,
   maximumAnnualCtcInr:placementJobRoleOptions.maximumAnnualCtcInr,
   fixedLpa:placementJobRoleOptions.fixedLpa,variableLpa:placementJobRoleOptions.variableLpa,
   joiningBonusLpa:placementJobRoleOptions.joiningBonusLpa,
   status:placementJobRoleOptions.status,
  }).from(placementJobRoleOptions).where(eq(placementJobRoleOptions.jobId,jobId)),
  db.select({
   applicationId:placementApplications.id,membershipId:placementApplications.membershipId,
   submittedAt:placementApplications.submittedAt,status:placementApplications.status,
  }).from(placementApplications).where(eq(placementApplications.jobId,jobId)),
  db.select({id:activityEvents.id,eventType:activityEvents.eventType,summary:activityEvents.summary,
   occurredAt:activityEvents.occurredAt,metadata:activityEvents.metadata})
   .from(activityEvents).where(and(eq(activityEvents.collegeId,collegeId),
    eq(activityEvents.module,"PLACEMENTS"),
    or(eq(activityEvents.subjectId,jobId),
     sql`${activityEvents.metadata}->>'jobId' = ${jobId}`)))
   .orderBy(desc(activityEvents.occurredAt)).limit(100),
  db.select({email:users.email})
   .from(placementRecruiterCollegeGrants)
   .innerJoin(users,eq(users.id,placementRecruiterCollegeGrants.recruiterUserId))
   .where(and(eq(placementRecruiterCollegeGrants.companyRelationshipId,job.companyRelationshipId),
    eq(placementRecruiterCollegeGrants.status,"ACTIVE")))
   .limit(10),
  db.transaction(async tx=>previewEligiblePublishedDrive(tx,context,job),{accessMode:"read only"}),
 ]);
 // Counts by academic department; this is actual per-user registration eligibility, not
 // a global membership total. Branches can overlap for learners enrolled twice.
 const memberships=await db.select({
  membershipId:collegeMemberships.id,userId:users.id,name:users.displayName,
  branch:departments.name,cohort:cohorts.name,
 }).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(learnerProgramEnrollments,and(
   eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
   eq(learnerProgramEnrollments.status,"ACTIVE")))
  .innerJoin(cohorts,eq(cohorts.id,learnerProgramEnrollments.cohortId))
  .innerJoin(programs,eq(programs.id,cohorts.programId))
  .innerJoin(departments,and(eq(departments.id,programs.departmentId),
   eq(departments.collegeId,collegeId)))
  .where(eq(collegeMemberships.collegeId,collegeId));
 const registeredUsers=new Set(reach.recipientUserIds);
 const applicantIds=new Set(applications.map(a=>a.membershipId));
 const branches=new Map<string,{eligible:Set<string>;applied:Set<string>}>
 ();
 for(const row of memberships){
  const current=branches.get(row.branch)??{eligible:new Set<string>(),applied:new Set<string>()};
  if(registeredUsers.has(row.userId))current.eligible.add(row.userId);
  if(applicantIds.has(row.membershipId))current.applied.add(row.membershipId);
  branches.set(row.branch,current);
 }
 // Only evaluate explanation candidates from actual opted-in registrations.
 const opted=await db.select({
  membershipId:placementBatchRegistrations.membershipId,
  userId:users.id,name:users.displayName,choice:placementBatchRegistrations.choice,
  notify:placementCandidatePreferences.notifyMatchingJobs,
 }).from(placementBatchRegistrations)
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementBatchRegistrations.membershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(placementCandidatePreferences,
  eq(placementCandidatePreferences.membershipId,collegeMemberships.id))
 .where(and(eq(placementBatchRegistrations.collegeId,collegeId),
  eq(placementBatchRegistrations.choice,"PLACEMENTS")));
 const excluded=new Map<string,{name:string;reason:string}>();
 for(const row of opted){
  if(registeredUsers.has(row.userId)||excluded.has(row.membershipId))continue;
  const reason=row.notify===false?"Matching-job notices are disabled":
   "Eligibility, registration evidence or placement restrictions prevent this drive from reaching the learner";
  excluded.set(row.membershipId,{name:row.name??"Learner",reason});
 }
 const accepted=applications.length?await db.select({id:placementOffers.id})
  .from(placementOffers).where(inArray(placementOffers.applicationId,applications.map(a=>a.applicationId))):[];
 const historicalRequests=await db.select({
   id:placementRecruiterDriveRequests.id,status:placementRecruiterDriveRequests.status,
   createdAt:placementRecruiterDriveRequests.createdAt,
   decisionNote:placementRecruiterDriveRequests.decisionNote,
   draft:placementRecruiterDriveRequests.draft,
  }).from(placementRecruiterDriveRequests)
  .where(and(eq(placementRecruiterDriveRequests.collegeId,collegeId),
   or(eq(placementRecruiterDriveRequests.approvedJobId,jobId),
      eq(placementRecruiterDriveRequests.sourceJobId,jobId))))
  .orderBy(desc(placementRecruiterDriveRequests.createdAt)).limit(5);
 const previousRequestAvailable=historicalRequests.length>0;
 return {
  job:{...job,applicationDeadline:job.applicationDeadline?.toISOString()??null,
   createdAt:job.createdAt.toISOString()},
  policy,packages,reach:{eligible:reach.eligible,excluded:reach.excluded,considered:reach.candidateCount},
  byBranch:[...branches].map(([branch,v])=>({branch,eligible:v.eligible.size,applied:v.applied.size}))
   .sort((a,b)=>a.branch.localeCompare(b.branch)),
  excluded:[...excluded.values()].slice(0,100),totalExcludedDetail:excluded.size,
  recruiterContacts:companyContacts.map(x=>x.email).filter((x):x is string=>Boolean(x)),
  previousRequestAvailable,
  previousRequests:historicalRequests.map(request=>({
   id:request.id,status:request.status,decisionNote:request.decisionNote,
   createdAt:request.createdAt.toISOString(),
   proposedTitle:typeof request.draft["title"]==="string"?request.draft["title"]:null,
  })),
  closeSummary:{applications:applications.length,offers:accepted.length},
  feed:feed.map(r=>({...r,occurredAt:r.occurredAt.toISOString()})),
 };
}
