import {csvSafeCell} from "./mentor-board-review-model";
export type MentorSafeActivityExportRow={
  id:string;label:string;importance:string;occurredAt:Date;
};
/** The only exported fields are already-redacted service labels and timestamps. */
export function mentorActivityCsv(rows:readonly MentorSafeActivityExportRow[],
  omitted:number){
  const lines=["Event ID,Recorded event,Importance,Occurred (IST)"];
  const format=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",
    year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",
    hourCycle:"h23"});
  for(const row of rows){
    const when=Number.isFinite(row.occurredAt.getTime())
      ?format.format(row.occurredAt)+" IST":"Unknown";
    lines.push([row.id,row.label,row.importance,when].map(csvSafeCell).join(","));
  }
  if(omitted>0)lines.push(["","Truncated",omitted+" additional recorded events",""]
    .map(csvSafeCell).join(","));
  return "\uFEFF"+lines.join("\r\n")+"\r\n";
}
