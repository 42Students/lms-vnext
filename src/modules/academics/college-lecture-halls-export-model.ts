import {collegeLectureHallFiltersSchema} from "./college-lecture-hall-directory-model";
import {buildCollegeDirectoryCsv,exportParams} from "./college-directory-export-model";
export const LECTURE_HALLS_EXPORT_CAP=1000;
export const lectureHallsCsvSchema=collegeLectureHallFiltersSchema.omit({page:true});
export {exportParams};
export function lectureHallsCsvHref(q:{
 q:string;status:"ALL"|"ACTIVE"|"ARCHIVED";
 roomType:"ALL"|"CLASSROOM"|"LECTURE_HALL"|"LAB"|"SEMINAR_HALL"|"AUDITORIUM"|"CONFERENCE_ROOM";
 departmentId?:string;minimumCapacity?:number;
}){
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.status!=="ALL")p.set("status",q.status);
 if(q.roomType!=="ALL")p.set("roomType",q.roomType);
 if(q.departmentId)p.set("departmentId",q.departmentId);
 if(q.minimumCapacity!==undefined)p.set("minimumCapacity",String(q.minimumCapacity));
 return "/api/academics/college-lecture-halls-export"+(p.size?"?"+p.toString():"");
}
export function renderLectureHallsCsv(rows:readonly {
 name:string;capacity:number;roomType:string;status:string;
 departmentName:string|null;upcomingClasses:number;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Hall","Configured seats","Room type","Department","Status","Upcoming scheduled classes"],
  rows.map(r=>[r.name,String(r.capacity),r.roomType,r.departmentName??"",r.status,String(r.upcomingClasses)]),
  truncated,LECTURE_HALLS_EXPORT_CAP);
}
