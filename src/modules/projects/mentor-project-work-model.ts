export type MentorProjectWorkFilter = "NO_TASKS";
export function matchesMentorProjectWork(filter:MentorProjectWorkFilter|undefined,counts:{total:number;open:number}|undefined):boolean {
  return filter===undefined || (filter==="NO_TASKS" && (counts?.total??0)===0);
}
