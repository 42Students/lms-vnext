/** A notice timestamp is persisted; invalid and future timestamps are never "recent". */
export function filterLearnerRecentNotices<T extends {createdAt:string}>(rows:readonly T[],nowMs:number,days=30):T[]{
 if(!Number.isFinite(nowMs)||!Number.isSafeInteger(days)||days<1||days>366)return [];
 return rows.filter(row=>{
  const created=Date.parse(row.createdAt);
  const age=nowMs-created;
  return Number.isFinite(created)&&age>=0&&age<=days*86400000;
 });
}
