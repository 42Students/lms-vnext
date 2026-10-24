export type MentorPullCandidate={id:string;status:string;estimatePoints:number|null};
export function mentorPullEligible<T extends MentorPullCandidate>(
 tasks:readonly T[],max=60,
):{candidates:T[];moreEligible:number;excluded:number}{
 const included: T[]=[];
 const seen=new Set<string>();
 let moreEligible=0,excluded=0;
 const cap=Number.isSafeInteger(max)&&max>0?Math.min(100,max):60;
 for(const task of tasks){
  if(!["TODO","IN_PROGRESS","BLOCKED"].includes(task.status)||
    seen.has(task.id)){excluded++;continue;}
  seen.add(task.id);
  if(included.length>=cap){moreEligible++;continue;}
  included.push(task);
 }
 return {candidates:included,moreEligible,excluded};
}
export function mentorPullSelectedPoints(
 tasks:readonly MentorPullCandidate[],
 selected:readonly string[],
):{count:number;points:number;unestimated:number}{
 const selectedIds=new Set(selected);
 const counted=new Set<string>();
 let count=0,points=0,unestimated=0;
 for(const item of tasks){
  if(!selectedIds.has(item.id)||counted.has(item.id))continue;
  counted.add(item.id);
  count++;
  if(item.estimatePoints===null||!Number.isSafeInteger(item.estimatePoints)||
    item.estimatePoints<0)unestimated++;
  else points+=item.estimatePoints;
 }
 return {count,points,unestimated};
}
