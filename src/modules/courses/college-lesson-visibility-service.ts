import "server-only";

import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,courseLearningPaths,courseLessons,courseOfferings,courses,departments} from "@/db/schema";
import {hasMembershipRole,isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {CoursesServiceError} from "./errors";
import {safeCourseVisibilityFailure} from "./bulk-visibility-failure-model";

// Registered in migration 0129. Do not use this writer with an unregistered schema.
// Metadata edits also require updatedAt millisecond CAS.
const lessonTarget=z.strictObject({
 lessonId:z.uuid(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
});
const command=lessonTarget.extend({
 visibleToStudents:z.boolean(),confirmed:z.literal(true),
});
const batch=z.strictObject({
 items:z.array(lessonTarget).min(1).max(25)
  .refine(items=>new Set(items.map(item=>item.lessonId)).size===items.length),
 visibleToStudents:z.boolean(),confirmed:z.literal(true),
});

export async function updateCollegeLessonStudentVisibility(context:RequestContext,raw:unknown){
 const input=command.parse(raw);
 const acting=await resolveActingCollege(context,"courses.manage");
 if(!isSuperAdmin(context)&&!hasMembershipRole(context,"COLLEGE_ADMIN"))
  throw new AuthorizationError("courses.manage");
 const scope={collegeId:acting.collegeId,organizationId:acting.organizationId};
 requirePermission(context,"courses.manage",scope);
 return getDb().transaction(async tx=>{
  const [lesson]=await tx.select({
   id:courseLessons.id,name:courseLessons.name,status:courseLessons.status,
   currentVisible:courseLessons.visibleToStudents,
   updatedAt:courseLessons.updatedAt,
  }).from(courseLessons)
   .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
   .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,and(eq(departments.id,courses.departmentId),
    eq(departments.collegeId,scope.collegeId)))
   .innerJoin(academicPeriods,and(eq(academicPeriods.id,courseOfferings.academicPeriodId),
    eq(academicPeriods.collegeId,scope.collegeId)))
   .where(and(eq(courseLessons.id,input.lessonId),
    eq(courseLessons.status,"ACTIVE")))
   .for("update",{of:courseLessons}).limit(1);
  if(!lesson)throw new CoursesServiceError("LESSON_NOT_FOUND");
  const persisted=await assertPersistedPlatformPermission(tx,context,"courses.manage",scope);
  if(!isSuperAdmin(persisted)&&!hasMembershipRole(persisted,"COLLEGE_ADMIN"))
   throw new AuthorizationError("courses.manage");
  const expected=Date.parse(input.expectedUpdatedAt);
  if(Math.trunc(lesson.updatedAt.getTime())!==expected)
   throw new CoursesServiceError("LESSON_STALE_VERSION");
  if(lesson.currentVisible===input.visibleToStudents)
   return {id:lesson.id,visibleToStudents:lesson.currentVisible,updatedAt:lesson.updatedAt};
  const [updated]=await tx.update(courseLessons).set({
   visibleToStudents:input.visibleToStudents,
   updatedAt:sql<Date>`greatest(${courseLessons.updatedAt} + interval '1 millisecond',clock_timestamp())`,
  }).where(and(eq(courseLessons.id,lesson.id),eq(courseLessons.status,"ACTIVE"),
   sql`date_trunc('milliseconds',${courseLessons.updatedAt}) = ${input.expectedUpdatedAt}::timestamptz`,
  )).returning({id:courseLessons.id,visibleToStudents:courseLessons.visibleToStudents,
   updatedAt:courseLessons.updatedAt});
  if(!updated)throw new CoursesServiceError("LESSON_STALE_VERSION");
  await recordActivityEventInTransaction(tx,persisted,{
   eventType:ACTIVITY_EVENT_TYPES.COURSES_LESSON_UPDATED,
   collegeId:scope.collegeId,organizationId:scope.organizationId,
   subjectType:"course_lesson",subjectId:lesson.id,subjectLabel:lesson.name,
   summary:updated.visibleToStudents?"Show to students":"Hide from students",
   metadata:{beforeVisibleToStudents:lesson.currentVisible,
    afterVisibleToStudents:updated.visibleToStudents},
  });
  return updated;
 });
}

/** Per-lesson isolation makes failed bulk requests retryable without hiding successes. */
export async function bulkCollegeLessonStudentVisibility(context:RequestContext,raw:unknown){
 const input=batch.parse(raw);
 // An unauthorized caller must not receive a successful bulk response
 // that merely embeds per-item permission errors.
 const acting=await resolveActingCollege(context,"courses.manage");
 if(!isSuperAdmin(context)&&!hasMembershipRole(context,"COLLEGE_ADMIN"))
  throw new AuthorizationError("courses.manage");
 requirePermission(context,"courses.manage",{
  collegeId:acting.collegeId,organizationId:acting.organizationId,
 });
 const changed:{id:string;visibleToStudents:boolean;updatedAt:Date}[]=[];
 const failed:{lessonId:string;reason:string}[]=[];
 for(const item of input.items){
  try {
   const saved=await updateCollegeLessonStudentVisibility(context,{
    ...item,visibleToStudents:input.visibleToStudents,confirmed:true,
   });
   changed.push(saved);
  }catch(error){
   failed.push({lessonId:item.lessonId,
    reason:safeCourseVisibilityFailure(error)});
  }
 }
 return {changed,failed};
}
