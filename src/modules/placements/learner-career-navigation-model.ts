import {parseLearnerCareerDate} from "./learner-career-date-model";
import {shiftCareerCalendarDay,type CareerCalendarView} from "./learner-career-calendar-model";
/** Disallow period-navigation URLs that would fail the same boundary parser. */
export function learnerCareerNavigationDate(anchor:string,view:CareerCalendarView,step:-1|1):string|null {
  if(!parseLearnerCareerDate(anchor))return null;
  return parseLearnerCareerDate(shiftCareerCalendarDay(anchor,view,step));
}
