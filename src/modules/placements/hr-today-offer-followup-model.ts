/** Prefer outstanding-issued offer follow-ups before lower-priority history.
 * ORDER BY is not guaranteed for a grouped SQL query without an explicit sort.
 * Operate only on already scoped aggregate rows, without fetching candidate PII.
 */
export function prioritizeRecruiterOfferFollowups<T extends {
 jobId:string;jobTitle:string;status:string;count:number;
}>(rows:readonly T[],maximum=30):T[]{
 const score=(status:string)=>status==="ISSUED"?0:status==="ACCEPTED"?1:status==="DECLINED"?2:3;
 return rows.filter(row=>Number.isFinite(row.count)&&row.count>0)
  .sort((a,b)=>score(a.status)-score(b.status) ||
    a.jobTitle.localeCompare(b.jobTitle) || a.jobId.localeCompare(b.jobId))
  .slice(0,Math.max(0,Number.isSafeInteger(maximum)?maximum:30));
}
