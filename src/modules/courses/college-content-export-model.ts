import {z} from "zod";
import {collegeContentQuerySchema,type CollegeContentKind} from "./college-content-aggregate-model";
import {collegeIstDateSchema} from "./college-live-classes-model";
import {buildCollegeDirectoryCsv,exportParams} from "@/modules/academics/college-directory-export-model";
export const CONTENT_METADATA_EXPORT_CAP=1000;
export const collegeContentCsvSchema=collegeContentQuerySchema.omit({page:true}).extend({
 view:z.enum(["ALL","UPCOMING","PAST"]).default("ALL"),
 from:collegeIstDateSchema.optional(),
 to:collegeIstDateSchema.optional(),
});
export {exportParams};
export function collegeContentCsvHref(kind:CollegeContentKind,q:{
 q:string;courseCode?:string;status:string;format:string;scope:string;
 view?: "ALL"|"UPCOMING"|"PAST";from?:string;to?:string;offeringStatus?:string;
}){
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.courseCode)p.set("courseCode",q.courseCode);
 if(q.status!=="ALL")p.set("status",q.status);
 if(q.scope!=="ALL")p.set("scope",q.scope);
 if(kind!=="LIVE_CLASS"&&q.offeringStatus&&q.offeringStatus!=="ALL")p.set("offeringStatus",q.offeringStatus);
 if(q.format!=="ALL"&&kind==="VIDEO")p.set("format",q.format);
 if(kind==="LIVE_CLASS"&&q.view&&q.view!=="ALL")p.set("view",q.view);
 if(kind==="LIVE_CLASS"&&q.from)p.set("from",q.from);
 if(kind==="LIVE_CLASS"&&q.to)p.set("to",q.to);
 const type=kind==="VIDEO"?"video":kind==="RESOURCE"?"resource":"live-class";
 return "/api/academics/college-content-export/"+type+(p.size?"?"+p.toString():"");
}
export function renderCollegeLiveClassCsv(rows:readonly {
 title:string;status:string;courseName:string;courseCode:string;
 cohortName:string;periodName:string;lessonName:string;learningPathTitle:string;
 startsAt:Date|null;endsAt:Date|null;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Session","Publication","Course","Course code","Batch",
  "Academic period","Lesson","Learning path","Starts at (UTC)","Ends at (UTC)"],
 rows.map(r=>[r.title,r.status,r.courseName,r.courseCode,r.cohortName,
  r.periodName,r.lessonName,r.learningPathTitle,
  r.startsAt?.toISOString()??"",r.endsAt?.toISOString()??""]),
 truncated,CONTENT_METADATA_EXPORT_CAP);
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
