import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeSemesterCourseMappings} from "./college-mapping-service";
import {COLLEGE_MAPPING_PAGE_SIZE} from "./college-mapping-model";
import {collectCollegeExportRows} from "./college-directory-export-model";
import {offeringMappingCsvSchema,renderOfferingMappingCsv,OFFERING_MAPPING_EXPORT_CAP}
 from "./college-mapping-export-model";
export async function exportCollegeOfferingMappings(context:RequestContext,raw:unknown){
 const query=offeringMappingCsvSchema.parse(raw);
 const result=await collectCollegeExportRows(page=>listCollegeSemesterCourseMappings(context,{...query,page}),
  COLLEGE_MAPPING_PAGE_SIZE,OFFERING_MAPPING_EXPORT_CAP);
 return {...result,csv:renderOfferingMappingCsv(result.rows,result.truncated)};
}
