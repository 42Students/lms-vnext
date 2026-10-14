/** A course has a next step only when an active published path gives one. */
export function learnerCourseHasContinueAction(course:{
  readOnly:boolean;learningPathReady:boolean;
  nextItem:object|null;nextDue:object|null;
}):boolean {
  return !course.readOnly && course.learningPathReady &&
    (course.nextItem!==null || course.nextDue!==null);
}
