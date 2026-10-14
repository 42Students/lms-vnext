import {collegeLessonQuerySchema} from "./college-learning-directory-model";
import {buildCollegeDirectoryCsv,exportParams} from "@/modules/academics/college-directory-export-model";
export const LESSONS_EXPORT_CAP=1000;
export const lessonsCsvSchema=collegeLessonQuerySchema.omit({page:true});
export {exportParams};
export function lessonsCsvHref(q:{
 q:string;status:"ALL"|"ACTIVE"|"ARCHIVED";offeringStatus:"ALL"|"ACTIVE"|"ARCHIVED";courseCode?:string;
}){
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.courseCode)p.set("courseCode",q.courseCode);
 if(q.status!=="ACTIVE")p.set("status",q.status);
 if(q.offeringStatus!=="ALL")p.set("offeringStatus",q.offeringStatus);
 return "/api/academics/college-lessons-export"+(p.size?"?"+p.toString():"");
}
export function renderLessonsCsv(rows:readonly {
 name:string;sequence:number;status:string;pathStatus:string;
 courseName:string;courseCode:string;cohortName:string;periodName:string;offeringStatus:string;
 contentCount:number;publishedContentCount:number;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Lesson","Order","Lesson status","Path status","Course",
  "Course code","Batch","Period","Offering status","Authored content","Published content"],
 rows.map(r=>[r.name,String(r.sequence+1),r.status,r.pathStatus,r.courseName,
  r.courseCode,r.cohortName,r.periodName,r.offeringStatus,
  String(r.contentCount),String(r.publishedContentCount)]),
 truncated,LESSONS_EXPORT_CAP);
}
