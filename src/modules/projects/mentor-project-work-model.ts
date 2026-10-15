export type MentorProjectWorkFilter = "NO_TASKS" | "HAS_OPEN_TASKS" | "ALL_DONE" | "HAS_DONE_TASKS";
export function matchesMentorProjectWork(filter:MentorProjectWorkFilter|undefined,counts:{total:number;open:number}|undefined):boolean {
  if(filter===undefined)return true;
  if(filter==="NO_TASKS")return (counts?.total??0)===0;
  if(filter==="ALL_DONE")return counts!==undefined && counts.total>0 && counts.open===0;
  if(filter==="HAS_DONE_TASKS")return counts!==undefined && counts.total>counts.open;
  return (counts?.open??0)>0;
}

/** Registered task completion only; no tasks means unknown, not zero progress. */
export function mentorTaskProgress(counts:{total:number;open:number}|undefined){
  if(!counts||counts.total<=0)return null;
  const complete=Math.max(0,Math.min(counts.total,counts.total-counts.open));
  return {percent:Math.round(100*complete/counts.total),label:complete+" of "+counts.total+" recorded tasks done"};
}
