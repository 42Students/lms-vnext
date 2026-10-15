/** Aggregate assessment course metric reflects the selected authorized Course. */
export function learnerAssessmentCourseScopeCount(
 courses:readonly {id:string}[],selectedId:string,
):number{
 return selectedId ? Number(courses.some(course=>course.id===selectedId)) : courses.length;
}
