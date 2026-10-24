import { collegeBatchDirectoryBaseSchema,collegeSemesterDirectoryBaseSchema } from "./college-academic-directory-model";
import { buildCollegeDirectoryCsv,exportParams } from "./college-directory-export-model";
export const ACADEMIC_EXPORT_CAP=1000;
// Export query schemas omit pagination but retain all directory cross-field
// constraints. The directory helpers accept page-bearing objects only.
export const semesterCsvSchema=collegeSemesterDirectoryBaseSchema.omit({page:true})
 .refine(q=>q.minimumCredits===undefined||q.maximumCredits===undefined||
   q.minimumCredits<=q.maximumCredits,{
  path:["maximumCredits"],message:"Maximum credits must be at least the minimum",
 })
 .refine(q=>q.creditState!=="UNSET"||
   (q.minimumCredits===undefined&&q.maximumCredits===undefined),{
  path:["creditState"],message:"Unconfigured semester credits cannot be combined with credit bounds",
 });
export const batchCsvSchema=collegeBatchDirectoryBaseSchema.omit({page:true})
 .refine(q=>q.startOnOrAfter===undefined||q.startOnOrBefore===undefined||
   q.startOnOrAfter<=q.startOnOrBefore,{
  path:["startOnOrBefore"],message:"Batch start-date end limit must not precede start limit",
 })
 .refine(q=>q.progression!=="MISSING"||q.currentTerm===undefined,{
  path:["currentTerm"],message:"A missing progression record cannot have a recorded current term",
 })
 .refine(q=>q.academicYearState!=="UNRECORDED"||q.yearStart===undefined,{
  path:["yearStart"],message:"An unrecorded academic year cannot match a year-start filter",
 })
 .refine(q=>q.progression!=="MISSING"||q.yearStart===undefined,{
  path:["yearStart"],message:"A missing progression record cannot match a recorded academic year",
 });
export type AcademicCsvKind="SEMESTERS"|"BATCHES";
export function academicExportHref(kind:AcademicCsvKind,query:{
 q:string;programId?:string | undefined;status:string;termNumber?:number | undefined;minimumCredits?:number | undefined;maximumCredits?:number | undefined;creditState?:"ALL"|"CONFIGURED"|"UNSET" | undefined;yearStart?:number | undefined;currentTerm?:number | undefined;progression?:"ALL"|"RECORDED"|"MISSING" | undefined;
 programStatus?:"ALL"|"ACTIVE"|"ARCHIVED" | undefined;
 mappingState?:"ALL"|"MAPPED"|"UNMAPPED" | undefined;
 expectedEndState?:"ALL"|"SET"|"UNSET" | undefined;
 academicYearState?:"ALL"|"RECORDED"|"UNRECORDED" | undefined;
 activeLearnerState?:"ALL"|"HAS_ACTIVE"|"NONE_ACTIVE" | undefined;
 activeClassState?:"ALL"|"HAS_ACTIVE"|"NONE_ACTIVE" | undefined;
 startOnOrAfter?:string | undefined;
 startOnOrBefore?:string | undefined;
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
 if(kind==="BATCHES"&&query.activeClassState&&query.activeClassState!=="ALL")p.set("activeClassState",query.activeClassState);
 if(kind==="BATCHES"&&query.activeLearnerState&&query.activeLearnerState!=="ALL")p.set("activeLearnerState",query.activeLearnerState);
 return "/api/academics/college-academic-export/"+(kind==="SEMESTERS"?"semesters":"batches")+
  (p.size?"?"+p.toString():"");
}
export {exportParams};
/** Legacy downstream CSV contract: preserve the original first nine fields.
 * IDs remain scoped UUIDs; never synthesize legacy numeric IDs. Dates and
 * recorded academic year come from the actual cohort, not a guessed term.
 */
export function renderBatchCsv(rows:readonly {
 id:string;name:string;code:string;status:string;programId:string;
 programName:string;programCode:string;academicYear:string|null;
 startDate:string|null;endDate:string|null;
 currentTermNumber:number|null;currentAcademicYearStart:number|null;
 activeSections:number;activeEnrolledLearners:number;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv([
  "id","batchName","programId","currentSemester","academicYear",
  "students","status","startDate","endDate",
 ],rows.map(r=>[
  r.id,r.name,r.programId,
  r.currentTermNumber===null?"":String(r.currentTermNumber),
  r.academicYear??(r.currentAcademicYearStart===null?"":String(r.currentAcademicYearStart)),
  String(r.activeEnrolledLearners),r.status,
  r.startDate??"",r.endDate??"",
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
