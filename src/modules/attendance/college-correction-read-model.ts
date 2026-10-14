import { z } from "zod";
import { facultyAttendanceMarkingWindow } from "./faculty-marking-window";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const start = new Date(value + "T00:00:00+05:30");
  return Number.isFinite(start.getTime()) &&
    new Date(start.getTime() + 330*60_000).toISOString().slice(0,10) === value;
},"Use a valid IST calendar date");

export const collegeCorrectionReadSchema = z.strictObject({
  from: dateOnly.optional(), to: dateOnly.optional(),
}).superRefine((query,ctx)=>{
  if (Boolean(query.from)!==Boolean(query.to))
    ctx.addIssue({code:"custom",path:["to"],message:"Both IST dates are required"});
  if (query.from && query.to) {
    const days=(Date.parse(query.to+"T00:00:00+05:30") -
      Date.parse(query.from+"T00:00:00+05:30")) / 86_400_000;
    if (days<0 || days>30)
      ctx.addIssue({code:"custom",path:["to"],message:"Select 1–31 IST calendar days"});
  }
});

export function istCorrectionWindow(from:string,to:string) {
  return {start:new Date(from+"T00:00:00+05:30"),
    endExclusive:new Date(Date.parse(to+"T00:00:00+05:30")+86_400_000)};
}
export type CorrectionSessionRow = {
  id:string; title:string;sectionName:string;
  startsAt:Date;endsAt:Date;attendanceStatus:string|null;markedAt:Date|null;
};
export function projectCorrectionSessions(rows:readonly CorrectionSessionRow[],windowHours:number,now:Date) {
  return rows.map(row=>({
    id:row.id,title:row.title,sectionName:row.sectionName,
    startsAt:row.startsAt.toISOString(),endsAt:row.endsAt.toISOString(),
    attendanceStatus:row.attendanceStatus,markedAt:row.markedAt?.toISOString()??null,
    facultyMarkingWindow:facultyAttendanceMarkingWindow({
      startsAt:row.startsAt,endsAt:row.endsAt,correctionWindowHours:windowHours,now,
    }),
  }));
}
