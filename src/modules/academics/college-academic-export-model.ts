import { collegeBatchDirectorySchema,collegeSemesterDirectoryBaseSchema,withCollegeSemesterCreditCheck } from "./college-academic-directory-model";
import { buildCollegeDirectoryCsv,exportParams } from "./college-directory-export-model";
export const ACADEMIC_EXPORT_CAP=1000;
export const semesterCsvSchema=withCollegeSemesterCreditCheck(collegeSemesterDirectoryBaseSchema.omit({page:true}));
export const batchCsvSchema=collegeBatchDirectorySchema.omit({page:true});
export type AcademicCsvKind="SEMESTERS"|"BATCHES";
export function academicExportHref(kind:AcademicCsvKind,query:{
 q:string;programId?:string;status:string;termNumber?:number;minimumCredits?:number;maximumCredits?:number;creditState?:"ALL"|"CONFIGURED"|"UNSET";yearStart?:number;currentTerm?:number;progression?:"ALL"|"RECORDED"|"MISSING";
 programStatus?:"ALL"|"ACTIVE"|"ARCHIVED";
 mappingState?:"ALL"|"MAPPED"|"UNMAPPED";
 expectedEndState?:"ALL"|"SET"|"UNSET";
 academicYearState?:"ALL"|"RECORDED"|"UNRECORDED";
 startOnOrAfter?:string;
 startOnOrBefore?:string;
}){
 const p=new URLSearchParams();
 if(query.q)p.set("q",query.q);
 if(query.programId)p.set("programId",query.programId);
 if(query.status!=="ALL")p.set("status",query.status);
 if(kind==="SEMESTERS"&&query.termNumber!==undefined)p.set("termNumber",String(query.termNumber));
 if(kind==="SEMESTERS"&&query.minimumCredits!==undefined)p.set("minimumCredits",String(query.minimumCredits));
 if(kind==="SEMESTERS"&&query.maximumCredits!==undefined)p.set("maximumCredits",String(query.maximumCredits));
 if(kind==="SEMESTERS"&&query.creditState&&query.creditState!=="ALL")p.set("creditState",query.creditState);
 if(kind==="BATCHES"&&query.programStatus&&query.programStatus!=="ALL")p.set("programStatus",query.programStatus);
 if(kind==="BATCHES"&&query.yearStart!==undefined)p.set("yearStart",String(query.yearStart));
 if(kind==="BATCHES"&&query.currentTerm!==undefined)p.set("currentTerm",String(query.currentTerm));
 if(kind==="BATCHES"&&query.progression&&query.progression!=="ALL")p.set("progression",query.progression);
 if(kind==="SEMESTERS"&&query.programStatus&&query.programStatus!=="ALL")p.set("programStatus",query.programStatus);
 if(kind==="SEMESTERS"&&query.mappingState&&query.mappingState!=="ALL")p.set("mappingState",query.mappingState);
 if(kind==="BATCHES"&&query.expectedEndState&&query.expectedEndState!=="ALL")p.set("expectedEndState",query.expectedEndState);
 if(kind==="BATCHES"&&query.academicYearState&&query.academicYearState!=="ALL")p.set("academicYearState",query.academicYearState);
 if(kind==="BATCHES"&&query.startOnOrAfter)p.set("startOnOrAfter",query.startOnOrAfter);
 if(kind==="BATCHES"&&query.startOnOrBefore)p.set("startOnOrBefore",query.startOnOrBefore);
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
