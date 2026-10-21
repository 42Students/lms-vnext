import {z} from "zod";
import {collegeAssessmentListQuerySchema,collegeAssessmentHref,type CollegeAssessmentKind,type CollegeAssessmentAggregateItem,type CollegeAssessmentListQuery} from "./college-assessment-aggregate-model";
import {buildCollegeDirectoryCsv} from "@/modules/academics/college-directory-export-model";

export const COLLEGE_ASSESSMENT_EXPORT_CAP=1000;
export const LEGACY_ASSESSMENT_PAGE_EXPORT_CAP=20;

/** Legacy CSV exports local wall-clock, not UTC ISO. All vNext dates use
 * Asia/Kolkata explicitly, avoiding deployment-zone-dependent results. */
export function assessmentDeadlineWallClock(date:Date|null):string{
 if(!date)return "";
 if(!Number.isFinite(date.getTime()))return "";
 return new Intl.DateTimeFormat("sv-SE",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 }).format(date);
}
export const collegeAssessmentExportQuerySchema=collegeAssessmentListQuerySchema.extend({
 exportMode:z.enum(["ALL","PAGE"]).default("ALL"),
});

export function collegeAssessmentExportHref(kind:CollegeAssessmentKind,query:CollegeAssessmentListQuery,exportMode:"ALL"|"PAGE"="ALL"){
 const base=collegeAssessmentHref(kind,{...query,page:exportMode==="PAGE"?query.page:1});
 const params=new URL(base,"https://example.invalid").searchParams;
 if(exportMode==="PAGE"){
  params.set("exportMode","PAGE");
  params.set("page",String(query.page));
 }
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

/** Legacy page-only Quiz and Assignment exports preserve precisely their own
 * headers and column order. Modern ALL exports remain opt-in and bounded. */
export function renderCollegeAssessmentPageCsv(
 kind:CollegeAssessmentKind,rows:readonly CollegeAssessmentAggregateItem[],
){
 const pageRows=rows.slice(0,LEGACY_ASSESSMENT_PAGE_EXPORT_CAP);
 if(kind==="QUIZ")return buildCollegeDirectoryCsv([
  "Title","Course","Status","Points","Due",
 ],pageRows.map(row=>[
  row.title||"Untitled",row.courseName||row.courseCode,
  row.status,String(row.points),assessmentDeadlineWallClock(row.dueAt),
 ]),false,LEGACY_ASSESSMENT_PAGE_EXPORT_CAP);
 return buildCollegeDirectoryCsv([
  "Title","Course","Scope","Points","Deadline","Submitted","Total students","Graded",
 ],pageRows.map(row=>[
  row.title||"Untitled",row.courseName||row.courseCode,
  row.deliverySpecific?"Section-specific":"All eligible sections",
  String(row.points),assessmentDeadlineWallClock(row.dueAt),
  String(row.submittedLearners),String(row.eligibleLearners),String(row.gradedLearners),
 ]),false,LEGACY_ASSESSMENT_PAGE_EXPORT_CAP);
}
