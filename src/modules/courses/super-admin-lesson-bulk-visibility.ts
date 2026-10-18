import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {academicPeriods,courseLessons,courseLearningPaths,courseOfferings,courses,departments,lessonContents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {updateCollegeContentStudentVisibility} from "./college-content-visibility-service";
import {safeCourseVisibilityFailure} from "./bulk-visibility-failure-model";

const inputSchema=z.strictObject({
 lessonIds:z.array(z.uuid()).min(1).max(25).refine(ids=>new Set(ids).size===ids.length),
 visibleToStudents:z.boolean(),confirmed:z.literal(true),
});
export async function bulkSuperAdminLessonVisibility(context:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw);
 const acting=await resolveActingCollege(context,"courses.manage");
 const rows=await getDb().select({
  id:lessonContents.id,lessonId:courseLessons.id,status:lessonContents.status,
  visible:lessonContents.visibleToStudents,updatedAt:lessonContents.updatedAt,
 }).from(lessonContents)
 .innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
 .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,eq(departments.id,courses.departmentId))
 .innerJoin(academicPeriods,eq(academicPeriods.id,courseOfferings.academicPeriodId))
 .where(and(inArray(lessonContents.lessonId,input.lessonIds),
   // An item under a draft path or archived ancestor is not currently
   // student-published: retain its authored visibility until published.
   eq(courseLearningPaths.status,"PUBLISHED"),
   eq(courseLessons.status,"ACTIVE"),
   eq(courseOfferings.status,"ACTIVE"),
   eq(courses.status,"ACTIVE"),
   eq(departments.collegeId,acting.collegeId),
   eq(academicPeriods.collegeId,acting.collegeId)))
 .limit(501);
 if(rows.length>500)throw new Error("LESSON_CONTENT_BULK_TOO_LARGE");
 const changed:string[]=[],failures:{id:string;lessonId:string;reason:string}[]=[];
 for(const row of rows){
  // Bulk course/lesson Show/Hide applies to currently published content only.
  // Draft and archived content retain their authored visibility for a later publication.
  if(row.status!=="PUBLISHED"||row.visible===input.visibleToStudents)continue;
  try{
   await updateCollegeContentStudentVisibility(context,{
    lessonContentId:row.id,visibleToStudents:input.visibleToStudents,
    expectedUpdatedAt:row.updatedAt.toISOString(),confirmed:true,
   });
   changed.push(row.id);
  }catch(error){failures.push({id:row.id,lessonId:row.lessonId,reason:safeCourseVisibilityFailure(error)});}
 }
 return {selectedLessons:input.lessonIds.length,matchedContents:rows.length,changed:changed.length,unchanged:rows.length-changed.length-failures.length,failures};
}
