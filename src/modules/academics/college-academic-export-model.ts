import { collegeBatchDirectorySchema,collegeSemesterDirectorySchema } from "./college-academic-directory-model";
import { buildCollegeDirectoryCsv,exportParams } from "./college-directory-export-model";
export const ACADEMIC_EXPORT_CAP=1000;
export const semesterCsvSchema=collegeSemesterDirectorySchema.omit({page:true});
export const batchCsvSchema=collegeBatchDirectorySchema.omit({page:true});
export type AcademicCsvKind="SEMESTERS"|"BATCHES";
export function academicExportHref(kind:AcademicCsvKind,query:{
 q:string;programId?:string;status:string;termNumber?:number;minimumCredits?:number;maximumCredits?:number;yearStart?:number;currentTerm?:number;
}){
 const p=new URLSearchParams();
 if(query.q)p.set("q",query.q);
 if(query.programId)p.set("programId",query.programId);
 if(query.status!=="ALL")p.set("status",query.status);
 if(kind==="SEMESTERS"&&query.termNumber!==undefined)p.set("termNumber",String(query.termNumber));
 if(kind==="SEMESTERS"&&query.minimumCredits!==undefined)p.set("minimumCredits",String(query.minimumCredits));
 if(kind==="SEMESTERS"&&query.maximumCredits!==undefined)p.set("maximumCredits",String(query.maximumCredits));
 if(kind==="BATCHES"&&query.yearStart!==undefined)p.set("yearStart",String(query.yearStart));
 if(kind==="BATCHES"&&query.currentTerm!==undefined)p.set("currentTerm",String(query.currentTerm));
 return "/api/academics/college-academic-export/"+(kind==="SEMESTERS"?"semesters":"batches")+
  (p.size?"?"+p.toString():"");
}
export {exportParams};
export function renderBatchCsv(rows:readonly {
 name:string;code:string;status:string;programName:string;programCode:string;
 currentTermNumber:number|null;currentAcademicYearStart:number|null;
 activeSections:number;activeEnrolledLearners:number;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Batch","Batch code","Program","Program code","State","Recorded term",
  "Academic year start","Active classes","Active learner enrollments"],rows.map(r=>[
  r.name,r.code,r.programName,r.programCode,r.status,
  r.currentTermNumber===null?"":String(r.currentTermNumber),
  r.currentAcademicYearStart===null?"":String(r.currentAcademicYearStart),
  String(r.activeSections),String(r.activeEnrolledLearners),
 ]),truncated,ACADEMIC_EXPORT_CAP);
}
export function renderSemesterCsv(rows:readonly {
 name:string;termNumber:number;programName:string;programCode:string;
 totalCredits:number|null;isActive:boolean;mappedCourses:number;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Semester","Number","Program","Program code","Total credits",
  "Mapped courses","Status"],rows.map(r=>[
  r.name,String(r.termNumber),r.programName,r.programCode,
  r.totalCredits===null?"":String(r.totalCredits),String(r.mappedCourses),
  r.isActive?"ACTIVE":"INACTIVE",
 ]),truncated,ACADEMIC_EXPORT_CAP);
}
