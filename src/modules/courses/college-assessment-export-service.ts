import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {collectCollegeExportRows} from "@/modules/academics/college-directory-export-model";
import {COLLEGE_ASSESSMENT_PAGE_SIZE,type CollegeAssessmentKind} from "./college-assessment-aggregate-model";
import {listCollegeAssessmentAggregate} from "./college-assessment-aggregate-service";
import {COLLEGE_ASSESSMENT_EXPORT_CAP,collegeAssessmentExportQuerySchema,renderCollegeAssessmentCsv} from "./college-assessment-export-model";

export async function exportCollegeAssessments(context:RequestContext,kind:CollegeAssessmentKind,raw:unknown){
 const query=collegeAssessmentExportQuerySchema.parse(raw);
 const data=await collectCollegeExportRows(
  page=>listCollegeAssessmentAggregate(context,kind,{...query,page}),
  COLLEGE_ASSESSMENT_PAGE_SIZE,COLLEGE_ASSESSMENT_EXPORT_CAP);
 return {...data,csv:renderCollegeAssessmentCsv(kind,data.rows,data.truncated)};
}
