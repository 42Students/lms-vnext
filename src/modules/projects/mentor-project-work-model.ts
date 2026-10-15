export type MentorProjectWorkFilter = "NO_TASKS" | "HAS_OPEN_TASKS";
export function matchesMentorProjectWork(filter:MentorProjectWorkFilter|undefined,counts:{total:number;open:number}|undefined):boolean {
  if(filter===undefined)return true;
  if(filter==="NO_TASKS")return (counts?.total??0)===0;
  return (counts?.open??0)>0;
}
