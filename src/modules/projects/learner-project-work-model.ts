export type LearnerProjectProgressCounts = {
  totalTasks:number;completedTasks:number;blockedTasks:number;
};
/** An actionable blocker exists only if the live project has persisted blocked tasks. */
export function learnerProjectHasBlockedTasks(
  projectStatus:string, progress:LearnerProjectProgressCounts|undefined,
): boolean {
  return projectStatus!=="ARCHIVED" && projectStatus!=="COMPLETED" &&
    (progress?.blockedTasks??0)>0;
}

/** Zero persisted tasks is distinct from unavailable progress; archived projects are excluded. */
export function learnerProjectHasNoTrackedTasks(
 projectStatus:string,progress:LearnerProjectProgressCounts|undefined,
):boolean {
 return projectStatus!=="ARCHIVED" && projectStatus!=="COMPLETED" &&
  progress!==undefined && progress.totalTasks===0;
}
