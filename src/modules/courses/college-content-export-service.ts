import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeContentAggregate} from "./college-content-aggregate-service";
import {COLLEGE_CONTENT_PAGE_SIZE,type CollegeContentKind} from "./college-content-aggregate-model";
import {collectCollegeExportRows} from "@/modules/academics/college-directory-export-model";
import {collegeContentCsvSchema,renderCollegeContentMetadataCsv,CONTENT_METADATA_EXPORT_CAP}
 from "./college-content-export-model";
export async function exportCollegeContentMetadata(
 context:RequestContext,kind:CollegeContentKind,raw:unknown){
 const query=collegeContentCsvSchema.parse(raw);
 const result=await collectCollegeExportRows(page=>listCollegeContentAggregate(context,kind,{...query,page}),
  COLLEGE_CONTENT_PAGE_SIZE,CONTENT_METADATA_EXPORT_CAP);
 return {...result,csv:renderCollegeContentMetadataCsv(result.rows,result.truncated)};
}
