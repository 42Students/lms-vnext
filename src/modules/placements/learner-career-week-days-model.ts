import {shiftCareerCalendarDay,type CareerCalendarEvent} from "./learner-career-calendar-model";
import {learnerMobileCareerAgenda} from "./learner-mobile-career-agenda-model";
/** Render the complete seven-day IST week, including genuinely empty days. */
export function learnerCareerWeekDays(start:string,events:readonly CareerCalendarEvent[]){
  const groups=new Map(learnerMobileCareerAgenda(events).map(day=>[day.dayKey,day.events]));
  return Array.from({length:7},(_,i)=>{
    const dayKey=shiftCareerCalendarDay(start,"day",i);
    return {dayKey,events:groups.get(dayKey)??[]};
  });
}
