export type HrTodayResultsDue = {id:string;jobId:string;jobTitle:string;roundName:string;dueAt:Date;status:string};
export function projectHrTodayResultsDue<T extends HrTodayResultsDue>(
  rows:readonly T[],authorizedJobIds:readonly string[],
):T[] {
 const ids=new Set(authorizedJobIds);
 // Results-due reminders must not reappear after a round is cancelled or
 // reset to PENDING, even if the calendar snapshot still contains its date.
 return rows.filter(item=>ids.has(item.jobId)&&
  (item.status==="SCHEDULED"||item.status==="COMPLETED")&&
  Number.isFinite(item.dueAt.getTime()))
  .sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime()||a.id.localeCompare(b.id));
}
