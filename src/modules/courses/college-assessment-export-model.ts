import {collegeAssessmentListQuerySchema,collegeAssessmentHref,type CollegeAssessmentKind,type CollegeAssessmentAggregateItem,type CollegeAssessmentListQuery} from "./college-assessment-aggregate-model";
import {buildCollegeDirectoryCsv} from "@/modules/academics/college-directory-export-model";

export const COLLEGE_ASSESSMENT_EXPORT_CAP=1000;
export const collegeAssessmentExportQuerySchema=collegeAssessmentListQuerySchema.omit({page:true});

export function collegeAssessmentExportHref(kind:CollegeAssessmentKind,query:CollegeAssessmentListQuery){
 const base=collegeAssessmentHref(kind,{...query,page:1});
 const params=new URL(base,"https://example.invalid").searchParams;
 return "/api/academics/college-assessment-export/"+(kind==="QUIZ"?"quiz":"assignment")+
  (params.size?"?"+params.toString():"");
}
export function renderCollegeAssessmentCsv(kind:CollegeAssessmentKind,rows:readonly CollegeAssessmentAggregateItem[],truncated:boolean){
 return buildCollegeDirectoryCsv([
  kind==="QUIZ"?"Quiz":"Assignment","Course","Course code","Lesson","Audience",
  "Status","Due date (UTC)","Points","Students eligible","Submitted","Graded","Results",
 ],rows.map(x=>[
  x.title,x.courseName,x.courseCode,x.lessonName,
  x.deliverySpecific?"Section-specific":"Shared offering",
  x.status,x.dueAt?.toISOString()??"",String(x.points),
  String(x.eligibleLearners),String(x.submittedLearners),String(x.gradedLearners),
  kind==="QUIZ"?(x.resultsPublished?"Released":"Withheld"):"",
 ]),truncated,COLLEGE_ASSESSMENT_EXPORT_CAP);
}
