import {collegeProgressQuerySchema,type CollegeProgressQuery} from "./college-learning-directory-model";
import {buildCollegeDirectoryCsv,exportParams} from "@/modules/academics/college-directory-export-model";
export const PROGRESS_EXPORT_CAP=1000;
export const collegeProgressCsvSchema=collegeProgressQuerySchema.omit({page:true});
export {exportParams};
export function collegeProgressCsvHref(query: CollegeProgressQuery) {
 const p=new URLSearchParams();
 if(query.q)p.set("q",query.q);
 if(query.courseCode)p.set("courseCode",query.courseCode);
 if(query.programCode)p.set("programCode",query.programCode);
 if(query.periodCode)p.set("periodCode",query.periodCode);
 if(query.cohortCode)p.set("cohortCode",query.cohortCode);
 if(query.departmentName)p.set("departmentName",query.departmentName);
 if(query.activityState&&query.activityState!=="ALL")p.set("activityState",query.activityState);
 if(query.completionEvidence&&query.completionEvidence!=="ALL")p.set("completionEvidence",query.completionEvidence);
 if(query.learningPathPresence&&query.learningPathPresence!=="ALL")p.set("learningPathPresence",query.learningPathPresence);
 if(query.publishedPathPresence&&query.publishedPathPresence!=="ALL")p.set("publishedPathPresence",query.publishedPathPresence);
 if(query.offeringType&&query.offeringType!=="ALL")p.set("offeringType",query.offeringType);
 if(query.status!=="ACTIVE")p.set("status",query.status);
 if(query.programStatus&&query.programStatus!=="ALL")p.set("programStatus",query.programStatus);
 if(query.cohortStatus&&query.cohortStatus!=="ALL")p.set("cohortStatus",query.cohortStatus);
 if(query.periodStatus&&query.periodStatus!=="ALL")p.set("periodStatus",query.periodStatus);
 if(query.courseStatus&&query.courseStatus!=="ALL")p.set("courseStatus",query.courseStatus);
 if(query.departmentCode)p.set("departmentCode",query.departmentCode);
 if(query.lessonPresence!=="ALL")p.set("lessonPresence",query.lessonPresence);
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
