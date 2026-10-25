import {projectResourceAuditAction} from "./project-resource-audit-model";

export type MentorProjectActivityCounts={
  lastSevenDays:{count:number;task:number;meeting:number;resource:number;other:number};
  resources:{changes:number;added:number;edited:number;saved:number;removed:number;other:number};
};
type EventTypeCount={eventType:string;total:number;lastSevenDays:number};

/** Aggregate full-history DB counts by persisted type without silently
 * treating a 100-event workspace page as the project's entire history.
 * The event-type categories match the Mentor Activity summary's original labels.
 */
export function summarizeMentorProjectActivityCounts(
  rows:readonly EventTypeCount[],
):MentorProjectActivityCounts {
  const lastSevenDays={count:0,task:0,meeting:0,resource:0,other:0};
  const resources={changes:0,added:0,edited:0,saved:0,removed:0,other:0};
  for(const row of rows){
    const all=Number(row.total);
    const recent=Number(row.lastSevenDays);
    if(!Number.isSafeInteger(all)||!Number.isSafeInteger(recent)||
       all<0||recent<0||recent>all)
      throw new Error("Invalid grouped project activity counts");
    lastSevenDays.count+=recent;
    const kind=/TASK/i.test(row.eventType)?"task":
      /RESOURCE|FILE|LINK/i.test(row.eventType)?"resource":
      /MEETING/i.test(row.eventType)?"meeting":"other";
    lastSevenDays[kind]+=recent;
    const action=projectResourceAuditAction(row.eventType);
    if(action!==null){
      resources.changes+=all;
      switch(action){
        case "Added":resources.added+=all;break;
        case "Edited":resources.edited+=all;break;
        case "Saved":resources.saved+=all;break;
        case "Removed":resources.removed+=all;break;
        default:resources.other+=all;
      }
    }
  }
  return {lastSevenDays,resources};
}
