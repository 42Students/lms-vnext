export type PlacementScheduleRow = {
  applicationId: string;
  roundId: string;
  roundName: string;
  companyName: string;
  roleTitle: string;
  scheduledAt: Date | null;
  exception: { scheduledAt: Date } | null;
  durationMinutes?:number|null;
};

/** Legacy day-only schedule: midnight in the college timezone has no chosen start time. */
export function learnerRoundIsDayOnly(date:Date):boolean{
 if(!Number.isFinite(date.getTime()))return false;
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",
  hourCycle:"h23"}).formatToParts(date);
 const part=(name:string)=>parts.find(item=>item.type===name)?.value??"";
 return part("hour")==="00"&&part("minute")==="00";
}
export function learnerRoundLastActiveInstant(start:Date,durationMinutes:number|null|undefined):number{
 const startMs=start.getTime();
 if(!Number.isFinite(startMs))return Number.NaN;
 if(learnerRoundIsDayOnly(start))return startMs+24*60*60*1000;
 const duration=durationMinutes!=null&&Number.isFinite(durationMinutes)&&durationMinutes>0?
  Math.min(durationMinutes,24*60):60;
 return startMs+duration*60*1000;
}
export function partitionLearnerPlacementSchedule(
  rows: readonly PlacementScheduleRow[], now: Date,
): { ahead: PlacementScheduleRow[]; past: PlacementScheduleRow[]; undated: PlacementScheduleRow[] } {
  const ahead: PlacementScheduleRow[] = [];
  const past: PlacementScheduleRow[] = [];
  const undated: PlacementScheduleRow[] = [];
  for (const row of rows) {
    const date = row.exception?.scheduledAt ?? row.scheduledAt;
    if (!date || !Number.isFinite(date.getTime())) undated.push(row);
    else if (learnerRoundLastActiveInstant(date,row.durationMinutes)>now.getTime()) ahead.push(row);
    else past.push(row);
  }
  const byDate=(a:PlacementScheduleRow,b:PlacementScheduleRow)=>
    (a.exception?.scheduledAt??a.scheduledAt)!.getTime()-
    (b.exception?.scheduledAt??b.scheduledAt)!.getTime();
  ahead.sort(byDate);
  past.sort((a,b)=>byDate(b,a));
  return {ahead,past,undated};
}
