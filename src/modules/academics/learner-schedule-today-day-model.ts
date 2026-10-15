import { learnerScheduleIstDay } from "./learner-ist-schedule-model";
/** LOCAL view follows device day; learner IST view follows the college calendar. */
export function learnerScheduleTodayDay(instant:Date,mode:"LOCAL"|"IST"):string {
  if(mode==="IST")return learnerScheduleIstDay(instant);
  const year=instant.getFullYear();
  const month=String(instant.getMonth()+1).padStart(2,"0");
  const day=String(instant.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}
