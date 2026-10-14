import {collegeProgressQuerySchema} from "./college-learning-directory-model";
import {buildCollegeDirectoryCsv,exportParams} from "@/modules/academics/college-directory-export-model";
export const PROGRESS_EXPORT_CAP=1000;
export const collegeProgressCsvSchema=collegeProgressQuerySchema.omit({page:true});
export {exportParams};
export function collegeProgressCsvHref(query:{q:string;status:"ALL"|"ACTIVE"|"ARCHIVED";courseCode?:string;programCode?:string;periodCode?:string}){
 const p=new URLSearchParams();
 if(query.q)p.set("q",query.q);
 if(query.courseCode)p.set("courseCode",query.courseCode);
 if(query.programCode)p.set("programCode",query.programCode);
 if(query.periodCode)p.set("periodCode",query.periodCode);
 if(query.status!=="ACTIVE")p.set("status",query.status);
 return "/api/academics/college-progress-export"+(p.size?"?"+p.toString():"");
}
export function renderCollegeProgressCsv(rows:readonly {
 courseName:string;courseCode:string;cohortName:string;periodName:string;
 offeringStatus:string;recordedRows:number;completedRows:number;learnersWithRecords:number;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(
 ["Course","Code","Batch","Academic period","Offering state","Recorded content rows",
  "Completed content rows","Distinct learners with records"],
 rows.map(r=>[r.courseName,r.courseCode,r.cohortName,r.periodName,r.offeringStatus,
  String(r.recordedRows),String(r.completedRows),String(r.learnersWithRecords)]),
 truncated,PROGRESS_EXPORT_CAP);
}
