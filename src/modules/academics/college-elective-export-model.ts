import { collegeElectiveBaseQuerySchema,withCollegeElectiveCreditsCheck } from "./college-structure-directory-model";
import { buildCollegeDirectoryCsv,exportParams } from "./college-directory-export-model";
export const ELECTIVES_EXPORT_CAP=1000;
export const electiveCsvSchema=withCollegeElectiveCreditsCheck(collegeElectiveBaseQuerySchema.omit({page:true}));
export {exportParams};
export function electiveCsvHref(q:{
 q:string;programId?:string|undefined;status:"ALL"|"ACTIVE"|"ARCHIVED";semesterNumber?:number|undefined;minimumCredits?:number|undefined;maximumCredits?:number|undefined;
 periodState?:"ALL"|"LINKED"|"UNLINKED"|undefined;
 periodCode?:string|undefined;
 academicYearState?:"ALL"|"RECORDED"|"MISSING"|undefined;
 offeringState?:"ALL"|"HAS_ACTIVE"|"NONE_ACTIVE"|undefined;
 choiceMode?:"ALL"|"FLEXIBLE"|"FIXED"|undefined;
 slotName?:string|undefined;
 programCode?:string|undefined;
 departmentCode?:string|undefined;
 minimumRequiredPicks?:number|undefined;
 maximumAllowedPicks?:number|undefined;
 semesterFrom?:number|undefined;
 semesterThrough?:number|undefined;
 periodLifecycle?:"ALL"|"PLANNED"|"ACTIVE"|"CLOSED"|undefined;
 descriptionPresence?:"ALL"|"RECORDED"|"MISSING"|undefined;
 periodStartsOnOrAfter?:string|undefined;
 periodEndsOnOrBefore?:string|undefined;
 programStatus?:"ALL"|"ACTIVE"|"ARCHIVED"|undefined;
}){
 const p=new URLSearchParams();
 if(q.q)p.set("q",q.q);
 if(q.programId)p.set("programId",q.programId);
 if(q.status!=="ACTIVE")p.set("status",q.status);
 if(q.semesterNumber!==undefined)p.set("semesterNumber",String(q.semesterNumber));
 if(q.minimumCredits!==undefined)p.set("minimumCredits",String(q.minimumCredits));
 if(q.maximumCredits!==undefined)p.set("maximumCredits",String(q.maximumCredits));
 if(q.programStatus&&q.programStatus!=="ALL")p.set("programStatus",q.programStatus);
 if(q.periodState&&q.periodState!=="ALL")p.set("periodState",q.periodState);
 if(q.choiceMode&&q.choiceMode!=="ALL")p.set("choiceMode",q.choiceMode);
 if(q.offeringState&&q.offeringState!=="ALL")p.set("offeringState",q.offeringState);
 if(q.academicYearState&&q.academicYearState!=="ALL")p.set("academicYearState",q.academicYearState);
 if(q.periodCode)p.set("periodCode",q.periodCode);
 if(q.slotName)p.set("slotName",q.slotName);
 if(q.programCode)p.set("programCode",q.programCode);
 if(q.departmentCode)p.set("departmentCode",q.departmentCode);
 if(q.minimumRequiredPicks!==undefined)p.set("minimumRequiredPicks",String(q.minimumRequiredPicks));
 if(q.maximumAllowedPicks!==undefined)p.set("maximumAllowedPicks",String(q.maximumAllowedPicks));
 if(q.semesterFrom!==undefined)p.set("semesterFrom",String(q.semesterFrom));
 if(q.semesterThrough !==undefined)p.set("semesterThrough",String(q.semesterThrough));
 if(q.periodLifecycle &&q.periodLifecycle!=="ALL")p.set("periodLifecycle",q.periodLifecycle);
 if(q.descriptionPresence &&q.descriptionPresence!=="ALL")p.set("descriptionPresence",q.descriptionPresence);
 if(q.periodStartsOnOrAfter)p.set("periodStartsOnOrAfter",q.periodStartsOnOrAfter);
 if(q.periodEndsOnOrBefore)p.set("periodEndsOnOrBefore",q.periodEndsOnOrBefore);
 return "/api/academics/college-electives-export"+(p.size?"?"+p.toString():"");
}
export function renderElectivesCsv(rows:readonly {
 name:string;programName:string;semesterNumber:number;academicYear:string|number|null;
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
