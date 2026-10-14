import {careerCalendarPeriod,learnerCareerIcal,type CareerCalendarView,type CareerCalendarEvent} from "./learner-career-calendar-model";
/** Export only visible already-authorized events in the chosen IST period. */
export function learnerCareerSelectedPeriodIcal(
  events:readonly CareerCalendarEvent[],anchor:string,view:CareerCalendarView,issuedAt:Date,
) {
  const selected=careerCalendarPeriod(events,anchor,view).events;
  return {count:selected.length,ical:learnerCareerIcal(selected,issuedAt)};
}
