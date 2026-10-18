import {csvSafeCell} from "./mentor-board-review-model";
export type MentorTaskReviewExportRow={
 id:string;projectTitle:string;taskTitle:string;priority:string;version:number;submittedAt:Date;
};
export function mentorPendingTaskReviewCsv(rows:readonly MentorTaskReviewExportRow[],omitted:number){
 const format=new Intl.DateTimeFormat("en-GB",{
  timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
  hour:"2-digit",minute:"2-digit",hourCycle:"h23",
 });
 const lines=["Review ID,Project,Task,Priority,Version,Submitted (IST)"];
 const limited=rows.slice(0,500);
 for(const row of limited)lines.push([row.id,row.projectTitle,row.taskTitle,
  row.priority,row.version,Number.isFinite(row.submittedAt?.getTime())?
   format.format(row.submittedAt)+" IST":"Unknown"]
  .map(csvSafeCell).join(","));
 const hidden=(Number.isSafeInteger(omitted)&&omitted>0?omitted:0)+Math.max(0,rows.length-limited.length);
 if(hidden>0)lines.push(["","Truncated",hidden+" additional matching reviews","","",""]
  .map(csvSafeCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
