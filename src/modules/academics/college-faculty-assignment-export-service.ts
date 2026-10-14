import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeFacultyAssignments} from "./college-mapping-service";
import {COLLEGE_MAPPING_PAGE_SIZE} from "./college-mapping-model";
import {collectCollegeExportRows} from "./college-directory-export-model";
import {facultyAssignmentCsvSchema,renderFacultyAssignmentCsv,FACULTY_ASSIGNMENT_EXPORT_CAP}
 from "./college-faculty-assignment-export-model";
export async function exportCollegeFacultyAssignments(context:RequestContext,raw:unknown){
 const query=facultyAssignmentCsvSchema.parse(raw);
 const result=await collectCollegeExportRows(page=>listCollegeFacultyAssignments(context,{...query,page}),
  COLLEGE_MAPPING_PAGE_SIZE,FACULTY_ASSIGNMENT_EXPORT_CAP);
 return {...result,csv:renderFacultyAssignmentCsv(result.rows,result.truncated)};
}
