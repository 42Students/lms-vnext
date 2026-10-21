import "server-only";
import {and,eq,inArray,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,activityEvents,collegeMemberships,colleges,courseLearningPaths,
 courseLessons,courseOfferings,courses,departments,learnerContentProgress,
 lessonContents,membershipRoles,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {CoursesServiceError} from "./errors";

const base=z.strictObject({offeringId:z.uuid(),membershipId:z.uuid()});
const command=base.extend({
 confirmed:z.literal(true),
 expectedAttempt:z.number().int().min(0).max(1_000_000),
});
export class CourseProgressRetakeError extends Error{
 constructor(readonly code:"NO_COURSE_CONTENT"|"RETAKE_STALE"|"RETAKE_TOO_MANY_ITEMS"){
  super(code);this.name="CourseProgressRetakeError";
 }
}
type Tx=Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

async function readRetakeScope(tx:Tx,ctx:RequestContext,offeringId:string,membershipId:string){
 if(!isSuperAdmin(ctx)||ctx.user.platformStatus!=="ACTIVE"||!ctx.adminScope?.collegeId)
  throw new AuthorizationError("courses.manage");
 const collegeId=ctx.adminScope.collegeId;
 const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
  .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
 if(!college||college.status!=="ACTIVE"||
    (ctx.adminScope.organizationId&&college.organizationId!==ctx.adminScope.organizationId))
  throw new AuthorizationError("courses.manage");
 requirePermission(ctx,"courses.manage",{collegeId,organizationId:college.organizationId});
 await assertPersistedPlatformPermission(tx,ctx,"courses.manage",{
  collegeId,organizationId:college.organizationId,
 });
 const [offering]=await tx.select({courseId:courseOfferings.courseId})
  .from(courseOfferings)
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .innerJoin(academicPeriods,eq(academicPeriods.id,courseOfferings.academicPeriodId))
  .where(and(eq(courseOfferings.id,offeringId),
   eq(departments.collegeId,collegeId),eq(academicPeriods.collegeId,collegeId)))
  .limit(1);
 if(!offering)throw new AuthorizationError("courses.manage");
 const [learner]=await tx.select({id:collegeMemberships.id})
  .from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,membershipId),
    eq(collegeMemberships.collegeId,collegeId),
    eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
  .limit(1);
 if(!learner)throw new AuthorizationError("courses.manage");
 const rows=await tx.selectDistinct({
  id:lessonContents.id,durationSeconds:lessonContents.durationSeconds,
 }).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
  .where(and(eq(courseOfferings.courseId,offering.courseId),
    eq(courseLearningPaths.status,"PUBLISHED"),
    eq(courseLessons.status,"ACTIVE"),
    eq(lessonContents.status,"PUBLISHED")))
  .limit(1001);
 if(rows.length>1000)throw new CourseProgressRetakeError("RETAKE_TOO_MANY_ITEMS");
 if(rows.length===0)throw new CourseProgressRetakeError("NO_COURSE_CONTENT");
 const ids=rows.map(row=>row.id);
 const [maxRow]=await tx.select({attempt:sql<number>`max(${learnerContentProgress.attempt})::integer`})
  .from(learnerContentProgress).where(and(
    eq(learnerContentProgress.membershipId,membershipId),
    inArray(learnerContentProgress.lessonContentId,ids)));
 const currentAttempt=Number(maxRow?.attempt??0);
 return {collegeId,organizationId:college.organizationId,courseId:offering.courseId,
  content:rows,currentAttempt};
}

/** Preview never changes content or progress. */
export async function previewAdminCourseProgressRetake(ctx:RequestContext,raw:unknown){
 const input=base.parse(raw);
 return getDb().transaction(async tx=>{
  const scope=await readRetakeScope(tx,ctx,input.offeringId,input.membershipId);
  return {attempt:scope.currentAttempt||1,contentItems:scope.content.length,
   alreadyFresh:scope.currentAttempt===0};
 });
}

/** Explicit admin-only retake. Prior attempts stay immutable, and a CAS
 * expectedAttempt prevents double-clicks and stale clients starting multiple
 * attempts. The learner's in-flight older save cannot update the latest
 * attempt because learner progress writers compare MAX(attempt). */
export async function startAdminCourseProgressRetake(ctx:RequestContext,raw:unknown){
 const input=command.parse(raw);
 return getDb().transaction(async tx=>{
  // Serializes the same learner + course across admin sessions.
  const key="course-retake:"+input.offeringId+":"+input.membershipId;
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${key}), 70304)`);
  const scope=await readRetakeScope(tx,ctx,input.offeringId,input.membershipId);
  if(scope.currentAttempt!==input.expectedAttempt)
   throw new CourseProgressRetakeError("RETAKE_STALE");
  if(scope.currentAttempt===0)
   return {attempt:1,previousAttempt:0,contentItemsReset:0,alreadyFresh:true};
  const next=scope.currentAttempt+1;
  if(next>1_000_000)throw new CourseProgressRetakeError("RETAKE_STALE");
  const inserted=await tx.insert(learnerContentProgress).values(
   scope.content.map(row=>({
    membershipId:input.membershipId,lessonContentId:row.id,
    attempt:next,lastPositionSeconds:0,durationSeconds:row.durationSeconds??0,
    completedAt:null,firstCompletedAt:null,
   }))
  ).onConflictDoNothing().returning({id:learnerContentProgress.id});
  if(inserted.length!==scope.content.length)
   throw new CourseProgressRetakeError("RETAKE_STALE");
  await tx.insert(activityEvents).values({
   module:"COURSES",eventType:"COURSES_LEARNER_PROGRESS_RETAKE_STARTED",
   organizationId:scope.organizationId,collegeId:scope.collegeId,
   actorUserId:ctx.user.id,actorMembershipId:ctx.membership?.collegeId===scope.collegeId
     ?ctx.membership.id:null,
   subjectType:"course",subjectId:scope.courseId,
   summary:"Learner course content attempt started",
   metadata:{offeringId:input.offeringId,membershipId:input.membershipId,
    previousAttempt:scope.currentAttempt,newAttempt:next,
    contentItemsReset:inserted.length},
  });
  return {attempt:next,previousAttempt:scope.currentAttempt,
   contentItemsReset:inserted.length,alreadyFresh:false};
 });
}
