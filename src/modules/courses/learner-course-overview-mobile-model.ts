export type LearnerCourseOverviewJump={id:string;label:string};
export function learnerCourseOverviewJumps({
  hasPublishedPath,hasUpdates,
}:{hasPublishedPath:boolean;hasUpdates:boolean}):LearnerCourseOverviewJump[]{
  return [
    {id:"course-overview-about",label:"About"},
    ...(hasPublishedPath?[{id:"course-overview-path",label:"Learning path"}]:[]),
    {id:"course-overview-next",label:"Next step"},
    {id:"course-overview-progress",label:"Progress"},
    ...(hasUpdates?[{id:"course-overview-updates",label:"Updates"}]:[]),
  ];
}
