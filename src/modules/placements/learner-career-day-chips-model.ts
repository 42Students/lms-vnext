import type {CareerCalendarEvent} from "./learner-career-calendar-model";

/** Display only already-authorized events; never guess missing schedule details. */
export function learnerCareerDayChips(events:readonly CareerCalendarEvent[]) {
  const sorted=[...events].sort((a,b)=>a.start.getTime()-b.start.getTime()||a.key.localeCompare(b.key));
  return {
    visible:sorted.slice(0,2).map(({key,title,kind})=>({key,title,kind})),
    hidden:Math.max(0,sorted.length-2),
  };
}
