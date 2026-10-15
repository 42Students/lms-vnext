export type LearnerCourseTypeFilter="all"|"core"|"elective";
/** A stale filter must not hide every course after membership/semester data refreshes. */
export function resolveLearnerCourseTypeFilter(
  selected:LearnerCourseTypeFilter,coreCount:number,electiveCount:number,
):LearnerCourseTypeFilter {
  if(selected==="elective" && electiveCount===0)return "all";
  if(selected==="core" && coreCount===0)return "all";
  return selected;
}
