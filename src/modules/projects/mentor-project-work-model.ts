import { projectCompletionPercent } from "./progress-percentage-policy";
export type MentorProjectWorkFilter = "NO_TASKS" | "HAS_OPEN_TASKS" | "ALL_DONE" | "HAS_DONE_TASKS";
export function matchesMentorProjectWork(filter:MentorProjectWorkFilter|undefined,counts:{total:number;open:number}|undefined):boolean {
  if(filter===undefined)return true;
  // Invalid persisted totals must never be interpreted as a completed task
  // set. A missing aggregate row is valid only for the NO_TASKS filter.
  if(counts && (!Number.isSafeInteger(counts.total)||counts.total<0||
    !Number.isSafeInteger(counts.open)||counts.open<0||counts.open>counts.total))
    return false;
  if(filter==="NO_TASKS")return (counts?.total??0)===0;
  if(filter==="ALL_DONE")return counts!==undefined && counts.total>0 && counts.open===0;
  if(filter==="HAS_DONE_TASKS")return counts!==undefined && counts.total>counts.open;
  if(filter==="HAS_OPEN_TASKS")return (counts?.open??0)>0;
  return false;
}

/** Legacy project card shows x/y completed tasks, falling back to an
 * explicitly recorded manual estimate only when there are no task rows.
 * 0 is the database default and cannot prove a manual estimate exists. */
export function mentorTaskProgress(
 counts:{total:number;open:number}|undefined,manualEstimate?:number|null,
){
 if(counts&&(!Number.isSafeInteger(counts.total)||counts.total<0||
    !Number.isSafeInteger(counts.open)||counts.open<0||counts.open>counts.total))
   return null;
 if(!counts||counts.total===0){
   if(manualEstimate===null||manualEstimate===undefined||
     !Number.isSafeInteger(manualEstimate)||manualEstimate<=0||manualEstimate>100)
     return null;
   return {percent:manualEstimate,label:"Manual estimate"};
 }
 const complete=counts.total-counts.open;
 return {percent:projectCompletionPercent(complete,counts.total),label:complete+" of "+counts.total+" recorded tasks done"};
}
