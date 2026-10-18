import type {RecruiterDriveListItem} from "./recruiter-drive-list-model";
export const HR_DRIVE_CSV_CAP=200;
function cell(value:string){
 const safe=/^\s*[=+\-@]/u.test(value)||/^[\t\r\n]/u.test(value)?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function buildHrDrivesCsv(rows:readonly RecruiterDriveListItem[],hasMore:boolean){
 const output=[["Drive ID","Job title","Lifecycle","Employment","Work mode","Deadline (IST)"].map(cell).join(",")];
 const shown=rows.slice(0,HR_DRIVE_CSV_CAP);
 const dateFormat=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hour12:false,
 });
 for(const row of shown){
  const deadline=row.job.applicationDeadline
   ?Number.isFinite(row.job.applicationDeadline.getTime())
     ?dateFormat.format(row.job.applicationDeadline):"Date unavailable":"";
  output.push([row.job.id,row.job.title,row.job.status,row.job.employmentType??"",
   row.job.workMode??"",deadline].map(cell).join(","));
 }
 const truncated=hasMore||rows.length>HR_DRIVE_CSV_CAP;
 if(truncated)output.push(["Export capped","Additional authorized drives omitted","","","",""].map(cell).join(","));
 return {csv:"\uFEFF"+output.join("\r\n")+"\r\n",exported:shown.length,truncated};
}
