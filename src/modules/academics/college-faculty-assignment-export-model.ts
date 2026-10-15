import {facultyAssignmentQuerySchema} from "./college-mapping-model";
import {buildCollegeDirectoryCsv,exportParams} from "./college-directory-export-model";
export const FACULTY_ASSIGNMENT_EXPORT_CAP=1000;
export const facultyAssignmentCsvSchema=facultyAssignmentQuerySchema.omit({page:true});
export {exportParams};
export function facultyAssignmentCsvHref(q:{
 q:string;role:"ALL"|"PRIMARY"|"CO_TEACHER"|"TA";status:"ALL"|"ACTIVE"|"ENDED";courseCode?:string;sectionCode?:string;
}){
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.role!=="ALL")p.set("role",q.role);
 if(q.courseCode)p.set("courseCode",q.courseCode);
 if(q.sectionCode)p.set("sectionCode",q.sectionCode);
 if(q.status!=="ACTIVE")p.set("status",q.status);
 return "/api/academics/college-faculty-assignment-export"+(p.size?"?"+p.toString():"");
}
export function renderFacultyAssignmentCsv(rows:readonly {
 facultyName:string;role:string;courseName:string;courseCode:string;
 sectionName:string;cohortName:string;periodName:string;state:string;
 startedAt:Date;endedAt:Date|null;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(
 ["Faculty name","Teaching role","Course","Course code","Class","Batch","Period",
  "State","Started at (UTC)","Ended at (UTC)"],
 rows.map(r=>[
  r.facultyName,r.role,r.courseName,r.courseCode,r.sectionName,r.cohortName,r.periodName,
  r.state,r.startedAt.toISOString(),r.endedAt?.toISOString()??"",
 ]),truncated,FACULTY_ASSIGNMENT_EXPORT_CAP);
}
