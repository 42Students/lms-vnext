import type {HrCalendarCategory} from "./hr-calendar-category-model";
export type HrNextCalendarEvent={kind:string;title:string;startsAt:Date};
export type HrNextResultsDue={roundName:string;dueAt:Date};
export function hrNextCalendarEvent(
 events:readonly HrNextCalendarEvent[],due:readonly HrNextResultsDue[],
 category:HrCalendarCategory,now:Date,
):{title:string;at:Date}|null{
 const upcoming=events.filter(item=>Number.isFinite(item.startsAt.getTime())&&
  item.startsAt.getTime()>=now.getTime()&&
  (item.kind==="ROUND"||item.kind==="APPLICATION_DEADLINE")&&
  (category==="ALL"||(category==="ROUNDS"&&item.kind==="ROUND")||
   (category==="DEADLINES"&&item.kind==="APPLICATION_DEADLINE")))
  .map(item=>({title:item.title,at:item.startsAt}));
 if(category==="ALL"||category==="RESULTS_DUE")
  for(const item of due)if(Number.isFinite(item.dueAt.getTime())&&item.dueAt.getTime()>=now.getTime())
    upcoming.push({title:"Results due: "+item.roundName,at:item.dueAt});
 upcoming.sort((a,b)=>a.at.getTime()-b.at.getTime()||a.title.localeCompare(b.title));
 return upcoming[0]??null;
}
