/** Quick-view attention counts describe the selected authorized Course,
 * while the aggregate Course selector and global item total remain available. */
export function learnerAssessmentScopedItems<T extends {courseId:string}>(
 items:readonly T[],activeCourseId:string,
):T[]{
 return activeCourseId?items.filter(item=>item.courseId===activeCourseId):[...items];
}
