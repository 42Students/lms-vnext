import type { LearnerScheduleView } from "@/components/academics/learner-schedule-model";
/** Week/Day exports are restricted to the already-filtered IST learner agenda. */
export function learnerScheduleWeekdayExportAvailable(view:LearnerScheduleView,mode:"IST"|"LOCAL",count:number):boolean {
 return (view==="week"||view==="day") && mode==="IST" && Number.isSafeInteger(count) && count>0;
}
