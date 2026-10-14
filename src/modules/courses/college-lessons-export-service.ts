import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeLessons} from "./college-learning-directory-service";
import {COLLEGE_LEARNING_PAGE_SIZE} from "./college-learning-directory-model";
import {collectCollegeExportRows} from "@/modules/academics/college-directory-export-model";
import {lessonsCsvSchema,renderLessonsCsv,LESSONS_EXPORT_CAP} from "./college-lessons-export-model";
export async function exportCollegeLessons(context:RequestContext,raw:unknown){
 const query=lessonsCsvSchema.parse(raw);
 const result=await collectCollegeExportRows(page=>listCollegeLessons(context,{...query,page}),
  COLLEGE_LEARNING_PAGE_SIZE,LESSONS_EXPORT_CAP);
 return {...result,csv:renderLessonsCsv(result.rows,result.truncated)};
}
