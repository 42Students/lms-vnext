import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeSemesters,listCollegeBatches} from "./college-academic-directory-service";
import {COLLEGE_ACADEMIC_PAGE_SIZE} from "./college-academic-directory-model";
import {collectCollegeExportRows} from "./college-directory-export-model";
import {semesterCsvSchema,batchCsvSchema,ACADEMIC_EXPORT_CAP,renderSemesterCsv,renderBatchCsv} from "./college-academic-export-model";
export async function exportCollegeAcademicDirectory(
 context:RequestContext,kind:"SEMESTERS"|"BATCHES",raw:unknown
){
 if(kind==="BATCHES"){
  const query=batchCsvSchema.parse(raw);
  const result=await collectCollegeExportRows(page=>listCollegeBatches(context,{...query,page}),
   COLLEGE_ACADEMIC_PAGE_SIZE,ACADEMIC_EXPORT_CAP);
  return {...result,csv:renderBatchCsv(result.rows,result.truncated)};
 }

 const query=semesterCsvSchema.parse(raw);
 const result=await collectCollegeExportRows(page=>listCollegeSemesters(context,{...query,page}),
  COLLEGE_ACADEMIC_PAGE_SIZE,ACADEMIC_EXPORT_CAP);
 return {...result,csv:renderSemesterCsv(result.rows,result.truncated)};
}
