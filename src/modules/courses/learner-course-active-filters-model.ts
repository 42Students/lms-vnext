export type LearnerCourseActiveFilters = {
  query:string;typeFilter:"all"|"core"|"elective";continueOnly:boolean;
  progressFilter:"ALL"|"NOT_STARTED"|"IN_PROGRESS"|"COMPLETED"|"UNMEASURED";
  termState:"ALL"|"CURRENT"|"HISTORY";sortMode:"NAME"|"PROGRESS"|"DUE"|"RECENT";
};
/** Semester is deliberately excluded: clearing filters must not change the selected semester. */
export function learnerCourseHasActiveFilters(filters: LearnerCourseActiveFilters):boolean {
  return Boolean(filters.query.trim()) || filters.typeFilter!=="all" || filters.continueOnly ||
    filters.progressFilter!=="ALL" || filters.termState!=="ALL" || filters.sortMode!=="NAME";
}
