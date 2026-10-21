import "server-only";
import {and,eq,inArray,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,courseLessons,courseLearningPaths,courseOfferings,courses,departments,lessonContents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {bulkSuperAdminLessonVisibility} from "./super-admin-lesson-bulk-visibility";
import {safeCourseVisibilityFailure} from "./bulk-visibility-failure-model";
import {CoursesServiceError} from "./errors";

export const superAdminCourseBulkSchema=z.strictObject({
 courseIds:z.array(z.uuid()).min(1).max(100).refine(ids=>new Set(ids).size===ids.length),
 visibleToStudents:z.preprocess(value=>value===0?false:value===1?true:value,z.boolean()),
 confirmed:z.literal(true),
});

/** Legacy learner visibility is independent of archival: update courses.enabled
 * alongside published descendants. A hidden course stays ACTIVE for admins,
 * but no longer appears in the learner catalogue or opens via a bookmarked
 * learner workspace URL. Never treat a visibility operation as deletion. */
export async function bulkSuperAdminCourseVisibility(context:RequestContext,raw:unknown){
 const input=superAdminCourseBulkSchema.parse(raw);
 const limit=Number(process.env.COURSE_BULK_STATUS_MAX??"100");
 const allowed=Number.isSafeInteger(limit)?Math.min(100,Math.max(1,limit)):100;
 if(input.courseIds.length>allowed)
  throw new CoursesServiceError("COURSE_VISIBILITY_BULK_TOO_LARGE");
 const acting=await resolveActingCollege(context,"courses.manage");
 const selected=await getDb().select({id:courses.id}).from(courses)
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(and(inArray(courses.id,input.courseIds),eq(departments.collegeId,acting.collegeId),
   eq(courses.status,"ACTIVE")));
 if(selected.length!==input.courseIds.length)throw new CoursesServiceError("COURSE_NOT_FOUND");
 const lessons=await getDb().select({id:courseLessons.id,courseId:courses.id})
  .from(courseLessons)
  .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
  .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
  .innerJoin(academicPeriods,eq(academicPeriods.id,courseOfferings.academicPeriodId))
  .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
  .innerJoin(departments,eq(departments.id,courses.departmentId))
  .where(and(inArray(courses.id,input.courseIds),eq(departments.collegeId,acting.collegeId),
   eq(academicPeriods.collegeId,acting.collegeId),
   eq(courses.status,"ACTIVE"),eq(courseOfferings.status,"ACTIVE"),
   eq(courseLearningPaths.status,"PUBLISHED"),eq(courseLessons.status,"ACTIVE")))
  .limit(501);
 if(lessons.length>500)throw new CoursesServiceError("COURSE_VISIBILITY_BULK_TOO_LARGE");
 const ids=[...new Set(lessons.map(row=>row.id))];
 const lessonCourseIds=new Map(lessons.map(row=>[row.id,row.courseId]));
 const failedCourses=new Set<string>();
 const failures:{id:string;reason:string}[]=[];
 const [{total:matchedContents}]=await getDb().select({
  total:sql<number>`count(*)::int`,
 }).from(lessonContents).where(and(
  inArray(lessonContents.lessonId,ids),
  eq(lessonContents.status,"PUBLISHED"),
 ));
 let changed=0,unchanged=0,changedCourses=0;
 // Persist the course-level gate as well as lesson visibility. Hiding comes
 // first (fail closed); showing comes last, only after the descendant batch
 // succeeded. Each row is rechecked and locked under the acting tenant.
 async function setCourseVisibility(courseIds:readonly string[],enabled:boolean){
  for(const courseId of courseIds){
   try{
    const wasChanged=await getDb().transaction(async tx=>{
     const [course]=await tx.select({id:courses.id,enabled:courses.enabled})
      .from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
      .where(and(eq(courses.id,courseId),eq(courses.status,"ACTIVE"),
       eq(departments.collegeId,acting.collegeId)))
      .for("update",{of:courses}).limit(1);
     if(!course)throw new CoursesServiceError("COURSE_NOT_FOUND");
     await assertPersistedPlatformPermission(tx,context,"courses.manage",{
      collegeId:acting.collegeId,organizationId:acting.organizationId,
     });
     if(course.enabled===enabled)return false;
     await tx.update(courses).set({enabled,
      version:sql`${courses.version}+1`,updatedAt:new Date(),
     }).where(eq(courses.id,courseId));
     return true;
    });
    if(wasChanged)changedCourses++;
   }catch{
    failedCourses.add(courseId);
    failures.push({id:courseId,reason:"Course visibility could not be saved. Refresh and retry."});
   }
  }
 }
 if(!input.visibleToStudents)await setCourseVisibility(input.courseIds,false);
 for(let i=0;i<ids.length;i+=25){
  const slice=ids.slice(i,i+25);
  try{
   const report=await bulkSuperAdminLessonVisibility(context,{
    lessonIds:slice,visibleToStudents:input.visibleToStudents,confirmed:true,
   });
   changed+=report.changed;unchanged+=report.unchanged;
   for(const failure of report.failures){
    const courseId=lessonCourseIds.get(failure.lessonId);
    if(courseId)failedCourses.add(courseId);
    failures.push(failure);
   }
  }catch(error){
   const reason=safeCourseVisibilityFailure(error);
   for(const id of slice){
    failures.push({id,reason});
    const courseId=lessonCourseIds.get(id);
    if(courseId)failedCourses.add(courseId);
   }
  }
 }
 if(input.visibleToStudents)
  await setCourseVisibility(input.courseIds.filter(id=>!failedCourses.has(id)),true);
 return {operation:"COURSE_AND_PUBLISHED_CONTENT_VISIBILITY" as const,
  selectedCourses:selected.length,matchedLessons:ids.length,
  matchedContents,changed,unchanged,changedCourses,failures,
  failedCourseIds:input.courseIds.filter(id=>failedCourses.has(id))};
}
