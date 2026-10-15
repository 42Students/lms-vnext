import { localDayKey, type LearnerScheduleView } from "@/components/academics/learner-schedule-model";
/** Moving Week or Day must move the selected agenda date, not leave it in the previous period. */
export function learnerScheduleDayAfterShift(anchor:Date,view:LearnerScheduleView):string {
  const next = view==="month"
    ? new Date(anchor.getFullYear(),anchor.getMonth(),1)
    : anchor;
  return localDayKey(next);
}
