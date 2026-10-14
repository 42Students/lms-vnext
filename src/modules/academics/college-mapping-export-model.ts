import {semesterCourseQuerySchema} from "./college-mapping-model";
import {buildCollegeDirectoryCsv,exportParams} from "./college-directory-export-model";
export const OFFERING_MAPPING_EXPORT_CAP=1000;
export const offeringMappingCsvSchema=semesterCourseQuerySchema.omit({page:true});
export {exportParams};
export function offeringMappingCsvHref(q:{
 q:string;programId?:string;periodId?:string;type:"ALL"|"CORE"|"ELECTIVE";
}) {
 const params=new URLSearchParams();
 if(q.q)params.set("q",q.q);
 if(q.programId)params.set("programId",q.programId);
 if(q.periodId)params.set("periodId",q.periodId);
 if(q.type!=="ALL")params.set("type",q.type);
 return "/api/academics/college-offering-mappings-export"+(params.size?"?"+params.toString():"");
}
export function renderOfferingMappingCsv(rows:readonly {
 courseName:string;courseCode:string;programName:string;cohortName:string;
 periodName:string;periodCode:string;type:string;credits:number|null;status:string;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(
  ["Course","Code","Program","Batch","Period","Period code","Type","Credits","Status"],
  rows.map(r=>[r.courseName,r.courseCode,r.programName,r.cohortName,
   r.periodName,r.periodCode,r.type,r.credits===null?"":String(r.credits),r.status]),
  truncated,OFFERING_MAPPING_EXPORT_CAP);
}
