/** Switching semester must not leave an invisible elective-only filter active. */
export function learnerCourseSemesterFilterReset() {
  return {search:"",type:"all" as const,visibleLimit:48};
}
