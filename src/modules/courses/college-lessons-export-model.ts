import {collegeLessonQuerySchema} from "./college-learning-directory-model";
import {buildCollegeDirectoryCsv,exportParams} from "@/modules/academics/college-directory-export-model";
export const LESSONS_EXPORT_CAP=1000;
export const lessonsCsvSchema=collegeLessonQuerySchema.omit({page:true});
export {exportParams};
export function lessonsCsvHref(q:{
 q:string;status:"ALL"|"ACTIVE"|"ARCHIVED";offeringStatus:"ALL"|"ACTIVE"|"ARCHIVED";courseCode?:string;programCode?:string;cohortCode?:string;periodCode?:string;pathStatus?:"ALL"|"DRAFT"|"PUBLISHED"|"ARCHIVED";offeringType?:"ALL"|"CORE"|"ELECTIVE";departmentCode?:string;contentPresence?:"ALL"|"HAS_CONTENT"|"EMPTY";
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
 if(q.departmentCode)p.set("departmentCode",q.departmentCode);
 if(q.contentPresence&&q.contentPresence!=="ALL")p.set("contentPresence",q.contentPresence);
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
