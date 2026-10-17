/** TPO-calendar-reports-48: denominator is recorded applied results within one round.
 * Learners with no applied round result are not considered failed or passed. */
export type AppliedRoundDecision={id:string;roundId:string;roundName:string;jobId:string;outcome:string};
export function summarizeFailedRoundShares(rows:readonly AppliedRoundDecision[]){
 const grouped=new Map<string,{roundId:string;roundName:string;jobId:string;decisions:number;failed:number}>();
 const unique=new Set<string>();
 for(const row of rows){
  if(unique.has(row.id))continue;unique.add(row.id);
  let group=grouped.get(row.roundId);
  if(!group){group={roundId:row.roundId,roundName:row.roundName,jobId:row.jobId,decisions:0,failed:0};grouped.set(row.roundId,group);}
  group.decisions+=1;
  if(row.outcome==="FAIL")group.failed+=1;
 }
 return [...grouped.values()].map(row=>({...row,shareOfRoundPercent:
  row.decisions>0?Math.round(row.failed/row.decisions*100):null}))
  .sort((a,b)=>b.failed-a.failed||a.roundName.localeCompare(b.roundName,"en-IN"));
}
