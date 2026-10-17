import {placementCalendarDayKey,type PlacementCalendarEvent} from "./placement-calendar-model";

export function summarizeTpoCalendarNeeds(events:readonly PlacementCalendarEvent[],blockedDays:ReadonlySet<string>,now:Date){
 const overdue=events.filter(item=>item.kind==="FOLLOW_UP"&&item.status==="OPEN"&&item.startsAt<now);
 const blockedRounds=events.filter(item=>item.kind==="ROUND"&&blockedDays.has(placementCalendarDayKey(item.startsAt)));
 const dayCounts=new Map<string,number>();
 for(const event of events){
  if(event.kind==="BLOCKED")continue;
  const day=placementCalendarDayKey(event.startsAt);
  dayCounts.set(day,(dayCounts.get(day)??0)+1);
 }
 const busyDays=[...dayCounts].filter(([,count])=>count>=3);
 return {overdue,blockedRounds,busyDays};
}
