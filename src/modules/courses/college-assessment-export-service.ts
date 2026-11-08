import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {COLLEGE_ASSESSMENT_PAGE_SIZE,parseCollegeAssessmentQuery,type CollegeAssessmentKind} from "./college-assessment-aggregate-model";
import {listCollegeAssessmentAggregate} from "./college-assessment-aggregate-service";
import {COLLEGE_ASSESSMENT_EXPORT_CAP,collegeAssessmentExportQuerySchema,renderCollegeAssessmentCsv,renderCollegeAssessmentPageCsv} from "./college-assessment-export-model";

/** Preserve the acting context and assessment kind for EVERY page read.
 * Explicit calls prevent a bare-page collector callback from ever becoming a
 * route-level aggregate reader and leaking/mixing the wrong assessment scope.
 * The cap bounds both exported rows and SQL query count.
 */
export async function exportCollegeAssessments(context:RequestContext,kind:CollegeAssessmentKind,raw:unknown,
 reader:typeof listCollegeAssessmentAggregate=listCollegeAssessmentAggregate){
 const {exportMode,...query}=collegeAssessmentExportQuerySchema.parse(raw);
 // An assignment cannot request a quiz-only results filter or CLOSED status.
 // Share the same kind-aware validation as the paged directory before any read.
 const validatedQuery=parseCollegeAssessmentQuery(kind,{...query,page:1});
 const first=await reader(context,kind,{...validatedQuery,page:exportMode==="PAGE"?query.page:1});
 if(exportMode==="PAGE")return {
  rows:first.items,truncated:false,cap:COLLEGE_ASSESSMENT_PAGE_SIZE,
  csv:renderCollegeAssessmentPageCsv(kind,first.items),
  collegeId:first.collegeId,page:first.page,exportMode,
 };
 // Keep a CSV tied to one stable authorized snapshot. A concurrent
 // publish/archive can otherwise shift offset pages and repeat or omit rows.
 const stale=()=>new Error("COLLEGE_ASSESSMENT_EXPORT_STALE");
 const total=first.total, pages=first.totalPages;
 if(!Number.isSafeInteger(total)||total<0||
    !Number.isSafeInteger(pages)||pages<Math.ceil(total/COLLEGE_ASSESSMENT_PAGE_SIZE)||
    first.items.length>COLLEGE_ASSESSMENT_PAGE_SIZE)throw stale();
 const rows=[...first.items];
 const lastPage=Math.min(pages,Math.ceil(COLLEGE_ASSESSMENT_EXPORT_CAP/COLLEGE_ASSESSMENT_PAGE_SIZE));
 for(let page=2;page<=lastPage;page++){
  const next=await reader(context,kind,{...validatedQuery,page});
  if(next.total!==total||next.totalPages!==pages||
     next.collegeId!==first.collegeId||
     next.items.length>COLLEGE_ASSESSMENT_PAGE_SIZE)throw stale();
  rows.push(...next.items);
 }
 const selected=rows.slice(0,COLLEGE_ASSESSMENT_EXPORT_CAP);
 if(selected.length!==Math.min(total,COLLEGE_ASSESSMENT_EXPORT_CAP)||
    new Set(selected.map(item=>item.id)).size!==selected.length)throw stale();
 const data={rows:selected,
  truncated:total>COLLEGE_ASSESSMENT_EXPORT_CAP,cap:COLLEGE_ASSESSMENT_EXPORT_CAP};
 return {...data,csv:renderCollegeAssessmentCsv(kind,data.rows,data.truncated),
  collegeId:first.collegeId,page:1,exportMode};
}
