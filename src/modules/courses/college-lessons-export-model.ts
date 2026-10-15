import {collegeLessonQuerySchema} from "./college-learning-directory-model";
import {buildCollegeDirectoryCsv,exportParams} from "@/modules/academics/college-directory-export-model";
export const LESSONS_EXPORT_CAP=1000;
export const lessonsCsvSchema=collegeLessonQuerySchema.omit({page:true});
export {exportParams};
export function lessonsCsvHref(q:{
 programStatus?:"ALL"|"ACTIVE"|"ARCHIVED"; cohortStatus?:"ALL"|"PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED"; periodStatus?:"ALL"|"PLANNED"|"ACTIVE"|"CLOSED"; courseStatus?:"ALL"|"ACTIVE"|"ARCHIVED"; q:string;status:"ALL"|"ACTIVE"|"ARCHIVED";offeringStatus:"ALL"|"ACTIVE"|"ARCHIVED";courseCode?:string;programCode?:string;cohortCode?:string;periodCode?:string;pathStatus?:"ALL"|"DRAFT"|"PUBLISHED"|"ARCHIVED";offeringType?:"ALL"|"CORE"|"ELECTIVE";departmentName?:string;contentPresence?:"ALL"|"HAS_CONTENT"|"EMPTY";publishedContent?:"ALL"|"HAS_PUBLISHED"|"NONE_PUBLISHED";flaggedVisibility?:"ALL"|"HAS_FLAGGED"|"NONE_FLAGGED";assignmentPresence?:"ALL"|"HAS_ASSIGNMENTS"|"NO_ASSIGNMENTS";quizPresence?:"ALL"|"HAS_QUIZZES"|"NO_QUIZZES";
}){
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.courseCode)p.set("courseCode",q.courseCode);
 if(q.programCode)p.set("programCode",q.programCode);
 if(q.cohortCode)p.set("cohortCode",q.cohortCode);
 if(q.periodCode)p.set("periodCode",q.periodCode);
 if(q.status!=="ACTIVE")p.set("status",q.status);
 if(q.offeringStatus!=="ALL")p.set("offeringStatus",q.offeringStatus);
 if(q.pathStatus && q.pathStatus!=="ALL")p.set("pathStatus",q.pathStatus);
 if(q.offeringType&&q.offeringType!=="ALL")p.set("offeringType",q.offeringType);
 if(q.departmentName)p.set("departmentName",q.departmentName);
 if(q.contentPresence&&q.contentPresence!=="ALL")p.set("contentPresence",q.contentPresence);
 if(q.publishedContent&&q.publishedContent!=="ALL")p.set("publishedContent",q.publishedContent);
 if(q.flaggedVisibility&&q.flaggedVisibility!=="ALL")p.set("flaggedVisibility",q.flaggedVisibility);
 if(q.assignmentPresence&&q.assignmentPresence!=="ALL")p.set("assignmentPresence",q.assignmentPresence);
 if(q.quizPresence&&q.quizPresence!=="ALL")p.set("quizPresence",q.quizPresence);
 if(q.programStatus&&q.programStatus!=="ALL")p.set("programStatus",q.programStatus);
 if(q.cohortStatus&&q.cohortStatus!=="ALL")p.set("cohortStatus",q.cohortStatus);
 if(q.periodStatus&&q.periodStatus!=="ALL")p.set("periodStatus",q.periodStatus);
 if(q.courseStatus&&q.courseStatus!=="ALL")p.set("courseStatus",q.courseStatus);
 return "/api/academics/college-lessons-export"+(p.size?"?"+p.toString():"");
}
export function renderLessonsCsv(rows:readonly {
 name:string;sequence:number;status:string;pathStatus:string;
 courseName:string;courseCode:string;cohortName:string;periodName:string;offeringStatus:string;
 contentCount:number;publishedContentCount:number;publishedAndVisibleFlagCount:number;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Lesson","Order","Lesson status","Path status","Course",
  "Course code","Batch","Period","Offering status","Authored content","Published content","Published and visibility-flagged content"],
 rows.map(r=>[r.name,String(r.sequence+1),r.status,r.pathStatus,r.courseName,
  r.courseCode,r.cohortName,r.periodName,r.offeringStatus,
  String(r.contentCount),String(r.publishedContentCount),String(r.publishedAndVisibleFlagCount)]),
 truncated,LESSONS_EXPORT_CAP);
}
