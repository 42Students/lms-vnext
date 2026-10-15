/** Reset only selectors over the already-authorized learner delivery list. */
export function learnerScheduleResetFilters(courses: readonly {deliveryId:string}[]) {
  return { search:"",kind:"ALL" as const,sectionId:"",upcomingOnly:false,
    deliveryIds:[...new Set(courses.map(course=>course.deliveryId))] };
}
