/** Recover when a learner is unenrolled from a previously selected Course. */
export function learnerAssessmentActiveCourse(selected:string,courses:readonly {id:string}[]):string {
 return selected && courses.some(course=>course.id===selected) ? selected : "";
}
