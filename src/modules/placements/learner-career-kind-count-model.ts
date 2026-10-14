import type {CareerCalendarEvent} from "./learner-career-calendar-model";
export function learnerCareerKindCounts(events:readonly CareerCalendarEvent[]) {
  const totals={total:0,assessments:0,interviews:0,other:0};
  for(const event of events){
    totals.total+=1;
    if(event.kind==="ASSESSMENT")totals.assessments+=1;
    else if(event.kind==="INTERVIEW")totals.interviews+=1;
    else totals.other+=1;
  }
  return totals;
}
