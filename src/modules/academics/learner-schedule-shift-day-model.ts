type LearnerScheduleView = "month" | "week" | "day";
/** Moving Week or Day must move the selected agenda date, not leave it in the previous period. */
export function learnerScheduleDayAfterShift(anchor:Date,view:LearnerScheduleView):string {
  const next = view==="month"
    ? new Date(anchor.getFullYear(),anchor.getMonth(),1)
    : anchor;
  const year=next.getFullYear();
  const month=String(next.getMonth()+1).padStart(2,"0");
  const day=String(next.getDate()).padStart(2,"0");
  return `${year}-${month}-${day}`;
}
