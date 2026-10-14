import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeElectives} from "./college-structure-directory-service";
import {COLLEGE_STRUCTURE_PAGE_SIZE} from "./college-structure-directory-model";
import {collectCollegeExportRows} from "./college-directory-export-model";
import {electiveCsvSchema,renderElectivesCsv,ELECTIVES_EXPORT_CAP} from "./college-elective-export-model";
export async function exportCollegeElectives(context:RequestContext,raw:unknown){
 const query=electiveCsvSchema.parse(raw);
 const result=await collectCollegeExportRows(page=>listCollegeElectives(context,{...query,page}),
  COLLEGE_STRUCTURE_PAGE_SIZE,ELECTIVES_EXPORT_CAP);
 return {...result,csv:renderElectivesCsv(result.rows,result.truncated)};
}
