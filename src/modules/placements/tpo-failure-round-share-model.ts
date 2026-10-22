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
  if(row.outcome==="FAIL"||row.outcome==="ABSENT")group.failed+=1;
 }
 return [...grouped.values()].map(row=>({...row,shareOfRoundPercent:
  row.decisions>0?Math.round(row.failed/row.decisions*100):null}))
  .sort((a,b)=>b.failed-a.failed||a.roundName.localeCompare(b.roundName,"en-IN"));
}

/** A learner's current ACTIVE academic department is a separate, explicit
 * dimension. Missing college-scoped academic enrollment stays "Not recorded". */
export type AppliedRoundBranchDecision=AppliedRoundDecision&{branchId:string|null;branchName:string|null};
export function summarizeFailedRoundSharesByBranch(rows:readonly AppliedRoundBranchDecision[]){
 const dedup=new Set<string>();
 const groups=new Map<string,{roundId:string;roundName:string;jobId:string;branchId:string|null;branchName:string;decisions:number;failed:number}>();
 for(const row of rows){
  if(dedup.has(row.id))continue;dedup.add(row.id);
  const branchId=row.branchId??null;
  const key=row.roundId+"|"+(branchId??"NO_ACTIVE_BRANCH");
  let group=groups.get(key);
  if(!group){group={roundId:row.roundId,roundName:row.roundName,jobId:row.jobId,
   branchId,branchName:row.branchName?.trim()||"Not recorded",decisions:0,failed:0};
   groups.set(key,group);}
  group.decisions++;
  if(row.outcome==="FAIL"||row.outcome==="ABSENT")group.failed++;
 }
 return [...groups.values()].map(row=>({...row,
  shareOfRoundPercent:row.decisions>0?Math.round(row.failed/row.decisions*100):null,
 })).sort((a,b)=>b.failed-a.failed||a.roundName.localeCompare(b.roundName,"en-IN")||
  a.branchName.localeCompare(b.branchName,"en-IN"));
}
