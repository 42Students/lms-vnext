import "server-only";
import {and,eq,inArray,isNull,or,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,activityEvents,collegeMemberships,colleges,courseLearningPaths,
 courseLessons,courseOfferings,courses,departments,learnerContentProgress,
 lessonContents,membershipRoles,users,sectionEnrollments,
 learnerProgramEnrollments,sections,courseSectionDeliveries,electiveOfferings,
 electiveSlots,lmsGroupMembers,lmsGroups} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";

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
 // College Admin may start a retake only in their active college.
 // Super Admin must explicitly act in one selected college.
 const superAdmin=isSuperAdmin(ctx);
 const collegeId=superAdmin?ctx.adminScope?.collegeId:
  ctx.membership?.status==="ACTIVE"&&ctx.membership.roles.includes("COLLEGE_ADMIN")
   ?ctx.membership.collegeId:null;
 if(ctx.user.platformStatus!=="ACTIVE"||!collegeId)
  throw new AuthorizationError("courses.manage");
 const [college]=await tx.select({organizationId:colleges.organizationId,status:colleges.status})
  .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
 if(!college||college.status!=="ACTIVE"||
    (superAdmin&&ctx.adminScope?.organizationId&&
     college.organizationId!==ctx.adminScope.organizationId))
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
 // Being a learner in the SAME college is not enough to authorize a
 // course-wide retake. The learner must also be an active member of a
 // delivery for this exact offering. An elective-backed delivery uses its
 // group roster exclusively and must never fall back to the host section.
 const sectionRoster=await tx.select({id:courseSectionDeliveries.id})
  .from(courseSectionDeliveries)
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
  .innerJoin(sections,and(
   eq(sections.id,courseSectionDeliveries.sectionId),
   eq(sections.cohortId,courseOfferings.cohortId),
   eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
   eq(sections.status,"ACTIVE")))
  .innerJoin(sectionEnrollments,and(
   eq(sectionEnrollments.sectionId,sections.id),
   eq(sectionEnrollments.academicPeriodId,courseOfferings.academicPeriodId),
   eq(sectionEnrollments.status,"ACTIVE")))
  .innerJoin(learnerProgramEnrollments,and(
   eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId),
   eq(learnerProgramEnrollments.membershipId,membershipId),
   eq(learnerProgramEnrollments.cohortId,courseOfferings.cohortId),
   eq(learnerProgramEnrollments.status,"ACTIVE")))
  .where(and(
   eq(courseSectionDeliveries.offeringId,offeringId),
   isNull(courseSectionDeliveries.endedAt),
   sql`not exists (select 1 from elective_offerings eo
     where eo.backed_delivery_id = ${courseSectionDeliveries.id})`,
  )).limit(1001);
 const electiveRoster=await tx.select({id:courseSectionDeliveries.id})
   .from(courseSectionDeliveries)
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseSectionDeliveries.offeringId))
   .innerJoin(electiveOfferings,and(
    eq(electiveOfferings.backedDeliveryId,courseSectionDeliveries.id),
    eq(electiveOfferings.status,"ACTIVE"),
    isNull(electiveOfferings.deletedAt),
    eq(electiveOfferings.courseId,courseOfferings.courseId)))
   .innerJoin(electiveSlots,and(
    eq(electiveSlots.id,electiveOfferings.slotId),
    eq(electiveSlots.collegeId,collegeId),
    eq(electiveSlots.status,"ACTIVE"),
    isNull(electiveSlots.deletedAt)))
   .innerJoin(lmsGroups,and(
    eq(lmsGroups.id,electiveOfferings.groupId),
    eq(lmsGroups.collegeId,collegeId),
    eq(lmsGroups.kind,"ELECTIVE"),
    eq(lmsGroups.status,"ACTIVE"),
    isNull(lmsGroups.deletedAt)))
   .innerJoin(lmsGroupMembers,and(
    eq(lmsGroupMembers.groupId,lmsGroups.id),
    eq(lmsGroupMembers.membershipId,membershipId),
    eq(lmsGroupMembers.memberType,"LEARNER"),
    eq(lmsGroupMembers.state,"ACTIVE")))
   .innerJoin(learnerProgramEnrollments,and(
    eq(learnerProgramEnrollments.membershipId,membershipId),
    eq(learnerProgramEnrollments.programId,electiveSlots.programId),
    eq(learnerProgramEnrollments.status,"ACTIVE")))
   .where(and(
    eq(courseSectionDeliveries.offeringId,offeringId),
    isNull(courseSectionDeliveries.endedAt),
    sql`(${electiveSlots.academicPeriodId} is null or
      ${electiveSlots.academicPeriodId} = ${courseOfferings.academicPeriodId})`,
   )).limit(1001);
 const eligibleDeliveryIds=[...new Set([...sectionRoster,...electiveRoster].map(row=>row.id))];
 if(eligibleDeliveryIds.length===0)
  throw new AuthorizationError("courses.manage");
 if(sectionRoster.length>1000||electiveRoster.length>1000||
    eligibleDeliveryIds.length>1000)
  throw new CourseProgressRetakeError("RETAKE_TOO_MANY_ITEMS");
 // A learner's retake never creates records for another Section of the same
 // Course Offering. Shared content is eligible alongside exactly the active
 // Section/elective delivery content that the learner can currently see.
 const rows=await tx.selectDistinct({
  id:lessonContents.id,durationSeconds:lessonContents.durationSeconds,
 }).from(lessonContents)
  .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
  .where(and(eq(courseOfferings.id,offeringId),
    or(isNull(lessonContents.deliveryId),
       inArray(lessonContents.deliveryId,eligibleDeliveryIds)),
    eq(courseLearningPaths.status,"PUBLISHED"),
    eq(courseLessons.status,"ACTIVE"),
    eq(courseLessons.visibleToStudents,true),
    eq(lessonContents.status,"PUBLISHED"),
    eq(lessonContents.visibleToStudents,true),
    eq(lessonContents.deletedWithLesson,false),
    sql`${courseLessons.deletedAt} IS NULL`,
    sql`${lessonContents.deletedAt} IS NULL`))
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
