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
 for(const row of rows)lines.push([row.id,row.projectTitle,row.taskTitle,
  row.priority,row.version,format.format(row.submittedAt)+" IST"]
  .map(csvSafeCell).join(","));
 if(omitted>0)lines.push(["","Truncated",omitted+" additional matching reviews","","",""]
  .map(csvSafeCell).join(","));
 return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
