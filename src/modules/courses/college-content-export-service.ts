import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {listCollegeContentAggregate} from "./college-content-aggregate-service";
import {COLLEGE_CONTENT_PAGE_SIZE,type CollegeContentKind} from "./college-content-aggregate-model";
import {collectCollegeExportRows} from "@/modules/academics/college-directory-export-model";
import {collegeContentCsvSchema,renderCollegeContentMetadataCsv,renderCollegeLiveClassCsv,CONTENT_METADATA_EXPORT_CAP}
 from "./college-content-export-model";
export async function exportCollegeContentMetadata(
 context:RequestContext,kind:CollegeContentKind,raw:unknown){
 const query=collegeContentCsvSchema.parse(raw);
 const result=await collectCollegeExportRows(page=>listCollegeContentAggregate(context,kind,
  kind==="LIVE_CLASS" ? {
    q:query.q,courseCode:query.courseCode,status:query.status,scope:query.scope,
    view:query.view,from:query.from,to:query.to,page,
  } : {
    q:query.q,courseCode:query.courseCode,programCode:query.programCode,status:query.status,
    format:query.format,scope:query.scope,visibility:query.visibility,offeringStatus:query.offeringStatus,page,
  }),
  COLLEGE_CONTENT_PAGE_SIZE,CONTENT_METADATA_EXPORT_CAP);
 return {...result,csv:kind==="LIVE_CLASS" ? renderCollegeLiveClassCsv(result.rows,result.truncated)
  :renderCollegeContentMetadataCsv(result.rows,result.truncated)};
}
