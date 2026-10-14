import type { CareerCalendarEvent } from "./learner-career-calendar-model";
export type LearnerMobileCareerAgendaDay={
  dayKey:string;events:CareerCalendarEvent[];
};
/** Date groups use the canonical IST day key; source events are not mutated. */
export function learnerMobileCareerAgenda(events:readonly CareerCalendarEvent[]):LearnerMobileCareerAgendaDay[] {
  const buckets=new Map<string,CareerCalendarEvent[]>();
  for(const event of events){
    const bucket=buckets.get(event.dayKey)??[];
    bucket.push(event);
    buckets.set(event.dayKey,bucket);
  }
  return [...buckets].sort(([a],[b])=>a.localeCompare(b)).map(([dayKey,items])=>({
    dayKey,events:[...items].sort((a,b)=>a.start.getTime()-b.start.getTime()||
      a.key.localeCompare(b.key)),
  }));
}
