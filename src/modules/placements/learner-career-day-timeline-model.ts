import type {CareerCalendarEvent} from "./learner-career-calendar-model";
/** Only rounds within the chosen already-authorized IST day. */
export function learnerCareerDayTimeline(events:readonly CareerCalendarEvent[],dayKey:string){
  const selected=events.filter(event=>event.dayKey===dayKey)
    .sort((a,b)=>a.start.getTime()-b.start.getTime()||a.key.localeCompare(b.key));
  return {events:selected,first:selected[0]??null,last:selected.at(-1)??null};
}
