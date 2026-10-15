type Filter={courseId:string;search:string;stateFilter:"ALL"|"PENDING"|"DUE_SOON"|"OVERDUE"|"COMPLETED"|"RESULTS";sort:"DUE"|"CREATED"|"TITLE"};
/** A selected Course and each aggregate state can be reset without leaving the page. */
export function learnerAssessmentFiltersActive(f:Filter):boolean {
 return Boolean(f.courseId || f.search.trim()) || f.stateFilter!=="ALL" || f.sort!=="DUE";
}
