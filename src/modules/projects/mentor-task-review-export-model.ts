import {csvSafeCell} from "./mentor-board-review-model";
import {taskReviewDecisionLabel} from "./mentor-task-history-model";
export type MentorReviewedTaskExportRow={
  id:string;projectTitle:string;taskTitle:string;status:string;
  version:number;reviewedAt:Date|null;
};
/** Export only pre-scoped task review decisions, never feedback or learner contacts. */
export function mentorReviewedTasksCsv(rows:readonly MentorReviewedTaskExportRow[],omitted:number){
  const format=new Intl.DateTimeFormat("en-GB",{
    timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",
    hour:"2-digit",minute:"2-digit",hourCycle:"h23",
  });
  const lines=["Review ID,Project,Task,Version,Decision,Reviewed (IST)"];
  const limited=rows.slice(0,200);
  for(const row of limited){
    const when=row.reviewedAt&&Number.isFinite(row.reviewedAt.getTime())
      ?format.format(row.reviewedAt)+" IST":"Not recorded";
    lines.push([row.id,row.projectTitle,row.taskTitle,row.version,
      taskReviewDecisionLabel(row.status),when].map(csvSafeCell).join(","));
  }
  const hidden=(Number.isSafeInteger(omitted)&&omitted>0?omitted:0)+Math.max(0,rows.length-limited.length);
  if(hidden>0)lines.push(["","Truncated","",hidden+" additional reviewed versions","",""]
    .map(csvSafeCell).join(","));
  return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
