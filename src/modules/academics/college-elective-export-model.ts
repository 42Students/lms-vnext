import { collegeElectiveQuerySchema } from "./college-structure-directory-model";
import { buildCollegeDirectoryCsv,exportParams } from "./college-directory-export-model";
export const ELECTIVES_EXPORT_CAP=1000;
export const electiveCsvSchema=collegeElectiveQuerySchema.omit({page:true});
export {exportParams};
export function electiveCsvHref(q:{
 q:string;programId?:string;status:"ALL"|"ACTIVE"|"ARCHIVED";semesterNumber?:number;minimumCredits?:number;
}){
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.programId)p.set("programId",q.programId);
 if(q.status!=="ACTIVE")p.set("status",q.status);
 if(q.semesterNumber!==undefined)p.set("semesterNumber",String(q.semesterNumber));
 if(q.minimumCredits!==undefined)p.set("minimumCredits",String(q.minimumCredits));
 return "/api/academics/college-electives-export"+(p.size?"?"+p.toString():"");
}
export function renderElectivesCsv(rows:readonly {
 name:string;programName:string;semesterNumber:number;academicYear:number|null;
 periodName:string|null;credits:number;minPick:number;maxPick:number;
 activeOfferings:number;status:string;
}[],truncated:boolean){
 return buildCollegeDirectoryCsv(["Slot","Program","Semester","Academic year",
  "Period","Credits","Minimum picks","Maximum picks","Active offerings","State"],
  rows.map(r=>[r.name,r.programName,String(r.semesterNumber),
    r.academicYear===null?"":String(r.academicYear),r.periodName??"",
    String(r.credits),String(r.minPick),String(r.maxPick),String(r.activeOfferings),r.status]),
  truncated,ELECTIVES_EXPORT_CAP);
}
