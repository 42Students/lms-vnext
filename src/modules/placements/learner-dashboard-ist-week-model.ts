import {careerDayKey} from "./learner-career-calendar-model";
import type {PlacementDashboardEvent} from "./learner-dashboard-model";
const dateLabel=new Intl.DateTimeFormat("en-IN",{timeZone:"UTC",weekday:"short",day:"numeric",month:"short"});
/** Seven IST *calendar days* from today, not an eight-day rolling 168h window. */
export function learnerDashboardIstWeekDays(
 events:readonly PlacementDashboardEvent[],now:Date,
){
 const today=careerDayKey(now);
 const base=new Date(today+"T12:00:00.000Z");
 return Array.from({length:7},(_,index)=>{
  const day=new Date(base.getTime()+index*86400000);
  const date=day.toISOString().slice(0,10);
  const own=events.filter(event=>careerDayKey(event.when)===date);
  return {date,label:dateLabel.format(day),events:own,total:own.length};
 });
}
