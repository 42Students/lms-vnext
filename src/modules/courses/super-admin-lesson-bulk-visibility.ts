import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,courseLessons,courseLearningPaths,courseOfferings,courses,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEvent} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {CoursesServiceError} from "./errors";

// Legacy active and enabled are independent lesson-level switches. Keep the
// visibility-only input as an alias for callers that already use this endpoint.
const inputSchema=z.strictObject({
 lessonIds:z.array(z.string()).min(1,"lessonIds is required and must not be empty")
  .max(25,"Maximum 25 lessons per bulk update"),
 active:z.boolean().nullable().optional(),
 enabled:z.boolean().nullable().optional(),
 visibleToStudents:z.boolean().optional(),
 expectedVersions:z.record(z.string(),z.number().int().nonnegative()).optional(),
 confirmed:z.literal(true).optional(),
}).superRefine((input,ctx)=>{
 if(input.active==null&&input.enabled==null&&input.visibleToStudents===undefined)
  ctx.addIssue({code:"custom",path:["active"],message:"Set at least one of active or enabled"});
 if(input.enabled!=null&&input.visibleToStudents!==undefined&&input.enabled!==input.visibleToStudents)
  ctx.addIssue({code:"custom",path:["enabled"],message:"Conflicting enabled and visibleToStudents values"});
});

type LessonFailure={lessonId:string;reason:string};

/** Each row is independently transactional: invalid, missing, stale or
 * inaccessible lessons cannot prevent authorized siblings from being saved. */
export async function bulkSuperAdminLessonVisibility(context:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw);
 const acting=await resolveActingCollege(context,"courses.manage");
 const failed:LessonFailure[]=[];
 const updatedLessons:string[]=[];
 const changedLessons:string[]=[];
 const seen=new Set<string>();
 const enabled=input.enabled??input.visibleToStudents;
 for(const lessonId of input.lessonIds){
  if(!z.uuid().safeParse(lessonId).success){
   failed.push({lessonId,reason:"Invalid lesson id"});continue;
  }
  if(seen.has(lessonId)){
   failed.push({lessonId,reason:"Duplicate lesson id"});continue;
  }
  seen.add(lessonId);
  try{
   const result=await getDb().transaction(async tx=>{
    const [lesson]=await tx.select({
     id:courseLessons.id,name:courseLessons.name,sequence:courseLessons.sequence,
     status:courseLessons.status,visible:courseLessons.visibleToStudents,
     version:courseLessons.version,
    }).from(courseLessons)
     .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
     .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
     .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
     .innerJoin(departments,eq(departments.id,courses.departmentId))
     .innerJoin(academicPeriods,eq(academicPeriods.id,courseOfferings.academicPeriodId))
     .where(and(eq(courseLessons.id,lessonId),
      eq(departments.collegeId,acting.collegeId),
      eq(academicPeriods.collegeId,acting.collegeId),
      eq(courseOfferings.status,"ACTIVE"),
      eq(courses.status,"ACTIVE"),
      sql`${courseLessons.deletedAt} IS NULL`,
      sql`${courses.deletedAt} IS NULL`))
     .for("update",{of:courseLessons}).limit(1);
    if(!lesson)throw new CoursesServiceError("LESSON_NOT_FOUND");
    // Check persisted actor membership/role under the same transaction lock.
    const persisted=await assertPersistedPlatformPermission(tx,context,"courses.manage",{
     collegeId:acting.collegeId,organizationId:acting.organizationId,
    });
    const expected=input.expectedVersions?.[lessonId];
    if(expected!==undefined&&lesson.version!==expected)
     throw new CoursesServiceError("LESSON_STALE_VERSION");
    const targetStatus=input.active==null?lesson.status:(input.active?"ACTIVE":"ARCHIVED");
    const targetVisibility=enabled==null?lesson.visible:enabled;
    if(targetStatus===lesson.status&&targetVisibility===lesson.visible)
     return {changed:false,actor:persisted};
    // Preserve name/sequence/parent metadata; CAS fences an edit that raced
    // with this batch and increments the lesson's own optimistic token.
    const [updated]=await tx.update(courseLessons).set({
     status:targetStatus,visibleToStudents:targetVisibility,
     version:sql`${courseLessons.version}+1`,
     updatedAt:sql<Date>`greatest(${courseLessons.updatedAt} + interval '1 millisecond',clock_timestamp())`,
    }).where(and(eq(courseLessons.id,lesson.id),eq(courseLessons.version,lesson.version)))
     .returning({id:courseLessons.id});
    if(!updated)throw new CoursesServiceError("LESSON_STALE_VERSION");
    return {changed:true,actor:persisted};
   });
   updatedLessons.push(lessonId);
   if(result.changed)changedLessons.push(lessonId);
  }catch(error){
   failed.push({lessonId,reason:error instanceof CoursesServiceError&&error.code==="LESSON_STALE_VERSION"
    ?"Lesson was updated by someone else. Refresh and retry."
    :error instanceof CoursesServiceError&&error.code==="LESSON_NOT_FOUND"
    ?"Lesson not found or not accessible"
    :"Lesson could not be updated. Refresh and retry."});
  }
 }
 // One batch-level activity event, rather than an event per content item.
 // The audit references the acting college, original request and all failures.
 if(updatedLessons.length){
  await recordActivityEvent(context,{
   eventType:ACTIVITY_EVENT_TYPES.COURSES_LESSON_UPDATED,
   organizationId:acting.organizationId,collegeId:acting.collegeId,
   subjectType:"course_lesson_bulk",subjectId:acting.collegeId,
   summary:"LESSON_BULK_STATUS_UPDATE",
   metadata:{requested:input.lessonIds.length,updated:updatedLessons.length,
    failed:failed.length,lessonIds:updatedLessons,changed:changedLessons.length,
    active:input.active??null,enabled:enabled??null},
  });
 }
 const message=`Updated ${updatedLessons.length} of ${input.lessonIds.length} lesson(s)`;
 return {requested:input.lessonIds.length,updatedCount:updatedLessons.length,
  failed,message,selectedLessons:input.lessonIds.length,
  changed:changedLessons.length,unchanged:updatedLessons.length-changedLessons.length,
  failures:failed.map(item=>({id:item.lessonId,...item}))};
}
