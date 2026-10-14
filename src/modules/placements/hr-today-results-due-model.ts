export type HrTodayResultsDue = {id:string;jobId:string;jobTitle:string;roundName:string;dueAt:Date;status:string};
export function projectHrTodayResultsDue<T extends HrTodayResultsDue>(
  rows:readonly T[],authorizedJobIds:readonly string[],
):T[] {
 const ids=new Set(authorizedJobIds);
 return rows.filter(item=>ids.has(item.jobId)&&Number.isFinite(item.dueAt.getTime()))
  .sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime()||a.id.localeCompare(b.id));
}
