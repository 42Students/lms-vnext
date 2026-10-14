import {collegeContentQuerySchema,type CollegeContentKind} from "./college-content-aggregate-model";
import {buildCollegeDirectoryCsv,exportParams} from "@/modules/academics/college-directory-export-model";
export const CONTENT_METADATA_EXPORT_CAP=1000;
export const collegeContentCsvSchema=collegeContentQuerySchema.omit({page:true});
export {exportParams};
export function collegeContentCsvHref(kind:CollegeContentKind,q:{
 q:string;courseCode?:string;status:string;format:string;scope:string;
}){
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.courseCode)p.set("courseCode",q.courseCode);
 if(q.status!=="ALL")p.set("status",q.status);
 if(q.scope!=="ALL"&&kind!=="LIVE_CLASS")p.set("scope",q.scope);
 if(q.format!=="ALL"&&kind==="VIDEO")p.set("format",q.format);
 const type=kind==="VIDEO"?"video":kind==="RESOURCE"?"resource":"live-class";
 return "/api/academics/college-content-export/"+type+(p.size?"?"+p.toString():"");
}
export function renderCollegeContentMetadataCsv(rows:readonly {
 title:string;contentType:string;status:string;courseName:string;courseCode:string;
 cohortName:string;periodName:string;lessonName:string;learningPathTitle:string;
 deliveryId:string|null;durationSeconds:number|null;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Title","Type","Publication","Course","Course code",
  "Batch","Period","Lesson","Path","Audience","Duration (seconds)"],
  rows.map(r=>[r.title,r.contentType,r.status,r.courseName,r.courseCode,
   r.cohortName,r.periodName,r.lessonName,r.learningPathTitle,
   r.deliveryId?"Section-specific":"Shared offering",
   r.durationSeconds===null?"":String(r.durationSeconds)]),truncated,CONTENT_METADATA_EXPORT_CAP);
}
