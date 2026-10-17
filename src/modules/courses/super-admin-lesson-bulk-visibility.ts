import "server-only";
import {eq,inArray} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courseLessons,lessonContents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {updateCollegeContentStudentVisibility} from "./college-content-visibility-service";

const inputSchema=z.strictObject({
 lessonIds:z.array(z.uuid()).min(1).max(25).refine(ids=>new Set(ids).size===ids.length),
 visibleToStudents:z.boolean(),confirmed:z.literal(true),
});
export async function bulkSuperAdminLessonVisibility(context:RequestContext,raw:unknown){
 const input=inputSchema.parse(raw);
 await resolveActingCollege(context,"courses.manage");
 const rows=await getDb().select({
  id:lessonContents.id,lessonId:courseLessons.id,status:lessonContents.status,
  visible:lessonContents.visibleToStudents,updatedAt:lessonContents.updatedAt,
 }).from(lessonContents).innerJoin(courseLessons,eq(courseLessons.id,lessonContents.lessonId))
 .where(inArray(lessonContents.lessonId,input.lessonIds)).limit(501);
 if(rows.length>500)throw new Error("LESSON_CONTENT_BULK_TOO_LARGE");
 const changed:string[]=[],failures:{id:string;reason:string}[]=[];
 for(const row of rows){
  if(row.status==="ARCHIVED"||row.visible===input.visibleToStudents)continue;
  try{
   await updateCollegeContentStudentVisibility(context,{
    lessonContentId:row.id,visibleToStudents:input.visibleToStudents,
    expectedUpdatedAt:row.updatedAt.toISOString(),confirmed:true,
   });
   changed.push(row.id);
  }catch(error){failures.push({id:row.id,reason:error instanceof Error?error.message:"VISIBILITY_UPDATE_FAILED"});}
 }
 return {selectedLessons:input.lessonIds.length,matchedContents:rows.length,changed:changed.length,unchanged:rows.length-changed.length-failures.length,failures};
}
