/** Keep in-progress sessions when a learner filters for upcoming classes. */
export function filterLearnerScheduleUpcoming<T extends {endsAt:string}>(
 rows:readonly T[],active:boolean,nowMs:number,
):T[]{
 if(!active)return [...rows];
 return rows.filter(row=>{
  const ends=Date.parse(row.endsAt);
  return Number.isFinite(ends)&&ends>nowMs;
 });
}
