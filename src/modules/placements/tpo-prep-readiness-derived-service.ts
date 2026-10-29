import "server-only";
import {and,eq,inArray,isNotNull,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 colleges,courses,departments,courseOfferings,courseLearningPaths,courseLessons,
 lessonContents,learnerContentProgress,collegeMemberships,membershipRoles,users,
 learnerProgramEnrollments,cohorts as cohortTable,programs,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoPrepReadiness} from "./tpo-configuration-read-service";
import {getTpoCommunicationSettings} from "./tpo-communication-settings-service";
import {requireTpoBatchActor} from "./tpo-batch-workspace-read-service";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {validateTpoPrepLearnerPairs,hasEveryScopedTpoPrepLearner} from "./tpo-prep-learner-scope-model";
import {tpoPrepConfigSchema} from "./tpo-configuration-model";
import {
 deriveTpoPrepCourseOutcome,type TpoPrepCourseOutcome,type TpoPrepCourseEvidence,
} from "./tpo-prep-readiness-derivation";

type Learner={membershipId:string;cohortId:string};
export async function readTpoLearnerPrepOutcomes(
 context:RequestContext,collegeId:string,learners:readonly Learner[],
):Promise<{available:boolean;outcomes:ReadonlyMap<string,TpoPrepCourseOutcome>}>{
 // Never trust a caller-selected college ID. In particular an empty
 // learners array must not silently turn a revoked or foreign role into a
 // successful-looking cross-tenant result.
 const scopedCollegeId=await requireTpoBatchActor(context);
 if(scopedCollegeId!==collegeId)throw new AuthorizationError("placements.manage");
 const outcomes=new Map<string,TpoPrepCourseOutcome>();
 if(!learners.length)return {available:true,outcomes};
 const requested=validateTpoPrepLearnerPairs(learners);
 if(!requested)throw new AuthorizationError("placements.read");
 const db=getDb();
 // A role may have been revoked while lengthy learner-progress queries run.
 // Return only after validating the active tenant and persisted actor under
 // SHARE locks; unavailable and unconfigured results must also be checked.
 const deliver=async(available:boolean)=>db.transaction(async tx=>{
  const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("placements.read");
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId,organizationId:college.organizationId,
  });
  return {available,outcomes};
 });
 // A caller-supplied membership ID is never evidence of college ownership.
 // Require the actual learner role, active platform identity, active college
 // membership and recorded (active or completed) matching cohort enrollment.
 const enrolled=await db.select({
  membershipId:learnerProgramEnrollments.membershipId,
  cohortId:learnerProgramEnrollments.cohortId,
 }).from(learnerProgramEnrollments)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER"),
  ))
  .innerJoin(cohortTable,eq(cohortTable.id,learnerProgramEnrollments.cohortId))
  .innerJoin(programs,and(eq(programs.id,learnerProgramEnrollments.programId),
   eq(cohortTable.programId,programs.id)))
  .innerJoin(departments,eq(departments.id,programs.departmentId))
  .where(and(
   eq(collegeMemberships.collegeId,collegeId),
   eq(departments.collegeId,collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
   inArray(learnerProgramEnrollments.status,["ACTIVE","COMPLETED"]),
   inArray(learnerProgramEnrollments.membershipId,requested.membershipIds),
   inArray(learnerProgramEnrollments.cohortId,requested.cohortIds),
  )).limit(5001);
 if(!hasEveryScopedTpoPrepLearner(learners,enrolled))
  throw new AuthorizationError("placements.read");
 // Both settings reads revalidate persisted TPO scope. Unavailable storage or
 // malformed saved policy never turns missing data into an "unprepared" judgment.
 const [stored,communication]=await Promise.all([
  getTpoPrepReadiness(context),getTpoCommunicationSettings(context),
 ]);
 const config=tpoPrepConfigSchema.safeParse(stored.config);
 if(!stored.ready||!communication.ready||!config.success)return deliver(false);
 const ids=config.data.courseIds;
 if(!ids.length){
  for(const row of learners)outcomes.set(row.membershipId,"UNCONFIGURED");
  return deliver(true);
 }
 // The prep catalogue is organization-scoped, while learner membership,
 // cohort and content-progress checks remain scoped to this college.
 // Resolve the active owning organization from persisted state, not a
 // possibly stale request-context organization ID.
 const [scope]=await db.select({organizationId:colleges.organizationId})
   .from(colleges).where(and(eq(colleges.id,collegeId),
     eq(colleges.status,"ACTIVE"))).limit(1);
 if(!scope)return deliver(false);
 const requestedCohortIds=requested.cohortIds;
 const contents=await db.select({
  courseId:courseOfferings.courseId,
  cohortId:courseOfferings.cohortId,
  contentId:lessonContents.id,
 }).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .innerJoin(colleges,eq(colleges.id,departments.collegeId))
  .where(and(
   eq(colleges.organizationId,scope.organizationId),
   eq(colleges.status,"ACTIVE"),
   isNull(departments.archivedAt),
   eq(courses.status,"ACTIVE"),
   eq(courses.enabled,true),
   isNull(courses.deletedAt),
   eq(courseOfferings.status,"ACTIVE"),
   eq(courseLearningPaths.status,"PUBLISHED"),
   eq(courseLessons.status,"ACTIVE"),
   eq(courseLessons.visibleToStudents,true),
   eq(lessonContents.status,"PUBLISHED"),
   eq(lessonContents.visibleToStudents,true),
   inArray(courseOfferings.courseId,ids),
   inArray(courseOfferings.cohortId,requestedCohortIds),
  )).limit(5001);
 if(contents.length>5000)return deliver(false);
 const contentIds=[...new Set(contents.map(row=>row.contentId))];
 const complete=new Set<string>();
 if(contentIds.length){
  // Bounded database requests avoid a giant membership x content query.
  for(let offset=0;offset<learners.length;offset+=250){
   const memberIds=[...new Set(learners.slice(offset,offset+250).map(row=>row.membershipId))];
   const rows=await db.select({membershipId:learnerContentProgress.membershipId,
     contentId:learnerContentProgress.lessonContentId})
    .from(learnerContentProgress)
    .where(and(inArray(learnerContentProgress.membershipId,memberIds),
     inArray(learnerContentProgress.lessonContentId,contentIds),
     isNotNull(learnerContentProgress.completedAt)));
   for(const row of rows)complete.add(row.membershipId+":"+row.contentId);
  }
 }
 const byCohort=new Map<string,Map<string,Set<string>>>();
 for(const row of contents){
  const coursesForCohort=byCohort.get(row.cohortId)??new Map<string,Set<string>>();
  const contentsForCourse=coursesForCohort.get(row.courseId)??new Set<string>();
  contentsForCourse.add(row.contentId);
  coursesForCohort.set(row.courseId,contentsForCourse);
  byCohort.set(row.cohortId,coursesForCohort);
 }
 for(const row of learners){
  const evidence:TpoPrepCourseEvidence[]=ids.map(courseId=>{
   const content=byCohort.get(row.cohortId)?.get(courseId);
   return {courseId,totalContent:content?.size??0,
    completedContent:content?[...content].filter(id=>complete.has(row.membershipId+":"+id)).length:0};
  });
  outcomes.set(row.membershipId,deriveTpoPrepCourseOutcome({
   courseIds:ids,minimumCompleted:config.data.minimumCompleted,
   progressThresholdPct:communication.prepThresholdPct,
  },evidence));
 }
 return deliver(true);
}
